import { readFile, writeFile } from "node:fs/promises";

const MIN_PER_CATEGORY = 3;
const MAX_PER_CATEGORY = 5;
const KOREA_TIME_ZONE = "Asia/Seoul";

const feeds = [
  {
    category: "society",
    queries: ["사회 이슈", "정책 교육 복지 노동 주거", "한국 사회 뉴스"],
  },
  {
    category: "ai",
    queries: ["인공지능", "생성형AI 반도체 데이터센터", "AI 기술 산업"],
  },
];

const dataFile = new URL("../data/news.json", import.meta.url);
const archiveFile = new URL("../data/archive.json", import.meta.url);
const previous = await readPreviousData();
const archive = await readArchiveData();
const windowRange = getKoreaSevenAmWindow();

const articles = [];

for (const feed of feeds) {
  const picked = await fetchBingNews(feed, windowRange);
  articles.push(...backfill(feed.category, picked));
}

const payload = {
  updatedAt: formatKoreaDate(windowRange.end),
  windowStart: windowRange.start.toISOString(),
  windowEnd: windowRange.end.toISOString(),
  articles,
};

await writeFile(dataFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(archiveFile, `${JSON.stringify(updateArchive(payload), null, 2)}\n`, "utf8");
console.log(`Updated ${articles.length} Korean articles from ${payload.windowStart} to ${payload.windowEnd}.`);

async function fetchBingNews(feed, range) {
  const allItems = [];

  for (const query of feed.queries) {
    allItems.push(...(await fetchBingNewsByQuery(feed, query)));
  }

  const deduped = dedupeArticles(allItems).filter((item) => item.imageUrl);
  const inWindow = deduped.filter((item) => item.publishedDate >= range.start && item.publishedDate < range.end);
  const candidates = inWindow.length >= MIN_PER_CATEGORY ? inWindow : [...inWindow, ...deduped];

  return dedupeArticles(candidates)
    .slice(0, MAX_PER_CATEGORY)
    .map((item) => ({
      category: feed.category,
      title: item.title,
      summary: item.summary || `${item.source}에서 보도한 주요 기사입니다.`,
      source: item.source,
      publishedAt: formatKoreaDate(item.publishedDate),
      url: item.url,
      imageUrl: item.imageUrl,
    }));
}

async function fetchBingNewsByQuery(feed, query) {
  const url = new URL("https://www.bing.com/news/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "rss");
  url.searchParams.set("cc", "KR");
  url.searchParams.set("setlang", "ko");
  url.searchParams.set("mkt", "ko-KR");

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 DailyNewsBot/1.0" },
    });
    if (!response.ok) {
      console.warn(`Bing News request failed for ${feed.category}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseBingItems(xml);
  } catch (error) {
    console.warn(`Bing News request errored for ${feed.category}: ${error.message}`);
    return [];
  }
}

function parseBingItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

  return items
    .map((item) => {
      const title = decodeXml(readTag(item, "title"));
      const rawUrl = decodeXml(readTag(item, "link"));
      const source = decodeXml(readTag(item, "News:Source")) || "News";
      const publishedDate = new Date(decodeXml(readTag(item, "pubDate")));
      const summary = stripHtml(decodeXml(readTag(item, "description")));
      const imageUrl = normalizeBingImageUrl(decodeXml(readTag(item, "News:Image")));

      return {
        title,
        summary,
        source,
        publishedDate,
        url: extractOriginalUrl(rawUrl) || rawUrl,
        imageUrl,
      };
    })
    .filter((item) => item.title && item.url && !Number.isNaN(item.publishedDate.getTime()));
}

function normalizeBingImageUrl(value) {
  if (!value) return "";
  const imageUrl = value.replace(/^http:\/\//, "https://");

  try {
    const url = new URL(imageUrl);
    if (url.hostname === "www.bing.com" && url.pathname === "/th") {
      url.searchParams.set("w", "1200");
      url.searchParams.set("h", "675");
      url.searchParams.set("c", "14");
    }
    return url.href;
  } catch {
    return imageUrl;
  }
}

function extractOriginalUrl(value) {
  try {
    const url = new URL(value);
    const original = url.searchParams.get("url");
    return original ? decodeXml(original) : value;
  } catch {
    return value;
  }
}

function readTag(item, tag) {
  return item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "";
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .trim();
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function readPreviousData() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    return { articles: [] };
  }
}

async function readArchiveData() {
  try {
    return JSON.parse(await readFile(archiveFile, "utf8"));
  } catch {
    return [];
  }
}

function updateArchive(payload) {
  const withoutToday = archive.filter((entry) => entry.updatedAt !== payload.updatedAt);
  const nextArchive = [payload, ...withoutToday].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const cutoff = new Date(payload.updatedAt);
  cutoff.setDate(cutoff.getDate() - 6);

  return nextArchive.filter((entry) => {
    const date = new Date(entry.updatedAt);
    return !Number.isNaN(date.getTime()) && date >= cutoff;
  });
}

function backfill(category, picked) {
  if (picked.length >= MIN_PER_CATEGORY) return picked.slice(0, MAX_PER_CATEGORY);

  const existing = previous.articles
    .filter((article) => article.category === category)
    .filter((article) => article.imageUrl)
    .filter((article) => !picked.some((item) => normalizeUrl(item.url) === normalizeUrl(article.url)))
    .slice(0, MIN_PER_CATEGORY - picked.length);

  return [...picked, ...existing].slice(0, MAX_PER_CATEGORY);
}

function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = normalizeUrl(article.url || article.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeUrl(value) {
  return String(value).replace(/[?#].*$/, "").trim().toLowerCase();
}

function getKoreaSevenAmWindow() {
  const now = new Date();
  const today = getKoreaParts(now);
  let end = koreaDateTimeToUtc(today.year, today.month, today.day, 7, 0, 0);

  if (now < end) {
    const yesterday = new Date(end);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    end = yesterday;
  }

  const start = new Date(end);
  start.setUTCHours(start.getUTCHours() - 24);

  return { start, end };
}

function getKoreaParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year").value),
    month: Number(parts.find((part) => part.type === "month").value),
    day: Number(parts.find((part) => part.type === "day").value),
  };
}

function koreaDateTimeToUtc(year, month, day, hour, minute, second) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, second));
}

function formatKoreaDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
