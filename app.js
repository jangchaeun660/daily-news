const state = {
  filter: "all",
  query: "",
  archiveQuery: "",
  selectedArchiveDate: "",
  displayIndex: 0,
  displayTimer: null,
  news: { updatedAt: "", windowStart: "", windowEnd: "", articles: [] },
  archive: [],
};

const placeholderImages = {
  society:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 700'%3E%3Crect width='1200' height='700' fill='%23eaf3f7'/%3E%3Cpath d='M90 535h1020' stroke='%23003f9e' stroke-width='18' stroke-linecap='round' opacity='.18'/%3E%3Ccircle cx='260' cy='250' r='118' fill='%230064c8' opacity='.18'/%3E%3Crect x='430' y='180' width='520' height='64' rx='32' fill='%23001c55' opacity='.2'/%3E%3Crect x='430' y='286' width='390' height='44' rx='22' fill='%23003f9e' opacity='.18'/%3E%3Crect x='430' y='366' width='470' height='44' rx='22' fill='%23003f9e' opacity='.12'/%3E%3C/svg%3E",
  ai:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 700'%3E%3Crect width='1200' height='700' fill='%23eef5ff'/%3E%3Crect x='335' y='155' width='530' height='390' rx='58' fill='%23003f9e' opacity='.16'/%3E%3Cpath d='M470 350h260M600 220v260M470 260h260M470 440h260' stroke='%23001c55' stroke-width='24' stroke-linecap='round' opacity='.28'/%3E%3Ccircle cx='430' cy='350' r='34' fill='%230064c8' opacity='.35'/%3E%3Ccircle cx='770' cy='350' r='34' fill='%230064c8' opacity='.35'/%3E%3C/svg%3E",
};

const fallbackNews = {
  updatedAt: "2026-05-19",
  windowStart: "2026-05-18T22:00:00.000Z",
  windowEnd: "2026-05-19T22:00:00.000Z",
  articles: [
    {
      category: "society",
      title: "최근 24시간 사회 주요 뉴스를 불러오는 중입니다",
      summary: "자동 업데이트가 실행되면 전날 오전 7시 이후부터 오늘 오전 7시까지 올라온 사회 뉴스가 표시됩니다.",
      source: "Daily news",
      publishedAt: "2026-05-19",
      url: "https://news.google.com/search?q=%EC%82%AC%ED%9A%8C%20%EC%9D%B4%EC%8A%88&hl=ko&gl=KR&ceid=KR%3Ako",
      imageUrl: placeholderImages.society,
    },
    {
      category: "ai",
      title: "최근 24시간 AI 주요 뉴스를 불러오는 중입니다",
      summary: "자동 업데이트가 실행되면 전날 오전 7시 이후부터 오늘 오전 7시까지 올라온 AI 뉴스가 표시됩니다.",
      source: "Daily news",
      publishedAt: "2026-05-19",
      url: "https://news.google.com/search?q=AI%20%EC%9D%B4%EC%8A%88&hl=ko&gl=KR&ceid=KR%3Ako",
      imageUrl: placeholderImages.ai,
    },
  ],
};

const lists = {
  societySection: document.querySelector("#society"),
  aiSection: document.querySelector("#ai"),
  society: document.querySelector("#societyList"),
  ai: document.querySelector("#aiList"),
  archive: document.querySelector("#archiveList"),
};

const views = {
  home: document.querySelector("#homeView"),
  article: document.querySelector("#articleView"),
  display: document.querySelector("#displayView"),
};

const updatedAt = document.querySelector("#updatedAt");
const todayCount = document.querySelector("#todayCount");
const newsWindow = document.querySelector("#newsWindow");
const searchInput = document.querySelector("#searchInput");
const archiveSearchInput = document.querySelector("#archiveSearchInput");
const chips = document.querySelectorAll(".chip");
const navLinks = document.querySelectorAll("[data-view-link]");
const archiveRange = document.querySelector("#archiveRange");
const archiveDateInput = document.querySelector("#archiveDateInput");
const archiveClearButton = document.querySelector("#archiveClearButton");
const displayMedia = document.querySelector("#displayMedia");
const displayTag = document.querySelector("#displayTag");
const displayCounter = document.querySelector("#displayCounter");
const displayTitle = document.querySelector("#displayTitle");
const displaySummary = document.querySelector("#displaySummary");
const displayMeta = document.querySelector("#displayMeta");
const displayLink = document.querySelector("#displayLink");
const displayDots = document.querySelector("#displayDots");

