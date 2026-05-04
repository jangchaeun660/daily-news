const state = {
  filter: "all",
  query: "",
  news: { updatedAt: "", articles: [] },
  archive: [],
};

const fallbackNews = {
  updatedAt: "2026-05-04",
  articles: [
    {
      category: "society",
      title: "\"차별 없애자\" 장애인의날 전국 행사…편견 허물고 공존 가치 되새겨",
      summary: "제46회 장애인의 날을 맞아 전국에서 장애인 권익과 이동권, 복지 증진을 요구하는 행사와 집회가 열렸습니다.",
      source: "연합뉴스",
      publishedAt: "2026-04-20",
      url: "https://www.yna.co.kr/view/AKR20260420118100053",
    },
    {
      category: "society",
      title: "2026년부터 유아 무상교육·보육 지원대상 4~5세로 확대",
      summary: "국가책임형 유아교육·보육을 위해 무상교육·보육 지원 대상이 2026년부터 4~5세까지 확대됩니다.",
      source: "대한민국 정책브리핑",
      publishedAt: "2026-03-05",
      url: "https://m.korea.kr/news/policyNewsView.do?newsId=148960352",
    },
    {
      category: "ai",
      title: "에이디테크놀로지, 美 기업과 AI DC향 4나노 턴키 계약 체결",
      summary: "에이디테크놀로지가 미국 AI 팹리스 기업과 데이터센터용 고성능 SoC 칩렛 개발·공급 계약을 체결했습니다.",
      source: "ZDNet Korea",
      publishedAt: "2026-05-04",
      url: "https://zdnet.co.kr/view/?no=20260504084437",
    },
    {
      category: "ai",
      title: "삼성전자, '엑시노스 2600'에 모바일 AI 그래픽 신기술 첫 탑재",
      summary: "삼성전자가 자체 모바일 AP 엑시노스 2600에 인공지능 기반 그래픽 최적화 기술을 처음 상용화했습니다.",
      source: "연합뉴스",
      publishedAt: "2026-04-28",
      url: "https://www.yna.co.kr/view/AKR20260428063100003",
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
const archiveRange = document.querySelector("#archiveRange");

async function loadNews() {
  state.news = await fetchJson("data/news.json", fallbackNews);
  state.archive = await fetchJson("data/archive.json", [state.news]);
  if (!state.archive.some((entry) => entry.updatedAt === state.news.updatedAt)) {
    state.archive = [state.news, ...state.archive];
  }
  state.archive = getRecentArchive(state.archive);

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

function renderArchive() {
  lists.archive.innerHTML = "";

  if (!state.archive.length) {
    lists.archive.innerHTML = '<div class="empty">최근 7일 기사 기록이 없습니다.</div>';
    archiveRange.textContent = "최근 7일 기사";
    return;
  }

  const newest = state.archive[0]?.updatedAt;
  const oldest = state.archive[state.archive.length - 1]?.updatedAt;
  archiveRange.textContent = `${formatDate(oldest)} - ${formatDate(newest)}`;

  const fragment = document.createDocumentFragment();
  state.archive.forEach((entry) => {
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

window.addEventListener("hashchange", route);

loadNews();
