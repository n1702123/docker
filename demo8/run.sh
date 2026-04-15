#!/bin/bash
# 示範：使用 docker compose 一鍵啟動 Web + Redis

echo "=========================================="
echo " 示範：Docker Compose"
echo "=========================================="

echo ""
echo "[1] 啟動服務（build + up）..."
docker compose up -d --build

echo ""
echo "[2] 服務清單："
docker compose ps

echo ""
echo "=========================================="
echo " 開啟瀏覽器：http://localhost:3000"
echo " 預期結果：連線成功，顯示訪問次數"
echo "=========================================="

echo ""
echo "按 Enter 停止並清除服務..."
read
docker compose down -v
echo "清除完成"
