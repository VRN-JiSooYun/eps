# EPS Admin

EPS PostgreSQL schema를 관리하는 관리자 웹 서버입니다.

## Stack

- Frontend: React, TypeScript, Ant Design, Tailwind CSS
- Backend: Golang Echo Framework
- Database: PostgreSQL
- Authentication: JWT
- Deployment: Docker
- Testing: Jest, Go testing package

## Local Development

One-command local run:

```bash
./restart.sh
```

The script stops existing listeners on the configured backend and frontend ports before starting new processes.

This starts:

- Backend: http://localhost:18080
- Frontend dev server: http://localhost:15173

Default environment:

- `DATABASE_URL=postgres://eps:eps@localhost:5432/eps?sslmode=disable`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin1234`

Override any value inline:

```bash
DATABASE_URL='user=vrn-jisooyun dbname=eps_admin host=/tmp sslmode=disable' ./restart.sh
```

Build and test locally:

```bash
./scripts/build-local.sh
```

Build for reverse proxy path `/eps-admin/`:

```bash
BASE_PATH=/eps-admin VITE_API_BASE_URL=/eps-admin/api ./scripts/build-local.sh
```

For production behind nginx, build the frontend with `VITE_BASE_PATH=/eps-admin/` and run the backend with `BASE_PATH=/eps-admin`. The app also accepts the same APIs at `/api` for direct local access.

Example nginx location:

```nginx
location /eps-admin/ {
    proxy_pass http://127.0.0.1:18080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Manual backend:

```bash
cd backend
DEV_FRONTEND_PROXY=true go run ./cmd
```

Manual frontend:

```bash
cd frontend
npm install
npm run dev
```

- Admin app: http://localhost:8080
- Vite app: http://localhost:5173
- Health check: http://localhost:8080/health

Default admin login:

- ID: `admin`
- Password: `admin1234`

Change these with `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET`.

## Docker

```bash
docker compose up --build
```

The included compose file builds the admin UI for `/eps-admin/` and runs the backend with `BASE_PATH=/eps-admin`.

## API

- `POST /api/auth/login`
- `GET /api/admin/tables`
- `GET /api/admin/:table`
- `POST /api/admin/:table`
- `GET /api/admin/:table/:id`
- `PUT /api/admin/:table/:id`
- `DELETE /api/admin/:table/:id`

All admin endpoints require `Authorization: Bearer <token>`.
