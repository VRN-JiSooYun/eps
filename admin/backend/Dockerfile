FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM golang:1.23-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum* ./backend/
WORKDIR /app/backend
RUN go mod download
COPY backend ./
COPY --from=frontend /app/frontend/dist ./internal/web/dist
RUN go build -o /eps-admin ./cmd

FROM alpine:3.20
WORKDIR /app
COPY --from=backend /eps-admin /app/eps-admin
EXPOSE 8080
CMD ["/app/eps-admin"]