async function loadNews() {
  state.news = await fetchJson("data/news.json", fallbackNews);
  state.archive = await fetchJson("data/archive.json", [state.news]);
  if (!state.archive.some((entry) => entry.updatedAt === state.news.updatedAt)) {
    state.archive = [state.news, ...state.archive];
  }
  state.archive = getRecentArchive(state.archive);

  setupArchiveDatePicker();
  updatedAt.textContent = formatDate(state.news.updatedAt);
  todayCount.textContent = `${state.news.articles.length} updates`;
  newsWindow.textContent = formatWindow(state.news.windowStart, state.news.windowEnd);
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
    return matchesCategory && articleMatchesQuery(article, state.query);
  });

  renderList(lists.society, filtered.filter((article) => article.category === "society"), state.news.updatedAt);
  renderList(lists.ai, filtered.filter((article) => article.category === "ai"), state.news.updatedAt);
  toggleSectionVisibility();
  renderArchive();
  renderDisplay();
}

function toggleSectionVisibility() {
  lists.societySection.classList.toggle("hidden", state.filter === "ai");
  lists.society.classList.toggle("hidden", state.filter === "ai");
  lists.aiSection.classList.toggle("hidden", state.filter === "society");
  lists.ai.classList.toggle("hidden", state.filter === "society");
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

function renderArchive() {
  lists.archive.innerHTML = "";

  const baseEntries = state.selectedArchiveDate
    ? state.archive.filter((entry) => entry.updatedAt === state.selectedArchiveDate)
    : state.archive;
  const entries = baseEntries
    .map((entry) => ({
      ...entry,
      articles: entry.articles.filter((article) => articleMatchesQuery(article, state.archiveQuery)),
    }))
    .filter((entry) => entry.articles.length);

  if (!entries.length) {
    const message = state.archiveQuery
      ? "검색 결과가 없습니다."
      : state.selectedArchiveDate
        ? `${formatDate(state.selectedArchiveDate)}에 올라온 기사 기록이 없습니다.`
        : "최근 7일 기사 기록이 없습니다.";
    lists.archive.innerHTML = `<div class="empty">${message}</div>`;
    archiveRange.textContent = state.selectedArchiveDate ? `${formatDate(state.selectedArchiveDate)} 기사` : "최근 7일 기사";
    return;
  }

  if (state.selectedArchiveDate) {
    archiveRange.textContent = `${formatDate(state.selectedArchiveDate)} 기사 ${countArticles(entries)}개`;
  } else if (state.archiveQuery) {
    archiveRange.textContent = `검색 결과 ${countArticles(entries)}개`;
  } else {
    const newest = entries[0]?.updatedAt;
    const oldest = entries[entries.length - 1]?.updatedAt;
    archiveRange.textContent = `${formatDate(oldest)} - ${formatDate(newest)}`;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const heading = document.createElement("h3");
    heading.className = "archive-day";
    heading.textContent = `${formatDate(entry.updatedAt)} 업데이트`;
    fragment.appendChild(heading);

    entry.articles.forEach((article) => fragment.appendChild(createCard(article, entry.updatedAt)));
  });

  lists.archive.appendChild(fragment);
}

function createCard(article, updatedDate) {
  const card = document.createElement("article");
  card.className = "news-card";
  const imageUrl = getArticleImage(article);

  card.innerHTML = `
    <img class="news-thumb" src="${escapeAttribute(imageUrl)}" alt="" loading="lazy" />
    <div>
      <span class="tag ${article.category}">${getCategoryLabel(article.category)}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <div class="meta">
        <span><strong>Updated</strong> ${formatDate(updatedDate)}</span>
        <span><strong>Article</strong> ${formatDate(article.publishedAt)}</span>
        <span>${escapeHtml(article.source)}</span>
      </div>
    </div>
    <a class="read-link" href="${escapeAttribute(article.url)}" target="_blank" rel="noreferrer">Read</a>
  `;

  const image = card.querySelector(".news-thumb");
  image.addEventListener("error", () => {
    image.src = placeholderImages[article.category] || placeholderImages.society;
  });

  return card;
}

