# Daily news

SAIL 뉴스 페이지 레퍼런스를 바탕으로 만든 사회/AI 데일리 뉴스 웹페이지입니다.

## 열어보기

`index.html`을 브라우저로 열면 됩니다. 로컬 파일에서 `fetch`가 막히는 브라우저도 있으므로, 가장 안정적인 확인 방법은 작은 정적 서버를 띄우는 것입니다.

```powershell
cd news-site
python -m http.server 8000
```

그 다음 `http://localhost:8000`으로 접속합니다.

## 뉴스 API

- 화면은 `data/news.json`을 읽어 뉴스 4개를 표시합니다.
- `scripts/update-news.mjs`는 GDELT DOC 2.0 공개 API에서 사회 뉴스 2개, AI 뉴스 2개를 가져와 `data/news.json`을 갱신합니다.
- GDELT는 별도 API 키 없이 사용할 수 있습니다.
- `.github/workflows/update-news.yml`은 GitHub Actions에서 매일 한국 시간 오전 7시에 스크립트를 실행하도록 준비해 둔 파일입니다.

GitHub Pages로 배포하면 웹사이트는 계속 접속 가능하고, Actions가 매일 뉴스 데이터를 갱신합니다.

## GitHub Pages 배포

1. GitHub에서 `daily-news` 저장소를 만듭니다.
2. 이 폴더의 파일을 저장소 루트에 올립니다.
3. 저장소의 Settings > Pages에서 Source를 `Deploy from a branch`로 두고 Branch를 `main` / root로 선택합니다.
4. 몇 분 뒤 `https://사용자명.github.io/daily-news/` 주소로 접속할 수 있습니다.
