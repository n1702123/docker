---
marp: true
theme: default
paginate: true
backgroundColor: #1e1e2e
color: #cdd6f4
style: |
  section {
    font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    font-size: 28px;
  }
  h1 {
    color: #cba6f7;
    font-size: 2em;
    border-bottom: 3px solid #cba6f7;
    padding-bottom: 10px;
  }
  h2 {
    color: #89b4fa;
    font-size: 1.5em;
  }
  h3 {
    color: #94e2d5;
    font-size: 1.2em;
  }
  code {
    background: #313244;
    color: #a6e3a1;
    border-radius: 4px;
    padding: 2px 6px;
  }
  pre {
    background: #181825;
    border-left: 4px solid #cba6f7;
    border-radius: 8px;
    padding: 16px;
    font-size: 0.65em;
  }
  pre code {
    background: transparent;
    padding: 0;
  }
  ul li {
    margin: 8px 0;
  }
  blockquote {
    border-left: 4px solid #89b4fa;
    color: #a6adc8;
    padding-left: 12px;
  }
  section.title-slide h1 {
    font-size: 2.2em;
    text-align: center;
    margin-top: 80px;
  }
  section.title-slide p {
    text-align: center;
    color: #a6adc8;
  }
---

<!-- _class: title-slide -->

# CI/CD 實戰教育訓練

## Demo 腳本

<br>

> 講師現場示範指引｜每個 Demo 均附預估時間與講解要點

---

## 目錄

| Demo | 主題 | 時間 |
|------|------|------|
| 事前準備 | 範例專案建置 | 課前完成 |
| Demo 1 | 第一個 GitHub Actions Workflow | 15 min |
| Demo 2 | 自動測試 + Build Docker Image | 20 min |
| Demo 3 | 完整 CI/CD Pipeline | 25 min |

---

## 事前準備：專案結構

```
cicd-demo/
├── .github/
│   └── workflows/        ← 上課時再一步步加
├── src/
│   └── app.js
├── test/
│   └── app.test.js
├── Dockerfile
├── package.json
└── .dockerignore
```

> workflows 目錄先建好，**保持空的**，上課時當場新增

---

## 事前準備：應用程式核心

```javascript
// src/app.js
const http = require('http');
const PORT = process.env.PORT || 3000;

function getGreeting() {
  return 'Hello from CI/CD Demo!';
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(getGreeting());
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { getGreeting };
```

---

## 事前準備：測試與 Dockerfile

```javascript
// test/app.test.js
assert.ok(getGreeting(), 'Greeting should not be empty');
assert.ok(getGreeting().includes('Hello'), '...');
assert.strictEqual(typeof getGreeting(), 'string', '...');
```

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src/ ./src/
EXPOSE 3000
CMD ["node", "src/app.js"]
```

---

# Demo 1

## 第一個 GitHub Actions Workflow

### ⏱ 15 分鐘

---

## Demo 1-1：建立 Workflow（5 min）

```yaml
# .github/workflows/hello.yml
name: Hello CI

on: [push]

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say Hello
        run: echo "Hello, CI/CD!"

      - name: Show date
        run: date

      - name: Show runner info
        run: |
          echo "OS: $(uname -s)"
          echo "User: $(whoami)"
          echo "Directory: $(pwd)"
```

---

## Demo 1-1：講解要點

YAML 結構層次：

```
name → on → jobs → steps
```

- **「每次 push，GitHub 幫我在一台雲端 Linux 機器上跑這些指令」**
- `run: |` 可以寫多行指令

```bash
git add .github/workflows/hello.yml
git commit -m "Add first CI workflow"
git push
```

---

## Demo 1-2：Push 並觀看結果（5 min）

切到 GitHub → **Actions** 頁籤

| 狀態 | 說明 |
|------|------|
| 🟡 黃色圓圈 | Workflow 正在執行 |
| ✅ 綠色勾勾 | 執行成功 |
| ❌ 紅色叉叉 | 執行失敗 |

> 點進去看每個 Step 的 log，讓學員看到指令輸出

---

## Demo 1-3：加入 Checkout（5 min）

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4   # ← 新增

  - name: List files
    run: ls -la                  # ← 現在有檔案了

  - name: Show app info
    run: cat package.json
```

