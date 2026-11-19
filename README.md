# K-pop 컴백 예측 — 전시회 시연 사이트

"K-pop 아티스트의 다음 컴백은 언제고, 얼마나 잘될까?" AI 동아리 개인 프로젝트의 시연 사이트.
아티스트를 고르거나 숫자를 넣으면 **다음 앨범 초동 등급**과 **다음 컴백 시기 등급**을 보여준다.

- 정적 사이트 (HTML + CSS + 바닐라 JS). 빌드·서버·인터넷 없이 `index.html`을 더블클릭해도 동작한다.
- 그래프: Chart.js v4.4.1 (MIT), `js/vendor/`에 포함.

## 페이지
| 파일 | 내용 |
|---|---|
| `index.html` | 1. 예측해보기 |
| `about.html` | 2. 프로젝트 소개 |
| `results.html` | 3. 결과·시각화 |
| `limits.html` | 4. 장점·한계 |
| `refs.html` | 5. 참고 자료 |
| `quiz.html` | 나도 맞혀보기 (설문 10문제) |
| `tests/test_predict.html` | 정답지 6개 확인 (predict.js를 고칠 때마다 열기) |

## 그림 넣기
Colab 그림 3·4·5·7을 아래 이름으로 `img/`에 넣으면 3페이지에 자동으로 나온다.
`train_val_test.png`, `learning_curve.png`, `c_curve.png`, `feature_effect.png`

## GitHub Pages 배포 (git 없이 웹에서)
1. GitHub에서 **New repository** → 이름 입력 → **Public** → Create.
2. 저장소 화면의 **uploading an existing file** → 이 폴더 안의 파일·폴더를 전부 끌어다 놓기 → Commit.
   (`.nojekyll` 파일도 같이 올라가야 한다. 숨김 파일이라 안 보이면 탐색기에서 '숨긴 항목' 켜기)
3. **Settings → Pages** → Source: *Deploy from a branch*, Branch: *main* / *(root)* → Save.
4. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 열린다.
5. 그 주소로 QR 코드를 만들어 `img/qr.png`로 저장한다.

## 1페이지 앨범 목록 (js/albums.js) 다시 만들기
엑셀은 읽기만 한다. Python 없이 PowerShell로 돌아간다. 같이 합치는 파일:
- `data/웹조사_앨범.csv`: 엑셀에 없어서 웹에서 찾은 앨범 (출처 포함). 새 팀이면 회사·성별·그룹여부 칸도 채운다.
- `data/팀정보.csv`: 정식이름, 화면에 보일 소속사, 소속사 안에서 나눌 묶음(SM 계열·하이브 레이블 등), 검색용 별칭.
```
powershell -ExecutionPolicy Bypass -File data\make_albums.ps1 data\comeback_data_v16.xlsx data\사이트용_아티스트.xlsx js\albums.js ..\초동_2015_2025.xlsx
```
- 4번째 파일(선택) `초동_2015_2025.xlsx`: 학습 데이터 밖 24팀의 2015~2025 초동표. 겹치는 앨범은 이 표의 값으로 바꾸고, 바꾼 내용을 화면에 `[바꿈]`·`[유지]`·`[날짜]`로 출력한다.

## 아티스트 목록 고치기
`data/사이트용_아티스트.xlsx`의 '추가앨범' 시트를 고친 뒤:
```
python data/make_artists.py data/comeback_data_v16.xlsx data/사이트용_아티스트.xlsx js/artists.js
```
