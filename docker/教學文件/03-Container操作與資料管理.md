# 03 - Container 操作與資料管理

## Container 生命週期

```
        docker create
            │
            ▼
  ┌──── Created ◄──────────────────┐
  │         │                       │
  │    docker start                 │
  │         │                       │
  │         ▼                       │
  │     Running ──── docker stop ──► Stopped
  │         │                         │
  │    docker pause                docker rm
  │         │                         │
  │         ▼                         ▼
  │      Paused                   Removed
  │         │
  │    docker unpause
  │         │
  └─────────┘
```

```bash
# 完整生命週期示範
docker create --name demo nginx    # 建立（不啟動）
docker start demo                  # 啟動
docker pause demo                  # 暫停
docker unpause demo                # 恢復
docker stop demo                   # 停止（送 SIGTERM，10 秒後 SIGKILL）
docker rm demo                     # 移除
```

### docker run = docker create + docker start

```bash
# 這兩組是等價的：
docker run -d --name web nginx

# 等同於
docker create --name web nginx
docker start web
```

---

## 環境變數

### 用 `-e` flag 傳遞

```bash
# 單個環境變數
docker run -e MY_VAR=hello nginx

# 多個環境變數
docker run \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=mydb \
  postgres
```

### 用 env file 傳遞

```bash
# 建立 .env 檔案
cat > app.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=admin
DB_PASSWORD=secret123
EOF

# 使用 --env-file
docker run --env-file app.env postgres
```

### 驗證環境變數

```bash
# 查看 container 的所有環境變數
docker exec my-container env

# 查看特定變數
docker exec my-container printenv DB_HOST
```

---

## Port Mapping

```
  Host (你的電腦)              Container
  ┌──────────────┐          ┌──────────────┐
  │              │          │              │
  │  Port 8080 ──┼──────────┼── Port 80   │
  │              │          │              │
  │  Port 3000 ──┼──────────┼── Port 3000 │
  │              │          │              │
  └──────────────┘          └──────────────┘
```

```bash
# 基本格式：-p <host_port>:<container_port>
docker run -d -p 8080:80 nginx

# 多個 port mapping
docker run -d -p 8080:80 -p 8443:443 nginx

# 讓 Docker 自動分配 host port
docker run -d -p 80 nginx
docker port <container>    # 查看分配的 port

# 綁定到特定 IP
docker run -d -p 127.0.0.1:8080:80 nginx    # 只有本地可以存取
```

---

## 資料持久化

Container 被移除後，裡面的資料就消失了。要保留資料，需要使用以下機制：

### 三種方式比較

```
┌─────────── Host ───────────────────────────────┐
│                                                 │
│  ┌─── Named Volume ───┐  ┌── Bind Mount ──────┐│
│  │ Docker 管理的位置    │  │ 你指定的 Host 路徑  ││
│  │ /var/lib/docker/... │  │ /home/user/app     ││
│  └──────┬──────────────┘  └──────┬─────────────┘│
│         │                        │               │
│    ┌────▼────────────────────────▼────┐          │
│    │          Container               │          │
│    │    /data          /app           │          │
│    └──────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
```

| 方式 | 管理者 | 適用場景 |
|------|--------|---------|
| **Named Volume** | Docker 管理 | 資料庫資料、持久化儲存 |
| **Bind Mount** | 使用者指定路徑 | 開發時同步程式碼 |
| **tmpfs Mount** | 記憶體 | 暫存敏感資料 |

### Named Volume

```bash
# 建立 volume
docker volume create my-data

# 使用 volume（-v 語法）
docker run -d \
  -v my-data:/var/lib/mysql \
  --name db \
  mysql:8.0

# 使用 volume（--mount 語法，更明確）
docker run -d \
  --mount source=my-data,target=/var/lib/mysql \
  --name db \
  mysql:8.0

# 查看 volume
docker volume ls
docker volume inspect my-data

# 移除 volume
docker volume rm my-data

# 清理所有未使用的 volume
docker volume prune
```

### Bind Mount

```bash
# 把 Host 的當前目錄掛載到 Container 的 /app
docker run -d \
  -v $(pwd):/app \
  --name dev \
  node:20-alpine

# 唯讀掛載（Container 不能修改）
docker run -d \
  -v $(pwd)/config:/app/config:ro \
  nginx
```

