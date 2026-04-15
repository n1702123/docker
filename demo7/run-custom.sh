#!/bin/bash
# 示範：自訂 bridge（DNS 正常，連線成功）

echo "=========================================="
echo " 示範：自訂 Bridge Network"
echo "=========================================="

echo ""
echo "[1] 建立自訂網路 demo7-net..."
docker network create demo7-net

echo ""
echo "[2] 建立 Redis 容器（加入 demo7-net）..."
docker run -d --name demo7-redis --network demo7-net redis:7-alpine

echo ""
echo "[3] 建立 Web 容器（加入 demo7-net）..."
docker run -d --name demo7-web --network demo7-net -p 3000:3000 demo7-web

echo ""
echo "[4] 容器清單："
docker ps --filter "name=demo7"

echo ""
echo "[5] 驗證 DNS 解析（在 web 容器內 ping redis）..."
docker exec demo7-web ping -c 3 demo7-redis

echo ""
echo "=========================================="
echo " 開啟瀏覽器：http://localhost:3000"
echo " 預期結果：連線成功，顯示訪問次數"
echo "=========================================="

echo ""
echo "按 Enter 清除容器與網路..."
read
docker rm -f demo7-redis demo7-web
docker network rm demo7-net
echo "清除完成"
