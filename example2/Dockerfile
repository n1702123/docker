# Base Image
FROM node:20-alpine

# 設定容器內的工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json .

# 安裝套件
RUN npm install

# 複製檔案
COPY . .

# 設定環境變數
ENV APP_ENV=production
ENV APP_MESSAGE="來自 Docker 環境變數的訊息"

# 告知 Docker 程式會使用 3000 port
EXPOSE 3000

# 啟動指令
CMD ["node", "server.js"]