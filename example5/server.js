const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = '/app/data';
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

// 確保資料目錄存在
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
    : '<tr><td colspan="2">尚無留言</td></tr>';

  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <title>Volume 範例</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        form { margin: 20px 0; display: flex; gap: 8px; }
        input[type=text] { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 8px 16px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #3498db; color: #fff; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        .hint { color: #888; font-size: 13px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <h1>Docker Volume 範例</h1>
      <p>留言儲存於容器內 <code>/app/data/messages.json</code>，掛載 volume 後重啟容器資料依然存在。</p>

      <form method="POST" action="/add">
        <input type="text" name="text" placeholder="輸入留言..." required>
        <button type="submit">新增</button>
      </form>

      <table>
        <thead><tr><th>留言</th><th>時間</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <p class="hint">資料檔案路徑：${DATA_FILE}（共 ${messages.length} 筆）</p>
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
