const state = {
  filter: "all",
  query: "",
  articles: [],
};

const fallbackNews = {
  updatedAt: "2026-05-03",
  articles: [
    {
      category: "society",
      title: "청년 주거 지원 정책, 수도권 전세 부담 완화에 초점",
      summary: "정부와 지자체가 청년층 주거비 부담을 낮추기 위한 보증 지원과 공공임대 공급 계획을 확대하고 있습니다.",
      source: "Sample Brief",
      publishedAt: "2026-05-03",
      url: "#",
    },
    {
      category: "society",
      title: "고령화 대응 지역 돌봄 서비스 개편 논의 확대",
      summary: "초고령 사회 진입에 맞춰 의료, 복지, 생활 지원을 지역 단위에서 연결하는 통합 돌봄 모델이 주목받고 있습니다.",
      source: "Sample Brief",
      publishedAt: "2026-05-03",
      url: "#",
    },
    {
      category: "ai",
      title: "생성형 AI 도입 기업, 업무 자동화와 검증 체계 병행",
      summary: "기업들은 문서 작성, 고객 응대, 데이터 분석에 AI를 활용하면서도 결과 검증과 보안 기준을 함께 강화하고 있습니다.",
      source: "Sample Brief",
      publishedAt: "2026-05-03",
      url: "#",
    },
    {
      category: "ai",
      title: "AI 반도체 경쟁, 저전력 추론 성능으로 확장",
      summary: "클라우드뿐 아니라 온디바이스 환경에서 빠르게 동작하는 AI 모델 수요가 늘며 전용 칩 경쟁이 이어지고 있습니다.",
      source: "Sample Brief",
      publishedAt: "2026-05-03",
      url: "#",
    },
  ],
};

const lists = {
  society: document.querySelector("#societyList"),
  ai: document.querySelector("#aiList"),
};

const updatedAt = document.querySelector("#updatedAt");
const todayCount = document.querySelector("#todayCount");
const searchInput = document.querySelector("#searchInput");
const chips = document.querySelectorAll(".chip");

async function loadNews() {
  try {
    const response = await fetch(`data/news.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("News data unavailable");
    const data = await response.json();
    state.articles = data.articles;
    updatedAt.textContent = formatDate(data.updatedAt);
  } catch {
    state.articles = fallbackNews.articles;
    updatedAt.textContent = `${formatDate(fallbackNews.updatedAt)} sample`;
  }

  todayCount.textContent = `${state.articles.length} updates`;
  render();
}

function render() {
  const filtered = state.articles.filter((article) => {
    const matchesCategory = state.filter === "all" || article.category === state.filter;
    const searchTarget = `${article.title} ${article.summary} ${article.source}`.toLowerCase();
    return matchesCategory && searchTarget.includes(state.query.toLowerCase());
  });

  renderList("society", filtered);
  renderList("ai", filtered);
}

function renderList(category, articles) {
  const categoryArticles = articles.filter((article) => article.category === category);
  lists[category].innerHTML = "";

  if (!categoryArticles.length) {
    lists[category].innerHTML = '<div class="empty">표시할 뉴스가 없습니다.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  categoryArticles.forEach((article) => fragment.appendChild(createCard(article)));
  lists[category].appendChild(fragment);
}

function createCard(article) {
  const card = document.createElement("article");
  card.className = "news-card";

  const date = new Date(article.publishedAt);
  const day = Number.isNaN(date.getTime()) ? "NEW" : `${date.getMonth() + 1}/${date.getDate()}`;
  const label = article.category === "ai" ? "AI" : "Society";

  card.innerHTML = `
    <div class="date-badge">${day}</div>
    <div>
      <span class="tag ${article.category}">${label}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <div class="meta">
        <span>${escapeHtml(article.source)}</span>
        <span>${formatDate(article.publishedAt)}</span>
      </div>
    </div>
    <a class="read-link" href="${article.url}" target="_blank" rel="noreferrer">Read</a>
  `;

  return card;
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

loadNews();
