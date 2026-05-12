# eps
External Procurement System. For Supplier or Vendor of Voronoi Inc.

## 기술 스택
 - Frontend: React, TypeScript, Tailwind CSS
 - Backend: Golang Echo Framework
 - Database: PostgreSQL
 - Authentication: JWT (JSON Web Tokens)
 - Deployment: Docker
 - Version Control: GitHub
 - CI/CD: GitHub Actions
 - Testing: Jest (Frontend), Go's testing package (Backend)

## 프로젝트 구조
```eps/
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── internal/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── config/
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── docker-compose.yml
└── README.md
``` 

## 설치 및 실행
### Docker Compose
```bash
docker compose up --build
```

### Local Development
Terminal 1 - backend:
```bash
cd backend
DEV_FRONTEND_PROXY=true go run ./cmd/main.go
```

Terminal 2 - frontend:
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- App / Backend: http://localhost:8080
- Health check: http://localhost:8080/health

In local development, `DEV_FRONTEND_PROXY=true` makes the Go Echo catch-all route proxy frontend page and asset requests to the Vite dev server. React changes are reflected through Vite HMR without rebuilding `frontend/dist`. API calls still go to Echo through `/api`; `frontend/vite.config.ts` proxies `/api` to `http://localhost:8080` when you open the app directly on `http://localhost:5173`.

Production Docker build compiles the React app and embeds `frontend/dist` into the Go Echo binary using `embed.FS`. Leave `DEV_FRONTEND_PROXY` unset or `false` for that mode.

### Backend
1. PostgreSQL 데이터베이스 설정
2. 환경 변수 설정 (.env 파일)
3. Go 모듈 설치
```bash
cd backend
go mod tidy
```
4. 서버 실행
```bash
go run cmd/main.go
``` 
### Frontend
1. Node.js 및 npm 설치
2. 패키지 설치
```bash
cd frontend
npm install
```
3. 개발 서버 실행
```bash
npm run dev
``` 

## 기능 명세
- 사용자 인증 (로그인, 회원가입)
  - 개인정보 수집이용 동의
  - 사업자등록증, 통장사본 업로드 (pdf, jpg, png)
- 비밀번호 초기화 및 이메일 인증
- 견적대기 목록 조회 및 접수
  - 견적대기 목록 조회
  - 견적 접수 (견적서 작성, 견적서 업로드(pdf, jpg, png))
- 견적완료 목록 조회
- 납품요청 목록 조회 및 납품 접수
  - 납품요청 목록 조회
  - 납품 접수 (납품서 작성, 납품서 업로드(pdf, jpg, png))
  - 납품포기 (납품포기 사유 선택)
- 신규 의뢰 알림 기능

## 현재 구현 범위
- 공급사 회원가입
- 로그인 및 JWT 발급
- JWT 인증 기반 견적대기 목록 조회
- PostgreSQL 테이블 자동 생성 및 개발용 견적대기 데이터 seed
- React 화면: 회원가입, 로그인, 견적대기 목록

## API 문서 (TODO)
API 문서는 Swagger 또는 Postman을 사용하여 작성할 예정입니다. 주요 엔드포인트는 다음과 같습니다:
