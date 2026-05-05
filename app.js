const state = {
  filter: "all",
  query: "",
  selectedArchiveDate: "",
  news: { updatedAt: "", articles: [] },
  archive: [],
};

const fallbackNews = {
  updatedAt: "2026-05-04",
  articles: [
    {
      category: "society",
      title: "사회 안전망과 복지 정책을 둘러싼 논의가 이어지고 있습니다",
      summary: "정부와 지자체의 복지, 교육, 주거 정책 변화를 중심으로 시민 생활에 영향을 주는 이슈를 정리했습니다.",
      source: "Daily news",
      publishedAt: "2026-05-04",
      url: "https://news.google.com/search?q=%EC%82%AC%ED%9A%8C%20%EB%B3%B5%EC%A7%80%20%EC%A0%95%EC%B1%85&hl=ko&gl=KR&ceid=KR%3Ako",
    },
    {
      category: "society",
      title: "교육과 보육 지원 확대 관련 정책 뉴스가 주목받고 있습니다",
      summary: "유아 교육, 돌봄, 보육 지원 등 가정과 학교 현장에 연결되는 주요 사회 뉴스를 모았습니다.",
      source: "Daily news",
      publishedAt: "2026-05-04",
      url: "https://news.google.com/search?q=%EA%B5%90%EC%9C%A1%20%EB%B3%B4%EC%9C%A1%20%EC%A7%80%EC%9B%90&hl=ko&gl=KR&ceid=KR%3Ako",
    },
    {
      category: "ai",
      title: "AI 반도체와 데이터센터 경쟁이 빠르게 확대되고 있습니다",
      summary: "인공지능 서비스 확산으로 고성능 칩, 서버, 데이터센터 인프라 투자가 주요 기술 뉴스로 떠올랐습니다.",
      source: "Daily news",
      publishedAt: "2026-05-04",
      url: "https://news.google.com/search?q=AI%20%EB%B0%98%EB%8F%84%EC%B2%B4%20%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%84%BC%ED%84%B0&hl=ko&gl=KR&ceid=KR%3Ako",
    },
    {
      category: "ai",
      title: "모바일 기기 안에서 실행되는 온디바이스 AI 기술이 확산되고 있습니다",
      summary: "스마트폰과 PC에서 개인정보를 보호하면서 빠르게 작동하는 AI 기능이 새로운 경쟁 포인트가 되고 있습니다.",
      source: "Daily news",
      publishedAt: "2026-05-04",
      url: "https://news.google.com/search?q=%EC%98%A8%EB%94%94%EB%B0%94%EC%9D%B4%EC%8A%A4%20AI&hl=ko&gl=KR&ceid=KR%3Ako",
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
};

const updatedAt = document.querySelector("#updatedAt");
const todayCount = document.querySelector("#todayCount");
const searchInput = document.querySelector("#searchInput");
const chips = document.querySelectorAll(".chip");
const navLinks = document.querySelectorAll("[data-view-link]");
const archiveRange = document.querySelector("#archiveRange");
const archiveDateInput = document.querySelector("#archiveDateInput");
const archiveClearButton = document.querySelector("#archiveClearButton");

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
  toggleSectionVisibility();
  renderArchive();
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

  const entries = state.selectedArchiveDate
    ? state.archive.filter((entry) => entry.updatedAt === state.selectedArchiveDate)
    : state.archive;

  if (!entries.length) {
    const message = state.selectedArchiveDate
      ? `${formatDate(state.selectedArchiveDate)}에 올라온 기사 기록이 없습니다.`
      : "최근 7일 기사 기록이 없습니다.";
    lists.archive.innerHTML = `<div class="empty">${message}</div>`;
    archiveRange.textContent = state.selectedArchiveDate ? `${formatDate(state.selectedArchiveDate)} 기사` : "최근 7일 기사";
    return;
  }

  if (state.selectedArchiveDate) {
    archiveRange.textContent = `${formatDate(state.selectedArchiveDate)} 기사 ${countArticles(entries)}개`;
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

function setupArchiveDatePicker() {
  if (!archiveDateInput || !state.archive.length) return;

  const dates = state.archive.map((entry) => entry.updatedAt).sort();
  archiveDateInput.min = dates[0];
  archiveDateInput.max = dates[dates.length - 1];
}

function countArticles(entries) {
  return entries.reduce((total, entry) => total + entry.articles.length, 0);
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