**講解要點**

- 沒有 `checkout`，Runner 上是**空的**，什麼檔案都沒有
- `uses` vs `run`：
  - `uses` — 使用別人寫好的 Action
  - `run` — 自己寫 shell 指令

---

# Demo 2

## 自動測試 + Build Docker Image

### ⏱ 20 分鐘

---

## Demo 2-1：加入自動測試（8 min）

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
```

- `with:` 是傳給 Action 的參數
- `on: pull_request` — PR 送出時也會觸發

---

## Demo 2-2：故意讓測試失敗（5 min）

```javascript
// src/app.js — 故意改壞
function getGreeting() {
  return '';  // ← 空字串，讓 Test 1 失敗
}
```

```bash
git add . && git commit -m "Break the greeting (demo failure)" && git push
```

觀察 Actions 頁面出現 ❌

> **「如果這是 PR，reviewer 看到測試失敗就不會 merge」**
>
> **這就是 CI 的核心價值——問題在合併前被發現！**

---

## Demo 2-3：修好 + 加 Docker Build（7 min）

```yaml
  build:
    needs: test          # ← 測試通過才執行
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t cicd-demo:test .

      - name: Verify image
        run: docker images cicd-demo
```

- 兩個 Job 有明確依賴：`build` 等 `test` 通過才跑
- Actions 頁面可以看到 **Job 依賴關係圖**
- 目前只 build，還沒 push → 下一步才推到 Docker Hub

---

# Demo 3

## 完整 CI/CD Pipeline

### ⏱ 25 分鐘

---

## Demo 3-1：設定 Secrets（5 min）

### Repo → Settings → Secrets and variables → Actions

| Secret 名稱 | 值 |
|-------------|-----|
| `DOCKERHUB_USERNAME` | 你的 Docker Hub 帳號 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |

- Secret 設定後**看不到值**，連 repo owner 都看不到
- 在 Actions log 中，Secret 會被自動遮蔽成 `***`

---

## Demo 3-2：完整 Pipeline（10 min）

```yaml
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/cicd-demo:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/cicd-demo:${{ github.sha }}
```

---

## Demo 3-2：講解要點

- `docker/login-action` 和 `docker/build-push-action` 是 **Docker 官方** Action
- 兩個 tag：
  - `latest` — 最新版本
  - `git SHA` — 可追蹤到特定 commit

```bash
git add . && git commit -m "Add full CI/CD pipeline with Docker Hub push" && git push
```

---

## Demo 3-3：觀看完整流程（5 min）

切到 GitHub Actions 頁面，依序觀察：

1. Pipeline 開始跑 🟡
2. `test` Job 先執行
3. `test` 通過後，`build-and-push` Job 開始
4. 整個流程完成 ✅

---

## Demo 3-4：驗證結果（5 min）

```bash
# 到 Docker Hub 網頁確認 image 已出現

# 在本地 pull 自動 build 的 image
docker pull <your-username>/cicd-demo:latest

# 執行
docker run -p 3000:3000 <your-username>/cicd-demo:latest

# 開瀏覽器
# http://localhost:3000
```

---

## 完整流程回顧

```
Push code
    ↓
GitHub Actions 觸發
    ↓
test Job：安裝依賴 → 跑測試
    ↓（測試通過）
build-and-push Job：Build Image → Push to Docker Hub
    ↓
任何人都可以 docker pull 這個 image 來用
```

> **「我只是 push code，後面全部自動完成」**
> **這就是 CI/CD 的威力！**

---

## 緊急備案

| 狀況 | 解決方案 |
|------|----------|
| Actions 跑太慢 | 先講下一段，等跑完再回來看；準備截圖備用 |
| 網路不穩 | 使用預先錄好的影片；或截圖逐步說明 |
| Docker Hub push 失敗 | 檢查 Secrets 及 Token 權限（Read & Write）；備案只 demo 到 `docker build` |

---

<!-- _class: title-slide -->

# 謝謝！

## Q & A

<br>

> 有任何問題歡迎提問
