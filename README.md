# 📅 D-Day Manager

이미지에서 텍스트를 추출하여 D-Day를 관리하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🖼️ **이미지 업로드**: 제목과 날짜가 포함된 이미지를 업로드
- 🤖 **AI 텍스트 추출**: OpenAI Vision API로 한국어 텍스트 정확하게 인식
- 📅 **D-Day 계산**: 자동으로 남은 날짜/지난 날짜 계산
- 💾 **로컬 저장**: 브라우저에 데이터 저장 (재방문시 유지)
- 📊 **통계**: 전체 이벤트, 다가오는 이벤트, 지난 이벤트 통계
- 📱 **모바일 최적화**: QANDA 디자인 시스템 기반 모바일 앱 스타일

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 14 이상
- npm 또는 yarn
- OpenAI API 키 ([여기서 발급](https://platform.openai.com/api-keys))

### 2. 설치

```bash
# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 열고 OpenAI API 키를 입력하세요:

```env
# .env
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
```

### 4. 서버 실행

```bash
# 프로덕션 모드
npm start

# 개발 모드 (자동 재시작)
npm run dev
```

### 5. 브라우저에서 접속

```
http://localhost:3000
```

## 📖 사용 방법

### 이벤트 추가

1. 하단 **"추가"** 탭 클릭
2. **"이미지 업로드"** 버튼 클릭하여 이미지 선택
   - 또는 직접 제목과 날짜 입력
3. AI가 자동으로 제목과 날짜 추출 (2-3초 소요)
4. 추출된 정보 확인 및 필요시 수정
5. **"저장하기"** 클릭

### 이벤트 보기

- **홈 탭**: 모든 이벤트 카드 보기 (날짜순 정렬)
- **통계 탭**: 이벤트 통계 및 가장 가까운 이벤트 확인

### 이벤트 삭제

- 카드의 **✕** 버튼으로 개별 삭제
- 상단의 휴지통 아이콘으로 전체 삭제

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- QANDA Design System v4.0
- LocalStorage API

### Backend
- Node.js
- Express.js
- OpenAI API (GPT-4o-mini Vision)

## 📁 프로젝트 구조

```
newhome/
├── index.html          # 메인 HTML
├── server.js           # Express 서버
├── package.json        # 프로젝트 설정
├── .env               # 환경 변수 (API 키)
├── .env.example       # 환경 변수 템플릿
├── .gitignore         # Git 제외 파일
├── README.md          # 프로젝트 문서
├── styles/
│   └── main.css       # QANDA 디자인 시스템 스타일
└── scripts/
    └── app.js         # 클라이언트 JavaScript
```

## 💰 비용 안내

- **모델**: GPT-4o-mini
- **예상 비용**: 이미지 1장당 약 $0.001-0.003 (1-4원)
- **100장 처리**: 약 100-400원

## 🔒 보안

- API 키는 서버의 `.env` 파일에 저장 (클라이언트에 노출되지 않음)
- `.gitignore`에 `.env` 파일 포함 (Git에 업로드되지 않음)
- 사용자는 API 키 입력 불필요

## 🐛 문제 해결

### 서버 연결 실패
```
서버에 연결할 수 없습니다.
```
→ 터미널에서 `npm start`로 서버 실행 확인

### API 키 오류
```
서버의 API 키가 설정되지 않았습니다.
```
→ `.env` 파일에 `OPENAI_API_KEY` 추가 확인

### 이미지 업로드 실패
- 이미지 파일 형식 확인 (JPG, PNG 등)
- 파일 크기가 너무 크지 않은지 확인 (10MB 이하 권장)

## 📄 라이선스

MIT License

## 👨‍💻 개발자

QANDA Design System v4.0 기반으로 제작
