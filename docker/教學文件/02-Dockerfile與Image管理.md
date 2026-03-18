# 02 - Dockerfile 與 Image 管理

## 什麼是 Dockerfile？

Dockerfile 是一個**純文字檔案**，裡面包含一系列指令，告訴 Docker 如何一步步建立一個 Image。

```
Dockerfile  →  docker build  →  Image  →  docker run  →  Container
（設計圖）     （建造過程）    （成品模板）   （執行）      （執行中的實例）
```

---

## Dockerfile 基本結構

```dockerfile
# 基底 Image
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製檔案
COPY package*.json ./

# 執行指令
RUN npm install

# 複製其餘檔案
COPY . .

# 暴露 port
EXPOSE 3000

# 容器啟動時執行的指令
CMD ["node", "server.js"]
```

---

## Dockerfile 指令詳解

### FROM — 指定基底 Image

```dockerfile
# 使用官方 Node.js image
FROM node:20-alpine

# 使用特定版本的 Python
FROM python:3.12-slim

# 使用最精簡的 Linux
FROM alpine:3.19

# 從空白開始（用於靜態編譯的程式）
FROM scratch
```

> **建議**：優先使用 `alpine` 或 `slim` 版本，Image 更小。

### WORKDIR — 設定工作目錄

```dockerfile
WORKDIR /app

# 之後的 RUN、COPY、CMD 都會在 /app 下執行
# 如果目錄不存在會自動建立
```

### COPY vs ADD

```dockerfile
# COPY：單純複製檔案（推薦使用）
COPY package.json ./
COPY src/ ./src/

# ADD：有額外功能（自動解壓縮 tar、支援 URL）
ADD app.tar.gz /app/
```

| 差異 | COPY | ADD |
|------|------|-----|
| 複製本地檔案 | ✅ | ✅ |
| 自動解壓 tar | ❌ | ✅ |
| 支援 URL | ❌ | ✅ |
| **推薦程度** | **優先使用** | 僅在需要特殊功能時 |

### RUN — 建立 Image 時執行指令

```dockerfile
# 安裝套件
RUN apt-get update && apt-get install -y curl

# 多個指令用 && 連接（減少 layer 數量）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

> **注意**：每個 `RUN` 會建立一個新的 layer，所以盡量把相關指令合併。

### CMD vs ENTRYPOINT

這是面試最常考的題目之一！

```dockerfile
# CMD：容器啟動時的預設指令（可被覆蓋）
CMD ["node", "server.js"]

# ENTRYPOINT：容器啟動時一定會執行的指令（不易被覆蓋）
ENTRYPOINT ["node", "server.js"]
```

#### 差異比較

```dockerfile
# 範例 1：只用 CMD
FROM node:20-alpine
CMD ["node", "server.js"]
```

```bash
docker run myapp                 # 執行 node server.js ✅
docker run myapp node test.js    # 執行 node test.js（CMD 被覆蓋）
```

```dockerfile
# 範例 2：只用 ENTRYPOINT
FROM node:20-alpine
ENTRYPOINT ["node", "server.js"]
```

```bash
docker run myapp                 # 執行 node server.js ✅
docker run myapp node test.js    # 執行 node server.js node test.js（參數被附加）
```

```dockerfile
# 範例 3：ENTRYPOINT + CMD 搭配使用（最佳實踐）
FROM node:20-alpine
ENTRYPOINT ["node"]
CMD ["server.js"]
```

```bash
docker run myapp                 # 執行 node server.js ✅
docker run myapp test.js         # 執行 node test.js（只有 CMD 被覆蓋）
```

### ENV — 設定環境變數

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000

# 也可以一次設定多個
ENV NODE_ENV=production \
    PORT=3000
```

### EXPOSE — 宣告 port

```dockerfile
# 宣告容器會使用 3000 port（僅作為文件用途，不會實際開啟）
EXPOSE 3000

# 實際的 port mapping 還是要在 docker run -p 時指定
```

### ARG — 建置時的變數

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

