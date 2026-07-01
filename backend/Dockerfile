FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend ./
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=/api
RUN VITE_BASE_PATH=$VITE_BASE_PATH VITE_API_BASE_URL=$VITE_API_BASE_URL npm run build

FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum* ./
RUN go mod download
COPY backend ./
RUN rm -rf internal/web/dist
COPY --from=frontend-builder /frontend/dist ./internal/web/dist
RUN go build -o /bin/eps-backend ./cmd

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /bin/eps-backend /bin/eps-backend

EXPOSE 8080
CMD ["/bin/eps-backend"]
