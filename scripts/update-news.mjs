import { readFile, writeFile } from "node:fs/promises";

const feeds = [
  {
    category: "society",
    query: '("social policy" OR "public welfare" OR "housing policy" OR "education policy" OR "welfare") sourcelang:english',
  },
  {
    category: "ai",
    query: '("artificial intelligence" OR "generative AI" OR "AI chip" OR "machine learning") sourcelang:english',
  },
];

const endpoint = "https://api.gdeltproject.org/api/v2/doc/doc";
const dataFile = new URL("../data/news.json", import.meta.url);
const previous = await readPreviousData();

const articles = [];

for (const feed of feeds) {
  const picked = await fetchFeed(feed);
  articles.push(...backfill(feed.category, picked));
}

const payload = {
  updatedAt: new Date().toISOString().slice(0, 10),
  articles,
};

await writeFile(dataFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Updated ${articles.length} articles.`);

async function fetchFeed(feed) {
  const url = new URL(endpoint);
  url.searchParams.set("query", feed.query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "12");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("timespan", "7d");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`GDELT request failed for ${feed.category}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.articles ?? [])
      .filter((article) => article.title && article.url)
      .slice(0, 2)
      .map((article) => ({
        category: feed.category,
        title: article.title,
        summary: article.seendate
          ? `${article.domain ?? "News"}에서 보도한 최신 기사입니다.`
          : "자동 수집된 최신 기사입니다.",
        source: article.domain ?? "GDELT",
        publishedAt: article.seendate ? article.seendate.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : new Date().toISOString().slice(0, 10),
        url: article.url,
      }));
  } catch (error) {
    console.warn(`GDELT request errored for ${feed.category}: ${error.message}`);
    return [];
  }
}

async function readPreviousData() {
  try {
    return JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    return { articles: [] };
  }
}

function backfill(category, picked) {
  if (picked.length >= 2) return picked.slice(0, 2);

  const existing = previous.articles
    .filter((article) => article.category === category)
    .slice(0, 2 - picked.length);

  return [...picked, ...existing];
}
