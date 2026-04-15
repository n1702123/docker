const express = require('express');
const app = express();

app.get('/', (req, res) => {
  const appEnv = process.env.APP_ENV || '未設定';
  const appMessage = process.env.APP_MESSAGE || '未設定';

  res.send(`
    <h1>Hello Docker! 這是我的第一個容器網頁</h1>
    <hr>
    <h2>環境變數</h2>
    <table style="border-collapse: collapse; border: 1px solid black; padding: 8px;">
      <tr><th>變數名稱</th><th>值</th></tr>
      <tr><td>APP_ENV</td><td>${appEnv}</td></tr>
      <tr><td>APP_MESSAGE</td><td>${appMessage}</td></tr>
    </table>
  `);
});

app.listen(3000, () => {
  console.log('伺服器正在 port 3000 執行中...');
});