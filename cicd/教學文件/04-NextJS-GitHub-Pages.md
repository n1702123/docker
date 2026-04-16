# 04 - Next.js + GitHub Actions + GitHub Pages

## 目標

用 GitHub Actions 自動部署 Next.js 靜態網站到 GitHub Pages：
> Push code → 自動 Build → 自動部署到網路上

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
GitHub Actions 自動觸發
        │
        ├── Step 1: Checkout 程式碼
        ├── Step 2: 安裝 Node.js
        ├── Step 3: npm ci（安裝相依套件）
        ├── Step 4: npm run build（輸出靜態檔到 out/）
        └── Step 5: 推到 gh-pages branch
        │
        ▼
  GitHub Pages 更新網站
  ✅ 網址：https://{帳號}.github.io/{repo名稱}/
```

---

## 專案結構

```
hello-world/
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions 設定
├── app/
│   ├── layout.js           ← HTML 基本結構
│   └── page.js             ← 首頁內容（Hello World）
├── next.config.mjs         ← Next.js 設定（靜態輸出）
└── package.json
```

---

## 關鍵設定：next.config.mjs

```js
const nextConfig = {
  output: 'export',         // 輸出靜態檔案
  basePath: '/hello-world', // 對應 GitHub repo 名稱
  images: {
    unoptimized: true,      // 靜態輸出不支援圖片優化
  },
}
```

### 為什麼需要 `basePath`？

GitHub Pages 的網址是 `https://帳號.github.io/repo名稱/`，不是根目錄。
`basePath` 告訴 Next.js 所有路徑都要加上這個前綴。

| 設定 | 網址結果 |
|------|---------|
| 沒有 `basePath` | `https://帳號.github.io/`（找不到） |
| `basePath: '/hello-world'` | `https://帳號.github.io/hello-world/`（正確） |

---

## GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]       # push 到 main 時自動觸發
  workflow_dispatch:        # 也可以手動觸發

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 需要寫入權限推到 gh-pages branch

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

      - name: Build
        run: npm run build  # 輸出到 out/ 資料夾

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

### 逐步解說

| Step | 做了什麼 | 說明 |
|------|---------|------|
| Checkout | 把程式碼拉到 Runner | Runner 是全新空機器 |
| Setup Node.js | 安裝 Node.js 20 | Next.js 需要 Node.js 環境 |
| npm ci | 安裝相依套件 | `ci` 比 `install` 更嚴格，適合 CI 環境 |
| npm run build | Build 靜態檔案 | 輸出到 `out/` 資料夾 |
| Deploy | 推到 gh-pages branch | `peaceiris/actions-gh-pages` 負責這件事 |

---

## `GITHUB_TOKEN` 是什麼？

不需要自己設定！GitHub 會自動提供這個 Token，只要在 `permissions` 給它 `contents: write` 權限就可以用。

```yaml
permissions:
  contents: write   # 允許 Workflow 寫入（推 code 到 gh-pages branch）
```

---

## GitHub 上的設定步驟

1. 把專案 push 到 GitHub
2. 等 Actions 跑完（約 1-2 分鐘）
3. 到 repo → **Settings** → **Pages**
4. Source 選 **Deploy from a branch**
5. Branch 選 **`gh-pages`**，資料夾選 **`/ (root)`**
6. 按 Save

```
Settings → Pages
┌─────────────────────────────────────┐
│ Source                              │
│ ○ GitHub Actions                    │
│ ● Deploy from a branch  ← 選這個   │
│                                     │
│ Branch: gh-pages  /  / (root)       │
│                          [Save]     │
└─────────────────────────────────────┘
```

---

## 完成後

網址：
```
https://{你的GitHub帳號}.github.io/hello-world/
```

每次 push 到 main，網站就會自動更新。

---

## 常見問題

### 1. 頁面空白或 404
→ 檢查 `basePath` 是否對應 repo 名稱

### 2. Build 失敗：`output: export` 不支援某些功能
→ Next.js 靜態輸出不支援 Server Components 的動態功能（如 `getServerSideProps`）
→ 改用 `getStaticProps` 或純 Client Component

### 3. gh-pages branch 沒有出現
→ 確認 `permissions: contents: write` 有設定
→ 確認 Actions 有跑成功（到 Actions 頁籤查看）

### 4. Settings → Pages 找不到 gh-pages 選項
→ 等 Actions 第一次跑完才會建立 gh-pages branch

---

## 小結

| 元件 | 負責的事 |
|------|---------|
| `next.config.mjs` | 設定靜態輸出和 basePath |
| `npm run build` | 把 Next.js 編譯成靜態 HTML/CSS/JS |
| `peaceiris/actions-gh-pages` | 把 build 結果推到 gh-pages branch |
| GitHub Pages | 把 gh-pages branch 的內容對外發布 |

> Demo 專案位置：`cicd/demo/hello-world/`
