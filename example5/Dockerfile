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

# 告知 Docker 程式會使用 3000 port
EXPOSE 3000

# 啟動指令
CMD ["node", "server.js"]