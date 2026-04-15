const express = require("express");
const Redis = require("ioredis");

const app = express();
const PORT = 3000;
// 建議透過環境變數取得，增加靈活性
const REDIS_HOST = process.env.REDIS_HOST || "demo7-redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  // 移除 lazyConnect，讓它啟動就自動連線
  retryStrategy: (times) => {
    // 限制重試次數，最多重試 5 次，每次間隔 1 秒
    if (times > 5) return null; 
    return 1000;
  },
});

redis.on("error", (err) => {
  // 這裡只印 log，不讓程式崩潰
  console.error(`[Redis] 事件錯誤: ${err.message}`);
});

redis.on("connect", () => {
  console.log("成功連接到 Redis 伺服器");
});

app.get("/", async (req, res) => {
  try {
    // 直接執行指令，ioredis 會處理連線狀態
    const count = await redis.incr("visits");
    res.send(`
      <h2>Hello from Node.js!</h2>
      <p>Redis 主機：<b>${REDIS_HOST}</b></p>
      <p>你是第 <b>${count}</b> 位訪客</p>
    `);
  } catch (err) {
    console.error(`[Web] API 錯誤: ${err.message}`);
    res.status(500).send(`
      <h2>連線失敗</h2>
      <p>無法連線到 Redis（主機：<b>${REDIS_HOST}</b>）</p>
      <p>錯誤：${err.message}</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Web server 啟動，port: ${PORT}`);
  console.log(`預計連線 Redis: ${REDIS_HOST}:${REDIS_PORT}`);
});