# 05 - Next.js + Docker + GitHub Actions + Railway

## 目標

用 GitHub Actions 自動 Build Docker Image，推到 Docker Hub，再部署到 Railway：
> Push code → 測試 → Build Docker Image → Push to Docker Hub → Railway 自動更新網站

---

## 與 GitHub Pages 的差異

| | GitHub Pages（Demo 1）| Railway（Demo 2）|
|---|---|---|
| 類型 | 靜態網站 | 真正的 Server |
| Next.js 模式 | `output: 'export'`（靜態） | `output: 'standalone'`（Server） |
| 支援動態功能 | 不支援 | 支援 |
| 使用 Docker | 不需要 | 需要 |
| 費用 | 免費 | 免費方案可用 |
| 網址格式 | `帳號.github.io/repo名稱` | `your-app.railway.app` |

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
┌─────────────────────┐
│ Job 1: test         │
│  npm ci             │
│  npm run build      │  ← 確認沒有編譯錯誤
└────────┬────────────┘
         │ 通過
         ▼
┌─────────────────────┐
│ Job 2: docker push  │
│  docker login       │
│  docker build       │
│  docker push        │  → Docker Hub 有新 image
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Job 3: deploy       │
│  curl Railway Hook  │  ← 通知 Railway 拉新 image
└────────┬────────────┘
         │
         ▼
  Railway 重新部署
  ✅ 網站自動更新
  https://your-app.railway.app
```

---

## 專案結構

```
hello-world-railway/
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions（三個 Job）
├── app/
│   ├── layout.js
│   └── page.js
├── .dockerignore            ← 排除不需要打包的檔案
├── Dockerfile               ← 三階段 Build
├── next.config.mjs          ← standalone 模式
└── package.json
```

---

## 關鍵設定

### next.config.mjs

```js
const nextConfig = {
  output: 'standalone',  // 產生最小化的 server 執行檔
}
```

### Dockerfile（三階段 Build）

```dockerfile
# Stage 1: 安裝相依套件
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: 執行（最小化 image）
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**為什麼要三個 Stage？**

| Stage | 目的 | 最終 image 包含？ |
|-------|------|-----------------|
| deps | 安裝 npm 套件 | 不包含 |
| builder | 編譯 Next.js | 不包含 |
| runner | 只放執行需要的檔案 | 是，這才是最終 image |

只有 runner stage 會進最終 image，所以 image 很小（不會帶入 node_modules 和編譯工具）。

---

## 需要設定的 Secrets

到 GitHub repo → Settings → Secrets and variables → Actions，新增：

| Secret 名稱 | 值 | 哪裡取得 |
|------------|-----|---------|
| `DOCKERHUB_USERNAME` | Docker Hub 帳號 | Docker Hub 帳號頁面 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token | Docker Hub → Account Settings → Security → New Access Token |
| `RAILWAY_WEBHOOK_URL` | Railway Deploy Hook URL | Railway → 專案 → Settings → Deploy Hooks → New Hook |

---

## Railway 設定步驟

### 1. 建立 Railway 帳號

前往 [railway.app](https://railway.app) 用 GitHub 登入。

### 2. 建立新專案

```
New Project → Deploy from Docker Hub image
```

填入 Docker Hub image 名稱：
```
你的帳號/hello-world-railway:latest
```

### 3. 取得 Deploy Hook URL

```
專案 → Settings → Deploy Hooks → New Hook
```

複製產生的 URL，貼到 GitHub Secrets 的 `RAILWAY_WEBHOOK_URL`。

### 4. 設定 PORT

Railway 會自動注入 `PORT` 環境變數，Dockerfile 已設定 `ENV PORT=3000`，不需要額外設定。

---

## GitHub Actions Workflow 解說

```yaml
jobs:
  test:          # Job 1: 確認程式碼沒問題
    ...

  docker-build-push:
    needs: test  # Job 2: 測試通過才 build image
    steps:
      - docker login   → 登入 Docker Hub
      - docker build   → 打包成 image
      - docker push    → 推到 Docker Hub（兩個 tag）
          latest       → 永遠指向最新版
          {git-sha}    → 這次 commit 的唯一版本

  deploy-to-railway:
    needs: docker-build-push  # Job 3: image 推完才部署
    steps:
      - curl Railway Webhook  → Railway 收到通知，拉新 image，重新部署
```

---

## 完成後的效果

每次 push 到 main，整個流程全自動：

```
git push
  └── 約 3-5 分鐘後
       └── https://your-app.railway.app 網站更新完成
```

---

## 兩個 Demo 比較

| | Demo 1（GitHub Pages）| Demo 2（Railway）|
|---|---|---|
| 適合場景 | 靜態網站、文件、部落格 | 有後端邏輯的 Web App |
| 部署目標 | GitHub Pages | Railway（Docker Container）|
| CI/CD 工具 | GitHub Actions | GitHub Actions |
| 容器化 | 不需要 | Dockerfile |
| Secrets 數量 | 0 個 | 3 個 |
| Demo 位置 | `cicd/demo/hello-world/` | `cicd/demo/hello-world-railway/` |

---

## 常見問題

### 1. Railway 沒有收到部署通知
→ 確認 `RAILWAY_WEBHOOK_URL` Secret 有設定且 URL 正確

### 2. Docker image 拉不到
→ 確認 Railway 的 image 名稱和 Docker Hub 一致
→ 確認 Docker Hub image 是 Public（或設定 Railway 的 Registry 憑證）

### 3. 網站啟動失敗（Port 問題）
→ `package.json` 的 start 指令要用 `next start -p $PORT`
→ Railway 會自動給 PORT，不要寫死 3000

### 4. `.next/standalone` 找不到
→ 確認 `next.config.mjs` 有設定 `output: 'standalone'`

> Demo 專案位置：`cicd/demo/hello-world-railway/`
