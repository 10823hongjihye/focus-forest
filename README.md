# 포커스 포레스트

브라우저에서 쓰는 공부 타이머입니다. 음악을 들으며 집중하고, 할 일과 공부 기록을 이 브라우저 안에 남깁니다.

## 주요 기능

- 공부 타이머와 과목 선택
- 기본 플레이리스트, 직접 추가한 mp3, LP 플레이어
- 할 일, 직접 만든 카테고리, 중요도 별점
- 캘린더와 공부 시간 통계
- 테마, 글자 색, 배경 색과 배경 이미지
- 캐릭터, 옷, 집중 시간으로 모으는 잎
- 이 브라우저에만 저장되는 로그인

서버 데이터베이스는 없습니다. 다른 기기나 다른 브라우저의 기록은 자동으로 따라가지 않습니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173/ 를 엽니다.

시작 안내만 다시 보려면 http://localhost:5173/?intro=1 을 엽니다. 공부 기록은 지워지지 않습니다.

배포와 같은 결과물을 확인하려면 다음을 실행합니다.

```bash
npm run build
npm run preview
```

`npm run build`는 TypeScript 검사 후 사이트를 만듭니다. 검사가 실패하면 파일이 배포되지 않습니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 사이트를 만들고 GitHub Pages에 올립니다. 빌드가 실패하면 이전 사이트가 그대로 남습니다.

배포가 끝나면 주소는 `https://<GitHub 사용자 이름>.github.io/focus-forest/` 입니다. Actions 탭의 Deploy 워크플로에서 성공 여부를 확인합니다.

## 에셋

앱이 읽는 파일은 코드에서 직접 import 합니다.

- `forest-img/`: 캐릭터, 옷, 로고, 레코드 그림. 화면별 import는 `src/lib/characterArt.ts`, `src/lib/outfits.ts`, `src/components/LpPlayer.tsx`, `src/pages/OnboardPage.tsx`에 있습니다.
- `forest-sound effect/`: 기본 플레이리스트. 곡을 넣거나 빼려면 `src/lib/constants.ts`의 import와 곡 목록을 함께 수정합니다.
- `public/`: 파비콘처럼 주소로 바로 여는 파일.

그림을 갈아끼울 때는 같은 파일 이름을 유지하면 기존 import가 그대로 동작합니다. 파일 이름을 바꾸면 import 경로도 같이 바꿔야 합니다. 빌드 결과의 그림과 음악 주소에는 내용이 바뀔 때마다 새 이름이 붙어서, 이전 파일이 브라우저에 남지 않습니다.

사용자가 설정에서 추가한 배경 이미지와 mp3는 GitHub에 올라가지 않습니다. 그 브라우저의 localStorage와 IndexedDB에만 있습니다.

가장 큰 음악 파일은 약 10MB입니다. GitHub 파일 한도인 100MB보다 작아서 Git LFS는 쓰지 않습니다.

## 사용자 데이터

다음 값은 배포와 분리되어 브라우저에 남습니다.

- `focus-forest-v1`: 할 일, 카테고리, 별점, 공부 기록, 색, 배경, 캐릭터
- `focus-forest-timer-v1`: 진행 중인 타이머
- `focus-forest-session`: 로그인
- IndexedDB `focus-forest-music`: 직접 추가한 mp3

일반 사용자는 계정 id가 붙은 키를 사용합니다. 개발자 계정은 접미사 없는 키를 사용합니다.

새 버전 알림이 나와도 공부 화면이 저절로 새로고침되지는 않습니다. 사용자가 업데이트를 누른 뒤에만 새 파일을 불러오고, 위 저장값은 지우지 않습니다.
