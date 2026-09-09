# Songs Burger

숯불 버거집 원페이지. 스크롤 위치로 히어로 영상을 스크럽한다.

## 구조

```
index.html          한 페이지 전부
assets/styles.css   팔레트는 히어로 영상에서 직접 추출한 값
assets/main.js      스크롤 → video.currentTime
media/hero-1080.mp4 큰 화면 (17MB, 전 프레임 키프레임)
media/hero-720.mp4  중간 화면 (8.7MB)
media/hero-480.mp4  모바일 (3.2MB)
media/poster.jpg    OG 이미지
media/first.jpg     영상 로딩 전 첫 프레임
```

## 반드시 바꿔야 하는 것

`index.html`에서 `data-placeholder` 가 붙은 곳이 전부 가짜다. 실제 정보로 교체할 것.

| 위치 | 현재 | 넣을 것 |
|---|---|---|
| Find us | `00 Somewhere-ro, Seoul` | 실제 주소 |
| Open in maps | `#` | 네이버/카카오/구글 지도 URL |
| Hours | `Tue–Sun, 11:30 – 21:00` | 실제 영업시간 |
| Phone | `00-0000-0000` | 실제 번호 (`href="tel:"` 도 같이) |

영상 위 문구도 확인이 필요하다. **"Charcoal, every time. We don't own a griddle."**,
**"Flipped once"**, 재료 8종은 실제 조리법을 모르는 상태에서 쓴 것이라
사실과 다르면 광고 문구로 문제가 된다. 맞는지 확인하고 고칠 것.

## 동작 방식

- 스크롤 구간 = `.beat` 개수 × 100vh. 문구를 추가/삭제하면 스크럽 속도가 같이 변한다.
- 화면 폭(× DPR)에 따라 1080p / 720p / 480p 중 하나를 받는다. `assets/main.js` 상단.
- 영상 위에 전면 오버레이를 깔지 않는다. 글자는 그림자와 글자 뒤 좁은 그늘로만 읽히게
  했다. 어둡게 덮으면 영상이 죽는다.
- `prefers-reduced-motion: reduce` 또는 데이터 절약 모드면 스크럽을 끄고 자동 반복 재생으로 내려간다.
- JS가 죽거나 영상이 안 오면 글은 그대로 읽힌다. 포스터만 남는다.
- 영상 스크럽은 서버가 HTTP Range 요청(206)을 지원해야 한다. Vercel은 지원한다.
  `python3 -m http.server` 는 지원하지 않아서 로컬 테스트가 안 된다.

## 영상 교체

현재 영상은 한 번에 생성한 10초(one-take)다. 구간을 이어붙인 버전이 따로 있고
그쪽이 재료 분해 장면이 더 선명하다. 교체하려면 같은 이름으로 인코딩해 넣으면 된다.

```bash
ffmpeg -i <원본>.mp4 -vf scale=1280:720 -c:v libx264 -g 1 -crf 26 \
  -pix_fmt yuv420p -an -movflags +faststart media/hero-720.mp4
```

`-g 1` 은 전 프레임을 키프레임으로 만든다. 빼면 스크롤할 때 영상이 뚝뚝 끊긴다.