ARG BUILD_ENV=production
RUN echo "Building for ${BUILD_ENV}"
```

```bash
# build 時可以覆蓋
docker build --build-arg NODE_VERSION=18 .
```

| 比較 | ARG | ENV |
|------|-----|-----|
| 可用時機 | 只在 build 時 | build 時和 Container 執行時 |
| 用途 | 控制 build 流程 | 設定程式的執行環境 |

---

## Image Layer（分層）機制

Docker Image 由多個**唯讀的 layer（層）** 堆疊而成：

```
┌─────────────────────┐
│ CMD ["node", "..."] │  ← Layer 5（metadata，不佔空間）
├─────────────────────┤
│ COPY . .            │  ← Layer 4（應用程式碼）
├─────────────────────┤
│ RUN npm install     │  ← Layer 3（node_modules）
├─────────────────────┤
│ COPY package*.json  │  ← Layer 2（package files）
├─────────────────────┤
│ FROM node:20-alpine │  ← Layer 1（base image）
└─────────────────────┘
```

### Build Cache 機制

Docker 會**快取**每一層。如果某一層的內容沒有變動，就會使用快取，不會重新建立。

```dockerfile
# ❌ 不好的寫法：每次改程式碼都要重新 npm install
COPY . .
RUN npm install

# ✅ 好的寫法：只有 package.json 改變時才重新 npm install
COPY package*.json ./
RUN npm install
COPY . .
```

**原則**：把不常變動的指令放前面，常變動的放後面。

---

## .dockerignore

跟 `.gitignore` 類似，排除不需要送進 Docker build context 的檔案：

```
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
Dockerfile
docker-compose.yml
README.md
.vscode
```

好處：
- 減少 build context 大小 → 加速 build
- 避免把機密檔案（如 `.env`）放進 Image

---

## Multi-stage Build

用來大幅減少最終 Image 的大小。

### 範例：Node.js 應用

```dockerfile
# ===== 階段 1：Build =====
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== 階段 2：Production =====
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 範例：Go 應用（效果更顯著）

```dockerfile
# Build stage
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o myapp

# Production stage
FROM alpine:3.19
COPY --from=builder /app/myapp /usr/local/bin/
CMD ["myapp"]
```

大小比較：
- 沒有 multi-stage：~800MB（包含整個 Go 工具鏈）
- 有 multi-stage：~15MB（只有執行檔 + alpine）

---

## 實作練習

### 練習 1：建立一個簡單的 web app Image

建立以下檔案結構：

```
my-app/
├── Dockerfile
├── .dockerignore
└── index.html
```

**index.html**
```html
<!DOCTYPE html>
<html>
<head><title>My Docker App</title></head>
<body><h1>Hello from Docker!</h1></body>
</html>
```

**Dockerfile**
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 80
```

**.dockerignore**
```
Dockerfile
.dockerignore
```

```bash
# Build image
docker build -t my-web-app .

# 執行
docker run -d -p 8080:80 --name web my-web-app

# 開啟 http://localhost:8080 查看
```

### 練習 2：建立一個 Python app Image

```
python-app/
├── Dockerfile
├── requirements.txt
└── app.py
```

**app.py**
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Docker + Python!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**requirements.txt**
```
flask==3.0.0
```

**Dockerfile**
```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
```

```bash
docker build -t my-python-app .
docker run -d -p 5000:5000 my-python-app
# 開啟 http://localhost:5000
```

---

## Image 管理指令

```bash
# 查看 image 詳細資訊
docker inspect <image>

# 查看 image 的 layer 歷史
docker history <image>

# Tag image
docker tag my-app myusername/my-app:v1.0

# 推送到 Docker Hub
docker login
docker push myusername/my-app:v1.0

# 清理未使用的 image
docker image prune         # 移除 dangling images
docker image prune -a      # 移除所有未使用的 images
```

---

## 面試常見問題與解答

**Q：CMD 與 ENTRYPOINT 的差異？**
> CMD 提供預設指令，可以被 `docker run` 後面的參數覆蓋。ENTRYPOINT 定義容器的主要執行指令，不容易被覆蓋。兩者搭配使用時，CMD 提供預設參數給 ENTRYPOINT。

**Q：如何減少 Docker image 的大小？**
> 1. 使用 alpine 或 slim 版本的 base image
> 2. 使用 multi-stage build
> 3. 合併 RUN 指令減少 layer
> 4. 清理快取（如 `rm -rf /var/lib/apt/lists/*`）
> 5. 使用 .dockerignore 排除不需要的檔案

**Q：COPY 和 ADD 的差異？**
> 兩者都能複製檔案進 Image。ADD 額外支援自動解壓 tar 檔和從 URL 下載。一般建議優先使用 COPY，因為行為更明確。
