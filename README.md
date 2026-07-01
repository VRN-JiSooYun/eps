# eps

External Procurement System. For Supplier or Vendor of Voronoi Inc.

## 기술 스택

- Frontend: React, TypeScript, Ant Design, Tailwind CSS customization
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
│   │   └── main.go   - 애플리케이션 진입점
│   ├── internal/ - 애플리케이션 내부 패키지
│   │   ├── handlers/ - HTTP 핸들러 (예: auth.go, quote.go)
│   │   ├── models/ - 데이터 모델 (예: user.go, quote.go)
│   │   ├── services/ - 비즈니스 로직 (예: auth_service.go, quote_service.go)
│   │   └── utils/  - 유틸리티 함수 (예: jwt.go, db.go)
│   ├── config/ - 환경 변수 및 설정 관리
│   └── go.mod  - Go 모듈 파일
│
├── frontend/
│   ├── src/
│   │   ├── components/. - 공통 UI 컴포넌트
│   │   ├── layout/. - 페이지 레이아웃 컴포넌트
│   │   ├── pages/. - 로그인, 회원가입, 견적대기 목록 등 페이지 컴포넌트
│   │   ├── store/. - Zustand 또는 Redux 상태 관리
│   │   ├── services/. - API 호출 함수
│   │   ├── utils/. - 유틸리티 함수 (예: 날짜 포맷터, 인증 토큰 관리)
│   │   ├── hooks/. - 커스텀 React Hooks (예: useAuth, useFetch)
│   │   └── App.tsx. - 라우팅 및 페이지 레이아웃
│   ├── public/
│   └── package.json
├── admin/
│   ├── backend/   - 관리자 API 서버
│   └── frontend/  - 관리자 React 콘솔
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
- Admin: http://localhost:18080

In local development, `DEV_FRONTEND_PROXY=true` makes the Go Echo catch-all route proxy frontend page and asset requests to the Vite dev server. React changes are reflected through Vite HMR without rebuilding `frontend/dist`. API calls still go to Echo through `/api`; `frontend/vite.config.ts` proxies `/api` to `http://localhost:8080` when you open the app directly on `http://localhost:5173`.

Production Docker build compiles the React app and embeds `frontend/dist` into the Go Echo binary using `embed.FS`. Leave `DEV_FRONTEND_PROXY` unset or `false` for that mode.

### Admin

Docker Compose also starts the admin console on `http://localhost:18080`. Default local credentials are `admin / admin1234`; override `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` before deployment.

For nginx reverse proxy deployment, admin is configured for `/eps-admin/` through Docker build args `VITE_BASE_PATH=/eps-admin/`, `VITE_API_BASE_URL=/eps-admin/api`, and backend env `BASE_PATH=/eps-admin`.

Admin local development:

```bash
cd admin/backend
PORT=18080 FRONTEND_ORIGIN=http://localhost:15173 DEV_FRONTEND_PROXY=true DATABASE_URL=postgres://eps:eps@localhost:5432/eps?sslmode=disable go run ./cmd
```

```bash
cd admin/frontend
npm install
npm run dev -- --port 15173
```

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

## 주요 API

### Supplier Register

`POST /api/suppliers/register`

`multipart/form-data` 요청으로 공급업체 정보, 담당자 정보, 필수 첨부파일을 함께 등록합니다.

필수 field:

- `email`
- `password`
- `passwordConfirm`
- `companyName`
- `businessRegistrationNumber`
- `headOfficePhone`
- `bankName`
- `accountHolder`
- `accountNumber`
- `contactName`
- `position`
- `department`
- `mobilePhone`
- `privacyAgreed`
- `businessRegistrationFile`
- `bankbookFile`

선택 field:

- `directPhone`
- `emailNotificationEnabled`

## API 문서 (TODO)

API 문서는 Swagger 또는 Postman을 사용하여 작성할 예정입니다. 주요 엔드포인트는 다음과 같습니다:
