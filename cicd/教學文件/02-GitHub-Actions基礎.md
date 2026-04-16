# 02 - GitHub Actions 基礎

## 什麼是 GitHub Actions？

GitHub Actions 是 GitHub 內建的 **CI/CD 自動化平台**，讓你可以在 GitHub repo 裡直接定義自動化流程。

簡單來說：
> 當某件事發生在你的 repo（例如 push code），GitHub 就自動幫你執行指定的任務。

---

## 核心概念

### 架構總覽

```
┌─ Repository ────────────────────────────────────┐
│                                                  │
│  .github/workflows/                              │
│      ├── ci.yml        ← Workflow 定義檔         │
│      ├── deploy.yml                              │
│      └── test.yml                                │
│                                                  │
└──────────────────────────────────────────────────┘
        │
        │ 觸發（push / PR / 定時...）
        ▼
┌─ GitHub Actions ────────────────────────────────┐
│                                                  │
│  Workflow（工作流程）                              │
│    └── Job（工作）                                │
│          └── Step（步驟）                          │
│                └── Action（動作）                  │
│                                                  │
│  在 Runner（執行環境）上執行                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 關鍵術語

| 術語 | 說明 | 類比 |
|------|------|------|
| **Workflow** | 一個完整的自動化流程，定義在 YAML 檔中 | 一張食譜 |
| **Event** | 觸發 Workflow 的事件（push、PR、定時等） | 「開始做菜」的信號 |
| **Job** | Workflow 中的一組任務，可以平行或依序執行 | 食譜中的一道菜 |
| **Step** | Job 中的單一步驟 | 做菜的每個步驟 |
| **Action** | 可重用的動作模組（社群或自訂） | 預製的調味料包 |
| **Runner** | 執行 Job 的伺服器環境 | 廚房 |

---

## 第一個 Workflow

### 檔案位置

Workflow 檔案必須放在 `.github/workflows/` 目錄下：

```
my-project/
├── .github/
│   └── workflows/
│       └── ci.yml       ← 這裡！
├── src/
├── Dockerfile
└── README.md
```

### 最簡單的 Workflow

```yaml
# .github/workflows/hello.yml
name: Hello CI                    # Workflow 名稱

on: [push]                        # 觸發條件：push 時執行

jobs:
  say-hello:                      # Job ID
    runs-on: ubuntu-latest        # 執行環境
    steps:
      - name: Say Hello           # 步驟名稱
        run: echo "Hello, CI/CD!" # 執行的指令
```

**逐行解說**：

| 行 | 說明 |
|-----|------|
| `name:` | 這個 Workflow 在 GitHub UI 上顯示的名稱 |
| `on: [push]` | 當 push 到任何分支時觸發 |
| `jobs:` | 定義要執行的工作 |
| `runs-on: ubuntu-latest` | 在 GitHub 提供的 Ubuntu 機器上跑 |
| `steps:` | 這個 Job 的步驟清單 |
| `run:` | 要執行的 shell 指令 |

---

## 觸發條件（Events）

### 常用觸發事件

```yaml
on:
  push:                          # push 到 repo 時
    branches: [main]             # 只限 main 分支
  pull_request:                  # 建立或更新 PR 時
    branches: [main]
  schedule:                      # 定時執行
    - cron: '0 9 * * 1'         # 每週一早上 9 點
  workflow_dispatch:             # 手動觸發（在 GitHub UI 上按按鈕）
```

### 觸發條件對照表

| 事件 | 說明 | 常見用途 |
|------|------|----------|
| `push` | Push 到 repo | CI 測試 |
| `pull_request` | PR 建立 / 更新 | Code review 前自動測試 |
| `schedule` | 定時（cron） | 定期安全掃描、nightly build |
| `workflow_dispatch` | 手動觸發 | 按需部署 |
| `release` | 建立 Release | 正式版本發佈 |

---

## Steps 詳解

### 兩種 Step

```yaml
steps:
  # 第一種：使用現成的 Action
  - name: Checkout code
    uses: actions/checkout@v4        # 使用社群 / 官方提供的 Action

  # 第二種：直接執行指令
  - name: Run tests
    run: npm test                    # 執行 shell 指令
```

### 常用的官方 Action

| Action | 用途 |
|--------|------|
| `actions/checkout@v4` | 把 repo 的程式碼拉下來（幾乎每個 workflow 都需要） |
| `actions/setup-node@v4` | 安裝 Node.js |
| `actions/setup-python@v5` | 安裝 Python |
| `actions/cache@v4` | 快取相依套件，加速 CI |
| `docker/build-push-action@v5` | Build 並 push Docker image |
| `peaceiris/actions-gh-pages@v3` | 部署靜態檔案到 GitHub Pages |

---

## Jobs 的執行方式

### 平行執行（預設）

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  lint:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running linter"

  # test 和 lint 同時跑！
```

### 依序執行（needs）

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  deploy:
    needs: test                    # 等 test 完成才跑
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

```
平行：                     依序：
┌──────┐                  ┌──────┐
│ test │                  │ test │
└──────┘                  └──┬───┘
┌──────┐                     │
│ lint │                  ┌──▼───┐
└──────┘                  │deploy│
（同時跑）                 └──────┘
                          （test 先，deploy 後）
```

---

## 環境變數與 Secrets

### 環境變數

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:                              # Job 層級的環境變數
      NODE_ENV: production
    steps:
      - name: Show env
        run: echo "Environment is $NODE_ENV"

      - name: Step-level env
        env:                          # Step 層級的環境變數
          MY_VAR: hello
        run: echo "$MY_VAR"
```

### GitHub Secrets

用來存放 **敏感資訊**（密碼、Token、API Key），不會出現在 log 中：

```yaml
steps:
  - name: Login to Docker Hub
    run: echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
```

**設定方式**：
1. 到 GitHub repo → Settings → Secrets and variables → Actions
2. 點 "New repository secret"
3. 輸入名稱（如 `DOCKER_PASSWORD`）和值

> **重要**：絕對不要把密碼寫在 YAML 檔裡面！一律使用 Secrets。

---

## GitHub Actions 的執行環境（Runner）

| Runner | 說明 |
|--------|------|
| `ubuntu-latest` | GitHub 提供的 Ubuntu Linux（最常用） |
| `windows-latest` | GitHub 提供的 Windows |
| `macos-latest` | GitHub 提供的 macOS |
| Self-hosted | 自己架設的 Runner |

> 免費額度：公開 repo 無限制，私有 repo 每月 2,000 分鐘。

---

## 完整範例：Node.js CI

```yaml
name: Node.js CI

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
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test
```

---

## 在 GitHub 上查看結果

Push 之後，可以在以下位置查看 Workflow 執行狀態：

1. **Actions 頁籤**：repo 頂部的 "Actions" → 看到所有 Workflow 的執行記錄
2. **Commit 狀態**：每個 commit 旁邊的 ✅ 或 ❌ 圖示
3. **PR 檢查**：PR 頁面底部的 "Checks" 區塊

---

## 小結

| 概念 | 說明 |
|------|------|
| Workflow | `.github/workflows/*.yml`，定義自動化流程 |
| Event | 觸發條件（push、PR、定時等） |
| Job | 一組步驟，跑在 Runner 上 |
| Step | 單一步驟（`run` 指令或 `uses` Action） |
| Secrets | 安全存放敏感資訊 |

> 接下來我們要把 Docker 整合進 GitHub Actions，實現自動 Build 並 Push Image！
> 另外也可以搭配 GitHub Pages，自動部署 Next.js 靜態網站 → 參考 [04-NextJS-GitHub-Pages.md](04-NextJS-GitHub-Pages.md)
