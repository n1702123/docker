const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));

// tmpfs 掛載於 /tmp/data（存放於記憶體，容器停止即消失）
const DATA_DIR = '/tmp/data';
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readMessages() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveMessages(messages) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

app.get('/', (req, res) => {
  const messages = readMessages();

  const rows = messages.length > 0
    ? messages.map(m => `<tr><td>${m.text}</td><td>${m.time}</td></tr>`).join('')
    : '<tr><td colspan="2">尚無留言（或容器剛重啟，資料已清除）</td></tr>';

  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <title>tmpfs 範例</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        .warning {
          background: #fff3cd; border: 1px solid #ffc107;
          border-radius: 6px; padding: 12px 16px; margin: 16px 0;
          color: #856404; font-size: 14px;
        }
        .badge {
          display: inline-block; background: #e74c3c; color: #fff;
          border-radius: 4px; padding: 2px 8px; font-size: 12px;
          font-weight: bold; margin-left: 8px; vertical-align: middle;
        }
        form { margin: 20px 0; display: flex; gap: 8px; }
        input[type=text] { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 8px 16px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #e74c3c; color: #fff; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        .hint { color: #888; font-size: 13px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <h1>Docker tmpfs 範例 <span class="badge">RAM</span></h1>

      <div class="warning">
        ⚠️ 此頁面的留言儲存於 <strong>記憶體（tmpfs）</strong>，<br>
        容器停止或重啟後，所有資料將<strong>永久消失</strong>！
      </div>

      <form method="POST" action="/add">
        <input type="text" name="text" placeholder="輸入留言（重啟後會消失）..." required>
        <button type="submit">新增</button>
      </form>

      <table>
        <thead><tr><th>留言</th><th>時間</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <p class="hint">
        資料路徑：${DATA_FILE}（存於 RAM，共 ${messages.length} 筆）<br>
        驗證方式：新增留言 → <code>docker compose restart</code> → 資料消失
      </p>
    </body>
    </html>
  `);
});

app.post('/add', (req, res) => {
  const messages = readMessages();
  messages.push({
    text: req.body.text,
    time: new Date().toLocaleString('zh-TW')
  });
  saveMessages(messages);
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('伺服器正在 port 3000 執行中...');
});
