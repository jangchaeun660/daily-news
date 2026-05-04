const state = {
  filter: "all",
  query: "",
  news: { updatedAt: "", articles: [] },
  archive: [],
  selectedArchiveDate: "",
};

const fallbackNews = {
  updatedAt: "2026-05-04",
  articles: [
    {
      category: "society",
      title: "AI chip boom spurs new 'aristocracy,' rippling from housing to college admissions",
      summary: "반도체 슈퍼사이클이 한국의 주거 시장과 입시 환경까지 흔드는 새 고소득 계층을 만들고 있다는 분석입니다.",
      source: "Korea JoongAng Daily",
      publishedAt: "2026-05-04",
      url: "https://koreajoongangdaily.joins.com/news/2026-05-04/business/economy/AI-chip-boom-spurs-new-aristocracy-rippling-from-housing-to-college-admissions/2580191",
    },
    {
      category: "society",
      title: "President warns of 'excessive or unfair' union demands as Samsung strike looms",
      summary: "삼성전자 파업 가능성을 앞두고 노동조합 요구와 사회적 책임을 둘러싼 논의가 커지고 있습니다.",
      source: "Korea JoongAng Daily",
      publishedAt: "2026-04-30",
      url: "https://koreajoongangdaily.joins.com/news/2026-04-30/national/politics/President-warns-of-excessive-or-unfair-union-demands-as-Samsung-strike-looms/2582221",
    },
    {
      category: "ai",
      title: "Samsung's Net Profit Soars as AI Demand Fuels Record Chip Earnings",
      summary: "AI 메모리 수요 확대가 삼성전자의 2026년 1분기 기록적 실적을 견인했다는 보도입니다.",
      source: "Wall Street Journal",
      publishedAt: "2026-05-01",
      url: "https://www.wsj.com/business/earnings/samsungs-net-profit-soars-as-ai-demand-fuels-record-chip-earnings-3d62cc69",
    },
    {
      category: "ai",
      title: "Naver Posts Weaker First-Quarter Earnings",
      summary: "네이버가 AI 기능과 GPU 투자를 확대하는 가운데 비용 증가로 1분기 순이익이 감소했다는 분석입니다.",
      source: "Wall Street Journal",
      publishedAt: "2026-04-30",
      url: "https://www.wsj.com/business/earnings/naver-posts-weaker-first-quarter-earnings-1a3511ec",
    },
  ],
};

const lists = {
  society: document.querySelector("#societyList"),
  ai: document.querySelector("#aiList"),
  archive: document.querySelector("#archiveList"),
};

const views = {
  home: document.querySelector("#homeView"),
  article: document.querySelector("#articleView"),
};

const updatedAt = document.querySelector("#updatedAt");
const todayCount = document.querySelector("#todayCount");
const searchInput = document.querySelector("#searchInput");
const chips = document.querySelectorAll(".chip");
const navLinks = document.querySelectorAll("[data-view-link]");
const archiveDates = document.querySelector("#archiveDates");

async function loadNews() {
  state.news = await fetchJson("data/news.json", fallbackNews);
  state.archive = await fetchJson("data/archive.json", [state.news]);
  if (!state.archive.some((entry) => entry.updatedAt === state.news.updatedAt)) {
    state.archive = [state.news, ...state.archive];
  }

  state.selectedArchiveDate = state.archive[0]?.updatedAt ?? state.news.updatedAt;
  updatedAt.textContent = formatDate(state.news.updatedAt);
  todayCount.textContent = `${state.news.articles.length} updates`;
  render();
  route();
}

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${path} unavailable`);
    return response.json();
  } catch {
    return fallback;
  }
}

function render() {
  const filtered = state.news.articles.filter((article) => {
    const matchesCategory = state.filter === "all" || article.category === state.filter;
    const searchTarget = `${article.title} ${article.summary} ${article.source}`.toLowerCase();
    return matchesCategory && searchTarget.includes(state.query.toLowerCase());
  });

  renderList(lists.society, filtered.filter((article) => article.category === "society"), state.news.updatedAt);
  renderList(lists.ai, filtered.filter((article) => article.category === "ai"), state.news.updatedAt);
  renderArchiveDates();
  renderArchive();
}

function renderList(container, articles, updatedDate) {
  container.innerHTML = "";

  if (!articles.length) {
    container.innerHTML = '<div class="empty">표시할 뉴스가 없습니다.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  articles.forEach((article) => fragment.appendChild(createCard(article, updatedDate)));
  container.appendChild(fragment);
}

function renderArchiveDates() {
  archiveDates.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.archive.forEach((entry) => {
    const button = document.createElement("button");
    button.className = `date-tab${entry.updatedAt === state.selectedArchiveDate ? " active" : ""}`;
    button.type = "button";
    button.textContent = formatDate(entry.updatedAt);
    button.addEventListener("click", () => {
      state.selectedArchiveDate = entry.updatedAt;
      renderArchiveDates();
      renderArchive();
    });
    fragment.appendChild(button);
  });

  archiveDates.appendChild(fragment);
}

function renderArchive() {
  const entry = state.archive.find((item) => item.updatedAt === state.selectedArchiveDate) ?? state.archive[0];
  renderList(lists.archive, entry?.articles ?? [], entry?.updatedAt ?? state.news.updatedAt);
}

function createCard(article, updatedDate) {
  const card = document.createElement("article");
  card.className = "news-card";

  const label = article.category === "ai" ? "AI" : "Society";

  card.innerHTML = `
    <div class="date-badge">${formatShortDate(updatedDate)}</div>
    <div>
      <span class="tag ${article.category}">${label}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <div class="meta">
        <span><strong>Updated</strong> ${formatDate(updatedDate)}</span>
        <span><strong>Article</strong> ${formatDate(article.publishedAt)}</span>
        <span>${escapeHtml(article.source)}</span>
      </div>
    </div>
    <a class="read-link" href="${article.url}" target="_blank" rel="noreferrer">Read</a>
  `;

  return card;
}

function route() {
  const target = window.location.hash === "#article" ? "article" : "home";
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("hidden", name !== target));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.viewLink === target));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NEW";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    state.filter = chip.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

window.addEventListener("hashchange", route);

loadNews();
