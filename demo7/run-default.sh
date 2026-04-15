#!/bin/bash
# 示範：預設 bridge（DNS 不通，連線失敗）

echo "=========================================="
echo " 示範：預設 Bridge Network"
echo "=========================================="

echo ""
echo "[1] 建立 Redis 容器（預設 bridge）..."
docker run -d --name demo7-redis redis:7-alpine

echo ""
echo "[2] 建立 Web 容器（預設 bridge）..."
docker run -d --name demo7-web -p 3000:3000 demo7-web

echo ""
echo "[3] 容器清單："
docker ps --filter "name=demo7"

echo ""
echo "=========================================="
echo " 開啟瀏覽器：http://localhost:3000"
echo " 預期結果：連線失敗（找不到主機 'redis'）"
echo "=========================================="

echo ""
echo "按 Enter 清除容器..."
read
docker rm -f demo7-redis demo7-web
echo "清除完成"
