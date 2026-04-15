# 03 - Docker 整合 GitHub Actions

## 目標

把前面學的 Docker 和 GitHub Actions 結合，實現：
> Push code → 自動 Build Docker Image → 自動 Push 到 Docker Hub

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
GitHub Actions 自動觸發
        │
        ├── Step 1: Checkout 程式碼
        ├── Step 2: 登入 Docker Hub
        ├── Step 3: Build Docker Image
        └── Step 4: Push Image 到 Docker Hub
        │
        ▼
  Docker Hub 上有新的 Image
  ✅ 任何人都可以 docker pull 使用
```

---

## 前置準備

### 1. 準備一個有 Dockerfile 的專案

```
my-app/
├── .github/
│   └── workflows/
│       └── docker-publish.yml
├── src/
│   └── app.js
├── Dockerfile
├── package.json
└── README.md
```

### 2. 範例 Dockerfile（回顧 Docker 課程）

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/app.js"]
```

### 3. 設定 Docker Hub Secrets

在 GitHub repo 中設定以下 Secrets：

| Secret 名稱 | 值 |
|-------------|-----|
| `DOCKERHUB_USERNAME` | 你的 Docker Hub 帳號 |
| `DOCKERHUB_TOKEN` | Docker Hub 的 Access Token（不是密碼！） |

**取得 Docker Hub Access Token**：
1. 登入 [Docker Hub](https://hub.docker.com/)
2. 點右上角頭像 → Account Settings → Security
3. 點 "New Access Token"
4. 給一個描述（如 "GitHub Actions"），權限選 Read & Write
5. 複製 Token（只會顯示一次！）

---

## 基本版：Build & Push

```yaml
# .github/workflows/docker-publish.yml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      # Step 1: 把程式碼拉下來
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: 登入 Docker Hub
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # Step 3: Build 並 Push Image
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/my-app:latest
```

### 逐步解說

| Step | 做了什麼 | 為什麼需要 |
|------|---------|-----------|
| Checkout | `git clone` repo 到 Runner | Runner 是空的機器，需要先取得程式碼 |
| Login | 登入 Docker Hub | 才能 push image 到 Docker Hub |
| Build and push | `docker build` + `docker push` | 打包 image 並上傳 |

---

## 進階版：多 Tag + 測試

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: 先跑測試
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

  # Job 2: 測試通過才 build
  build-and-push:
    needs: test                          # 等 test 通過
    if: github.event_name == 'push'      # 只有 push 時才 build（PR 只跑測試）
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # 產生多個 Tag
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/my-app:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/my-app:${{ github.sha }}
```

### Tag 策略說明

| Tag | 範例 | 用途 |
|-----|------|------|
| `latest` | `my-app:latest` | 永遠指向最新版本 |
| Git SHA | `my-app:a1b2c3d` | 每個 commit 一個唯一版本，方便回滾 |
| 語意版本 | `my-app:v1.2.3` | 正式發佈版本（通常搭配 Git tag） |

> **最佳實踐**：正式環境不要用 `latest`，用具體的版本號或 SHA，才知道跑的是哪個版本。

---

## 流程圖解

```
                    PR 發出
                      │
                      ▼
               ┌─────────────┐
               │   Run Test  │
               └──────┬──────┘
                      │
              ┌───────┴───────┐
              │               │
           測試通過         測試失敗
              │               │
              ▼               ▼
        PR 顯示 ✅        PR 顯示 ❌
              │          （不能 merge）
              │
         Code Review
              │
         Merge to main
              │
              ▼
       ┌─────────────┐
       │   Run Test  │
       └──────┬──────┘
              │ 通過
              ▼
    ┌──────────────────┐
    │ Build & Push     │
    │ Docker Image     │
    └──────────────────┘
              │
              ▼
      Docker Hub 更新 ✅
```

---

## 常見問題排查

### 1. Login 失敗
```
Error: Username and password required
```
→ 檢查 Secrets 名稱是否正確，有沒有多餘的空白

### 2. Build 失敗
```
ERROR: failed to solve: dockerfile parse error
```
→ 檢查 Dockerfile 語法，確認檔案在 repo 根目錄

### 3. Push 失敗
```
denied: requested access to the resource is denied
```
→ Docker Hub Token 權限不足，需要 Read & Write 權限

### 4. 測試通過但 Image 沒有 push
→ 檢查 `if` 條件：PR 事件不會觸發 build-and-push job

---

## 小結

| 概念 | 說明 |
|------|------|
| `docker/login-action` | 登入 Docker Hub 的官方 Action |
| `docker/build-push-action` | Build + Push 的官方 Action |
| Secrets | 安全存放 Docker Hub 憑證 |
| `needs` | 讓 Job 依序執行（先測試再 build） |
| Tag 策略 | 用 `latest` + `git SHA` 雙重標記 |

> 接下來看 Demo 腳本，一步步操作整個流程！