### 實用範例：MySQL 資料持久化

```bash
# 啟動 MySQL 並用 volume 保存資料
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0

# 驗證：建立一些資料
docker exec -it mysql-db mysql -uroot -prootpass -e \
  "USE myapp; CREATE TABLE users (id INT, name VARCHAR(50)); INSERT INTO users VALUES (1, 'Alice');"

# 停止並移除 container
docker stop mysql-db
docker rm mysql-db

# 重新建立 container，使用同一個 volume
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -v mysql-data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0

# 確認資料還在
docker exec -it mysql-db mysql -uroot -prootpass -e \
  "USE myapp; SELECT * FROM users;"
# 結果：id=1, name=Alice ✅ 資料保留了！
```

---

## Container 偵錯工具

### docker logs — 查看 log

```bash
# 查看全部 log
docker logs my-container

# 即時追蹤 log（類似 tail -f）
docker logs -f my-container

# 只看最後 100 行
docker logs --tail 100 my-container

# 顯示時間戳記
docker logs -t my-container

# 查看特定時間之後的 log
docker logs --since 2024-01-01T00:00:00 my-container
docker logs --since 10m my-container    # 最近 10 分鐘
```

### docker exec — 進入 Container

```bash
# 進入 bash
docker exec -it my-container bash

# 進入 sh（有些 image 沒有 bash）
docker exec -it my-container sh

# 執行單一指令
docker exec my-container ls /app
docker exec my-container cat /etc/hosts
```

### docker inspect — 查看詳細資訊

```bash
# 查看完整 JSON 格式的資訊
docker inspect my-container

# 查看特定資訊（用 Go template）
docker inspect --format '{{.NetworkSettings.IPAddress}}' my-container
docker inspect --format '{{.State.Status}}' my-container
docker inspect --format '{{json .Mounts}}' my-container
```

### docker stats — 即時資源監控

```bash
# 查看所有 Container 的 CPU、記憶體使用量
docker stats

# 查看特定 Container
docker stats my-container

# 只顯示一次（不持續更新）
docker stats --no-stream
```

### docker top — 查看 Container 內的行程

```bash
docker top my-container
```

---

## 清理資源

```bash
# 移除所有已停止的 Container
docker container prune

# 移除未使用的 Image
docker image prune

# 移除未使用的 Volume
docker volume prune

# 移除未使用的 Network
docker network prune

# 一次清理所有未使用的資源（Container、Image、Network）
docker system prune

# 包含 Volume（注意：會刪除資料！）
docker system prune --volumes

# 查看 Docker 佔用的磁碟空間
docker system df
```

---

## 練習題

### 練習 1：環境變數與 Port

啟動一個 Nginx container，要求：
- 名稱為 `practice-web`
- 在背景執行
- Port mapping：本地 9090 對應 container 80
- 設定環境變數 `APP_ENV=development`

### 練習 2：Volume 持久化

1. 建立一個 named volume `practice-vol`
2. 啟動一個 alpine container，掛載這個 volume 到 `/data`
3. 在 `/data` 裡建立一個檔案
4. 移除 container
5. 啟動另一個 alpine container，掛載同一個 volume
6. 確認檔案還在

### 練習 3：偵錯

1. 啟動一個 nginx container
2. 用 `docker logs` 查看它的 log
3. 用 `docker exec` 進入 container，修改首頁內容
4. 用 `docker stats` 查看資源使用狀況
5. 用 `docker inspect` 找出 container 的 IP 位址

<details>
<summary>參考解答</summary>

```bash
# 練習 1
docker run -d \
  --name practice-web \
  -p 9090:80 \
  -e APP_ENV=development \
  nginx

# 練習 2
docker volume create practice-vol
docker run -it --rm -v practice-vol:/data alpine sh -c "echo 'hello' > /data/test.txt"
docker run -it --rm -v practice-vol:/data alpine cat /data/test.txt
# 輸出：hello ✅

# 練習 3
docker run -d --name debug-nginx -p 8080:80 nginx
docker logs debug-nginx
docker exec -it debug-nginx bash -c "echo '<h1>Modified!</h1>' > /usr/share/nginx/html/index.html"
docker stats debug-nginx --no-stream
docker inspect --format '{{.NetworkSettings.IPAddress}}' debug-nginx
```

</details>
