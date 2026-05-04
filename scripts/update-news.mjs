import { readFile, writeFile } from "node:fs/promises";

const feeds = [
  {
    category: "society",
    query: "사회 복지 주거 교육 정책",
  },
  {
    category: "ai",
    query: "인공지능 AI 반도체 삼성 네이버",
  },
];

const dataFile = new URL("../data/news.json", import.meta.url);
const archiveFile = new URL("../data/archive.json", import.meta.url);
const previous = await readPreviousData();
const archive = await readArchiveData();

const articles = [];

for (const feed of feeds) {
  const picked = await fetchGoogleNews(feed);
  articles.push(...backfill(feed.category, picked));
}

const payload = {
  updatedAt: getKoreaDate(),
  articles,
};

await writeFile(dataFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(archiveFile, `${JSON.stringify(updateArchive(payload), null, 2)}\n`, "utf8");
console.log(`Updated ${articles.length} Korean articles.`);

async function fetchGoogleNews(feed) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", feed.query);
  url.searchParams.set("hl", "ko");
  url.searchParams.set("gl", "KR");
  url.searchParams.set("ceid", "KR:ko");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Google News request failed for ${feed.category}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseRssItems(xml)
      .slice(0, 2)
      .map((item) => ({
        category: feed.category,
        title: item.title,
        summary: `${item.source}에서 보도한 한국어 최신 기사입니다.`,
        source: item.source,
        publishedAt: item.publishedAt,
        url: item.url,
      }));
  } catch (error) {
    console.warn(`Google News request errored for ${feed.category}: ${error.message}`);
    return [];
  }
}

function parseRssItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

  return items
    .map((item) => {
      const title = stripGoogleNewsSource(decodeXml(readTag(item, "title")));
      const url = decodeXml(readTag(item, "link"));
      const source = decodeXml(readSource(item)) || "Google News";
      const pubDate = new Date(decodeXml(readTag(item, "pubDate")));
      const publishedAt = Number.isNaN(pubDate.getTime())
        ? getKoreaDate()
        : new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(pubDate);

      return { title, url, source, publishedAt };
    })
    .filter((item) => item.title && item.url);
}

function readTag(item, tag) {
  return item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "";
}

function readSource(item) {
  return item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "";
}

function stripGoogleNewsSource(title) {
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
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
  return [payload, ...withoutToday].slice(0, 30);
}

function backfill(category, picked) {
  if (picked.length >= 2) return picked.slice(0, 2);

  const existing = previous.articles
    .filter((article) => article.category === category)
    .slice(0, 2 - picked.length);

  return [...picked, ...existing];
}

function getKoreaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
