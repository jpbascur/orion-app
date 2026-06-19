# Stage 1: build React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy manifests first so Docker can cache the npm ci layer.
# This layer is only invalidated when package.json or package-lock.json changes,
# not on every source file edit.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
WORKDIR /app

# Copy requirements first so pip install is cached independently of app code.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py ./
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/build ./frontend/build

EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