function renderDisplay() {
  const articles = state.news.articles;
  if (!articles.length) return;
  if (state.displayIndex >= articles.length) state.displayIndex = 0;

  const article = articles[state.displayIndex];
  const imageUrl = getArticleImage(article);
  displayMedia.style.backgroundImage = `linear-gradient(90deg, rgba(0, 19, 53, 0.24), rgba(0, 19, 53, 0.86)), url("${imageUrl}")`;
  displayTag.className = `tag ${article.category}`;
  displayTag.textContent = getCategoryLabel(article.category);
  displayCounter.textContent = `${state.displayIndex + 1} / ${articles.length}`;
  displayTitle.textContent = article.title;
  displaySummary.textContent = article.summary;
  displayMeta.textContent = `${article.source} · ${formatDate(article.publishedAt)} · ${formatWindow(state.news.windowStart, state.news.windowEnd)}`;
  displayLink.href = article.url;
  displayDots.innerHTML = articles
    .map((_, index) => `<span class="${index === state.displayIndex ? "active" : ""}"></span>`)
    .join("");

  const image = new Image();
  image.onerror = () => {
    displayMedia.style.backgroundImage = `linear-gradient(90deg, rgba(0, 19, 53, 0.24), rgba(0, 19, 53, 0.86)), url("${placeholderImages[article.category] || placeholderImages.society}")`;
  };
  image.src = imageUrl;
}

function route() {
  const target = window.location.hash === "#article" ? "article" : window.location.hash === "#display" ? "display" : "home";
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("hidden", name !== target));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.viewLink === target));
  document.body.classList.toggle("display-mode", target === "display");

  if (target === "display") {
    startDisplayRotation();
  } else {
    stopDisplayRotation();
  }
}

function startDisplayRotation() {
  stopDisplayRotation();
  if (!state.news.articles.length) return;
  renderDisplay();
  state.displayTimer = window.setInterval(() => {
    state.displayIndex = (state.displayIndex + 1) % state.news.articles.length;
    renderDisplay();
  }, 10000);
}

function stopDisplayRotation() {
  if (state.displayTimer) {
    window.clearInterval(state.displayTimer);
    state.displayTimer = null;
  }
}

function setupArchiveDatePicker() {
  if (!archiveDateInput || !state.archive.length) return;

  const dates = state.archive.map((entry) => entry.updatedAt).sort();
  archiveDateInput.min = dates[0];
  archiveDateInput.max = dates[dates.length - 1];
}

function articleMatchesQuery(article, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchTarget = `${article.title} ${article.summary} ${article.source} ${article.category}`.toLowerCase();
  return searchTarget.includes(normalizedQuery);
}

function countArticles(entries) {
  return entries.reduce((total, entry) => total + entry.articles.length, 0);
}

function getArticleImage(article) {
  const imageUrl = article.imageUrl || "";
  const looksLikeSourceIcon = imageUrl.includes("lh3.googleusercontent.com") && imageUrl.includes("s0-w300");
  return looksLikeSourceIcon ? placeholderImages[article.category] : imageUrl || placeholderImages[article.category] || placeholderImages.society;
}

function getCategoryLabel(category) {
  return category === "ai" ? "AI" : "Society";
}

function formatWindow(startValue, endValue) {
  if (!startValue || !endValue) return "업데이트 기준 직전 24시간";

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "업데이트 기준 직전 24시간";

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
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

function getRecentArchive(entries) {
  const sorted = [...entries].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const latest = sorted[0]?.updatedAt;
  if (!latest) return [];

  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - 6);

  return sorted.filter((entry) => {
    const date = new Date(entry.updatedAt);
    return !Number.isNaN(date.getTime()) && date >= cutoff;
  });
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
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

archiveSearchInput?.addEventListener("input", (event) => {
  state.archiveQuery = event.target.value;
  renderArchive();
});

archiveDateInput?.addEventListener("change", (event) => {
  state.selectedArchiveDate = event.target.value;
  renderArchive();
});

archiveClearButton?.addEventListener("click", () => {
  state.selectedArchiveDate = "";
  archiveDateInput.value = "";
  renderArchive();
});

window.addEventListener("hashchange", route);

loadNews();
