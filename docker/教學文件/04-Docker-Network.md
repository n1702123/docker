# 04 - Docker Network

## 為什麼需要了解 Docker Network？

當你有多個 Container 需要互相通訊時（例如 web app 要連 database），就需要了解 Docker 的網路機制。

```
┌─────────────────────────────────────┐
│          Docker Network             │
│                                     │
│  ┌──────────┐     ┌──────────┐     │
│  │  Web App  │────►│ Database │     │
│  │ (Node.js) │     │ (MySQL)  │     │
│  └──────────┘     └──────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## Network Driver 類型

| Driver | 說明 | 使用場景 |
|--------|------|---------|
| **bridge** | 預設。Container 在同一台 Host 上溝通 | 單機多容器應用 |
| **host** | Container 直接使用 Host 的網路 | 需要最佳網路效能 |
| **none** | 完全沒有網路 | 安全性要求高的 Container |
| **overlay** | 跨多台 Host 的網路 | Docker Swarm / 叢集環境 |

---

## Bridge Network（重點）

### 預設 bridge vs 自訂 bridge

Docker 有一個預設的 bridge network（名為 `bridge`），但**強烈建議使用自訂 bridge network**。

| 功能 | 預設 bridge | 自訂 bridge |
|------|------------|------------|
| DNS 解析（用名稱互連） | ❌ 只能用 IP | ✅ 可用 container 名稱 |
| 隔離性 | 所有 Container 都在裡面 | 只有加入的 Container |
| 即時連接/斷開 | ❌ 需要重啟 | ✅ 可以動態操作 |

### 實作：預設 bridge 的問題

```bash
# 啟動兩個 Container（使用預設 bridge）
docker run -d --name app1 alpine sleep 3600
docker run -d --name app2 alpine sleep 3600

# 嘗試用名稱互 ping → 失敗！
docker exec app1 ping -c 2 app2
# ping: bad address 'app2'

# 必須用 IP 才行
docker inspect --format '{{.NetworkSettings.IPAddress}}' app2
# 172.17.0.3
docker exec app1 ping -c 2 172.17.0.3
# PING 172.17.0.3: 64 bytes... ✅

# 清理
docker rm -f app1 app2
```

### 實作：自訂 bridge 的好處

```bash
# 建立自訂 network
docker network create my-network

# 啟動 Container 並加入自訂 network
docker run -d --name app1 --network my-network alpine sleep 3600
docker run -d --name app2 --network my-network alpine sleep 3600

# 用名稱互 ping → 成功！
docker exec app1 ping -c 2 app2
# PING app2 (172.18.0.3): 64 bytes... ✅

# 清理
docker rm -f app1 app2
docker network rm my-network
```

---

## Network 管理指令

```bash
# 列出所有 network
docker network ls

# 建立 network
docker network create my-net

# 查看 network 詳細資訊
docker network inspect my-net

# 將正在執行的 Container 加入 network
docker network connect my-net my-container

# 將 Container 從 network 中移除
docker network disconnect my-net my-container

# 刪除 network
docker network rm my-net

# 清理未使用的 network
docker network prune
```

---

## 實戰範例：Web App + Database

```bash
# 1. 建立專用 network
docker network create app-network

# 2. 啟動 MySQL
docker run -d \
  --name mysql-db \
  --network app-network \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0

# 3. 等 MySQL 啟動完成（約 30 秒），然後驗證連線
docker run --rm \
  --network app-network \
  mysql:8.0 \
  mysql -hmysql-db -uroot -prootpass -e "SHOW DATABASES;"

# 連線時使用 container name "mysql-db" 作為 hostname ✅
```

在你的應用程式中，資料庫連線設定：
```
DB_HOST=mysql-db      ← 直接用 Container 名稱
DB_PORT=3306
DB_NAME=myapp
```

---

## Host Network

Container 直接使用 Host 的網路介面，沒有網路隔離。

```bash
# Linux 上才完整支援（Windows/Mac 的 Docker Desktop 行為不同）
docker run -d --network host nginx

# Container 直接佔用 Host 的 port 80
# 不需要 -p flag
```

> **注意**：在 Docker Desktop（Windows/Mac）上，`host` network 的行為和 Linux 不同，效果可能不如預期。

---

## 容器間通訊模式

### 同一 Network 內

```
Container A ──(container name)──► Container B
              mysql-db:3306
```

直接使用 Container 名稱作為 hostname。

### 不同 Network

```
Container A (network-1)  ✖  Container B (network-2)
           無法直接通訊
```

解法：把 Container 加入同一個 Network，或使用 Host 的 port mapping。

### 連接外部服務

```bash
# Container 預設可以存取外部網路
docker run --rm alpine ping -c 2 google.com
# ✅ 可以正常連線

# 從 Container 連到 Host 上的服務
# Docker Desktop 提供 host.docker.internal
docker run --rm alpine ping -c 2 host.docker.internal
```

---

## 練習題

### 練習 1：基礎 Network 操作
1. 建立一個名為 `test-net` 的 network
2. 啟動兩個 alpine Container 加入 `test-net`
3. 驗證兩個 Container 可以用名稱互 ping
4. 清理所有資源

### 練習 2：App + Redis
1. 建立一個 network
2. 啟動一個 Redis container
3. 啟動另一個 container，用 `redis-cli` 連接到 Redis
4. 在 Redis 中設定一個 key-value，然後讀取它

<details>
<summary>參考解答</summary>

```bash
# 練習 1
docker network create test-net
docker run -d --name box1 --network test-net alpine sleep 3600
docker run -d --name box2 --network test-net alpine sleep 3600
docker exec box1 ping -c 2 box2
docker rm -f box1 box2
docker network rm test-net

# 練習 2
docker network create redis-net
docker run -d --name my-redis --network redis-net redis:alpine
docker run -it --rm --network redis-net redis:alpine redis-cli -h my-redis
# 在 redis-cli 中：
# SET greeting "Hello Docker Network!"
# GET greeting
# exit

docker rm -f my-redis
docker network rm redis-net
```

</details>

---

## 面試常見問題

**Q：Docker 預設的 network driver 是什麼？**
> Bridge。每個新建的 Container 如果不指定 network，都會加入預設的 bridge network。

**Q：自訂 bridge network 和預設 bridge 的差異？**
> 自訂 bridge 支援 DNS 解析（用 Container 名稱互連）、更好的隔離性、可以動態連接/斷開 Container。預設 bridge 都不支援這些功能。

**Q：Container 之間如何用名稱互相找到對方？**
> 在同一個自訂 bridge network 中，Docker 內建的 DNS server 會自動將 Container 名稱解析為對應的 IP 位址。
