# Stage 1: Build the frontend assets
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy package files and configuration needed for npm ci
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/components.json ./
COPY frontend/index.html ./
COPY frontend/src ./src

# Install dependencies
RUN npm ci

# Copy remaining files
COPY frontend/ ./

RUN npm run build

# Stage 2: Build the final application with the backend
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --no-cache
RUN uv pip install validators
COPY backend/ ./backend/
RUN mkdir -p /app/frontend/public /app/frontend/dist
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/dist /app/frontend/dist


WORKDIR /app/backend

# Expose the port the backend server runs on
EXPOSE 8080

# The command to run the server. Because our WORKDIR is now /app/backend,
# we can simply refer to 'app:app' from the current directory.
CMD ["uv", "run", "--", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
