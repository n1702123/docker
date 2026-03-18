# 05 - Docker Compose

## 什麼是 Docker Compose？

Docker Compose 讓你用一個 YAML 檔案定義和管理**多個 Container**。

不用 Compose：
```bash
docker network create app-net
docker run -d --name db --network app-net -e MYSQL_ROOT_PASSWORD=pass mysql:8.0
docker run -d --name app --network app-net -p 3000:3000 -e DB_HOST=db my-app
docker run -d --name nginx --network app-net -p 80:80 my-nginx
# 每次都要打這麼多指令...
```

用 Compose：
```bash
docker compose up -d
# 一個指令搞定！
```

---

## docker-compose.yml 基本結構

```yaml
# docker-compose.yml

services:
  # Service 名稱（也是 Container 在網路中的 hostname）
  web:
    image: nginx:alpine
    ports:
      - "8080:80"

  app:
    build: ./app
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql

# 定義 named volume
volumes:
  db-data:
```

---

## 常用指令

```bash
# 啟動所有 service（背景執行）
docker compose up -d

# 啟動並重新 build image
docker compose up -d --build

# 查看執行中的 service
docker compose ps

# 查看 log
docker compose logs
docker compose logs -f          # 即時追蹤
docker compose logs app         # 只看特定 service

# 進入 Container
docker compose exec app bash

# 停止所有 service
docker compose down

# 停止並移除 volume（注意：會刪除資料！）
docker compose down -v

# 重啟特定 service
docker compose restart app

# 查看設定（合併後的結果，適合 debug）
docker compose config
```

---

## 詳細設定說明

### image vs build

```yaml
services:
  # 使用現成的 image
  db:
    image: postgres:16

  # 從 Dockerfile build
  app:
    build: ./app                  # Dockerfile 在 ./app 目錄

  # 進階 build 設定
  api:
    build:
      context: ./backend          # build context 路徑
      dockerfile: Dockerfile.prod # 指定 Dockerfile 名稱
      args:
        NODE_ENV: production      # build args
```

### ports

```yaml
services:
  web:
    ports:
      - "8080:80"              # host:container
      - "8443:443"
      - "3000"                 # 只指定 container port，host port 自動分配
      - "127.0.0.1:8080:80"   # 綁定特定 IP
```

### environment 與 env_file

```yaml
services:
  app:
    # 方式 1：直接寫
    environment:
      DB_HOST: db
      DB_PORT: 5432
      NODE_ENV: production

    # 方式 2：list 格式
    environment:
      - DB_HOST=db
      - DB_PORT=5432

    # 方式 3：使用 env file
    env_file:
      - .env
      - .env.local
```

**.env 檔案**（放在 docker-compose.yml 同一層）：
```env
# .env
DB_HOST=db
DB_PORT=5432
DB_PASSWORD=secret
```

**在 Compose 檔案中使用變數替換**：
```yaml
services:
  db:
    image: postgres:${POSTGRES_VERSION:-16}    # 預設值為 16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

### volumes

```yaml
services:
  app:
    volumes:
      # Named volume
      - app-data:/app/data

      # Bind mount
      - ./src:/app/src

      # 唯讀 bind mount
      - ./config:/app/config:ro

  db:
    volumes:
      - db-data:/var/lib/postgresql/data

# 在最上層宣告 named volume
volumes:
  app-data:
  db-data:
```

### depends_on

```yaml
services:
  app:
    depends_on:
      - db
      - redis
    # 只保證 db 和 redis 的 Container 先啟動
    # 不保證服務已經 ready！

  # 進階：搭配 healthcheck
  app:
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

> **重要**：`depends_on` 只控制啟動順序。要確保服務真的 ready，必須搭配 `healthcheck`。

### networks

```yaml
services:
  frontend:
    networks:
      - frontend-net

  backend:
    networks:
      - frontend-net    # 可以跟 frontend 通訊
      - backend-net     # 也可以跟 db 通訊

  db:
    networks:
      - backend-net     # frontend 無法直接連到 db

networks:
  frontend-net:
  backend-net:
```

### restart policy

```yaml
services:
  app:
    restart: unless-stopped
    # no          — 不自動重啟（預設）
    # always      — 總是重啟
    # on-failure  — 只在失敗時重啟
    # unless-stopped — 除非手動停止，否則重啟
```

---

## 實戰範例

### 範例 1：Node.js + PostgreSQL + Redis

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src    # 開發時同步程式碼

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  pgdata:
  redis-data:
```

### 範例 2：WordPress（快速架站）

```yaml
# docker-compose.yml
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: wp_pass
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wp-content:/var/www/html/wp-content
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: wp_pass
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  wp-content:
  db-data:
```

```bash
docker compose up -d
# 開啟 http://localhost:8080 就能看到 WordPress 安裝畫面！
```

### 範例 3：開發環境（含 hot reload）

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    environment:
      - VITE_API_URL=http://localhost:3000

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/src:/app/src
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/devdb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"    # 讓本地工具（如 pgAdmin）也能連
    environment:
      POSTGRES_DB: devdb
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 常見的 .env 搭配方式

```
project/
├── docker-compose.yml
├── .env                  ← Compose 自動讀取（變數替換用）
├── .env.example          ← 範本，放進 git
└── app.env               ← 傳給 Container 的環境變數
```

**.env**（Compose 變數替換用）：
```env
POSTGRES_VERSION=16
APP_PORT=3000
```

**docker-compose.yml**：
```yaml
services:
  db:
    image: postgres:${POSTGRES_VERSION}
  app:
    ports:
      - "${APP_PORT}:3000"
    env_file:
      - app.env
```

---

## 練習題

### 練習 1：基礎 Compose
建立一個 `docker-compose.yml`，包含：
- Nginx（port 8080:80）
- 掛載一個自訂的 `index.html`

### 練習 2：三層架構
建立包含以下 service 的 Compose 檔案：
- **Frontend**：Nginx，port 80
- **Backend**：任何你熟悉的語言
- **Database**：PostgreSQL 或 MySQL
- 要求：使用 healthcheck、volume、自訂 network

<details>
<summary>練習 1 參考解答</summary>

```bash
# 建立 index.html
mkdir -p web
echo '<h1>Hello Compose!</h1>' > web/index.html
```

```yaml
# docker-compose.yml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./web:/usr/share/nginx/html:ro
```

```bash
docker compose up -d
# 開啟 http://localhost:8080
```

</details>

---

## 面試常見問題

**Q：Docker Compose 的用途？**
> 用一個 YAML 檔案定義和管理多容器應用。可以一個指令啟動/停止所有相關服務，適合開發環境和單機部署。

**Q：`depends_on` 能保證服務已經 ready 嗎？**
> 不能。`depends_on` 只保證 Container 的啟動順序，不保證服務已準備好接受連線。要確保服務 ready，需要搭配 `healthcheck` 和 `condition: service_healthy`。

**Q：如何在 Compose 中管理環境變數？**
> 三種方式：(1) 直接在 `environment` 區段寫死；(2) 使用 `env_file` 指向 `.env` 檔案；(3) 在 `.env` 檔案中定義變數，用 `${VAR}` 語法在 Compose 檔案中引用。
