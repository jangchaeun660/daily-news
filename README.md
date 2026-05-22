# Daily news

사회 이슈와 AI 트렌드를 매일 보여주는 간단한 뉴스 웹페이지입니다.

## 열어보기

`index.html`을 바로 열 수도 있지만, 브라우저 보안 설정 때문에 `fetch`가 막힐 수 있습니다. 가장 안정적인 확인 방법은 작은 로컬 서버를 여는 것입니다.

```powershell
python -m http.server 8000
```

그다음 `http://localhost:8000`으로 접속합니다.

## 뉴스 데이터

- 화면은 `data/news.json`을 읽어 사회 뉴스와 AI 뉴스를 표시합니다.
- `scripts/update-news.mjs`는 Google News RSS에서 전날 오전 7시부터 오늘 오전 7시까지 올라온 뉴스를 카테고리별 3~5개씩 가져와 `data/news.json`을 갱신합니다.
- 기사 이미지가 있으면 함께 저장하고, 화면에서는 썸네일과 자동 순환 화면에 표시합니다.
- `data/archive.json`에는 최근 7일 동안의 뉴스 기록을 저장합니다.
- `.github/workflows/update-news.yml`은 GitHub Actions에서 매일 자동으로 뉴스 데이터를 갱신하도록 준비된 파일입니다.

## 화면 표시 모드

`#display` 주소로 접속하면 뉴스가 10초마다 자동으로 넘어가는 화면 표시 모드가 열립니다.

## GitHub Pages 배포

1. GitHub에서 `daily-news` 저장소를 엽니다.
2. Settings > Pages로 이동합니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch를 `main` / root로 선택합니다.
5. 잠시 뒤 `https://jangchaeun660.github.io/daily-news/` 주소로 접속합니다.
