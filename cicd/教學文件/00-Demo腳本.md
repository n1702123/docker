# CI/CD 實戰教育訓練 — Demo 腳本

> 講師在現場示範時，照著以下步驟操作即可。
> 每個 Demo 都標註了預估時間和講解要點。

---

## 事前準備：Demo 用的範例專案

在 Demo 之前，先準備好這個簡單的 Node.js 專案：

### 專案結構

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

### package.json

```json
{
  "name": "cicd-demo",
  "version": "1.0.0",
  "description": "CI/CD Demo App",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "test": "node test/app.test.js"
  }
}
```

### src/app.js

```javascript
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
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { getGreeting };
```

### test/app.test.js

```javascript
const { getGreeting } = require('../src/app');
const assert = require('assert');

// 簡單的測試
function runTests() {
  console.log('Running tests...\n');

  // Test 1: greeting 不為空
  assert.ok(getGreeting(), 'Greeting should not be empty');
  console.log('✅ Test 1 passed: Greeting is not empty');

  // Test 2: greeting 包含 "Hello"
  assert.ok(getGreeting().includes('Hello'), 'Greeting should contain Hello');
  console.log('✅ Test 2 passed: Greeting contains Hello');

  // Test 3: greeting 是字串
  assert.strictEqual(typeof getGreeting(), 'string', 'Greeting should be a string');
  console.log('✅ Test 3 passed: Greeting is a string');

  console.log('\n🎉 All tests passed!');
}

runTests();
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/app.js"]
```

### .dockerignore

```
node_modules
test
.github
.git
README.md
```

---

## Demo 1：第一個 GitHub Actions Workflow（15 min）

### 1-1. 建立 Workflow 檔案（5 min）

```bash
# 建立 workflows 目錄
mkdir -p .github/workflows
```

建立 `.github/workflows/hello.yml`：

```yaml
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

**講解要點**：
- 指出 YAML 的結構：`name` → `on` → `jobs` → `steps`
- 「這就像在告訴 GitHub：每次 push，幫我在一台雲端的 Linux 機器上跑這些指令」
- `run: |` 可以寫多行指令

### 1-2. Push 並觀看結果（5 min）

```bash
git add .github/workflows/hello.yml
git commit -m "Add first CI workflow"
git push
```

**講解要點**：
- 切到 GitHub → Actions 頁籤
- 即時看到 Workflow 正在跑（黃色圓圈）
- 跑完後變成綠色勾勾 ✅
- 點進去看每個 Step 的 log

### 1-3. 加一個有用的步驟（5 min）

更新 workflow，加入 checkout 和實際指令：

```yaml
name: Hello CI

on: [push]

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: List files
        run: ls -la

      - name: Show app info
        run: cat package.json
```

```bash
git add .
git commit -m "Update workflow to checkout code"
git push
```

**講解要點**：
- 「沒有 checkout，Runner 上是空的——什麼檔案都沒有」
- `uses` vs `run` 的差別：`uses` 是用別人寫好的 Action，`run` 是自己寫指令
- 展示 log 中可以看到 `ls -la` 列出了 repo 的檔案

---

## Demo 2：自動測試 + Build Docker Image（20 min）

### 2-1. 加入測試（8 min）

先在本地跑一次測試：

```bash
npm test
```

更新 workflow 為 `ci.yml`：

```yaml
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
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
```

```bash
git add .
git commit -m "Add CI with tests"
git push
```

**講解要點**：
- `actions/setup-node@v4` 幫我們在 Runner 上安裝 Node.js
- `with:` 是傳給 Action 的參數
- 切到 GitHub 看測試結果

### 2-2. 故意讓測試失敗（5 min）

修改 `src/app.js` 中的 greeting：

```javascript
function getGreeting() {
  return '';  // 故意回傳空字串
}
```

```bash
git add .
git commit -m "Break the greeting (demo failure)"
git push
```

**講解要點**：
- 展示 Actions 頁面的紅色叉叉 ❌
- 點進去看哪個 Step 失敗了
- 「如果這是一個 PR，reviewer 會看到測試失敗，就不會 merge」
- **這就是 CI 的價值——問題在合併之前就被發現**

### 2-3. 修好並加入 Docker build（7 min）

先修好 greeting，然後加入 Docker build 的 Job：

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]

jobs:
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
        run: npm install

      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t cicd-demo:test .

      - name: Verify image
        run: docker images cicd-demo
```

```bash
git add .
git commit -m "Fix greeting and add Docker build"
git push
```

**講解要點**：
- 兩個 Job：`test` 和 `build`，`build` 用 `needs: test` 等測試通過
- 展示 Actions 頁面中兩個 Job 的依賴關係圖
- 「目前只是 build image，還沒有 push。下一步我們要把它推到 Docker Hub。」

---

## Demo 3：完整 CI/CD Pipeline（25 min）

### 3-1. 設定 Secrets（5 min）

在 GitHub repo 中設定 Secrets：
1. 到 repo → Settings → Secrets and variables → Actions
2. 新增 `DOCKERHUB_USERNAME`（你的 Docker Hub 帳號）
3. 新增 `DOCKERHUB_TOKEN`（Docker Hub Access Token）

**講解要點**：
- 現場展示設定過程
- 「Secret 設定後就看不到值了，連 repo 的 owner 都看不到」
- 「在 Actions log 中，Secret 的值會被自動遮蔽成 ***」

### 3-2. 完整的 Pipeline（10 min）

更新為完整版 workflow：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
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
        run: npm install

      - name: Run tests
        run: npm test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/cicd-demo:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/cicd-demo:${{ github.sha }}
```

```bash
git add .
git commit -m "Add full CI/CD pipeline with Docker Hub push"
git push
```

**講解要點**：
- 逐行解說 YAML
- 強調 `docker/login-action` 和 `docker/build-push-action` 是 Docker 官方提供的
- 兩個 tag：`latest` 和 git SHA

### 3-3. 觀看完整流程（5 min）

切到 GitHub Actions 頁面：
1. 看到 Pipeline 開始跑
2. test Job 先執行
3. test 通過後，build-and-push Job 開始
4. 整個流程完成 ✅

### 3-4. 驗證結果（5 min）

```bash
# 到 Docker Hub 網頁看 image 已經出現

# 在本地 pull 剛剛自動 build 的 image
docker pull <your-username>/cicd-demo:latest

# 執行它
docker run -p 3000:3000 <your-username>/cicd-demo:latest

# 開瀏覽器看 http://localhost:3000
```

**講解要點**：
- 「我只是 push code，後面的事情全部自動完成——跑測試、build image、push 到 Docker Hub」
- 「任何人現在都可以 `docker pull` 這個 image 來用」
- **「這就是 CI/CD 的威力！」**

---

## 緊急備案

### 如果 GitHub Actions 跑太慢
- 先講下一段內容，等跑完再回來看結果
- 準備好上次成功跑完的結果截圖

### 如果網路不穩
- 用預先錄好的 Demo 影片替代
- 或用截圖逐步說明

### 如果 Docker Hub push 失敗
- 檢查 Secrets 設定
- 確認 Token 權限包含 Read & Write
- 備案：只 demo 到 `docker build`，push 用截圖說明
