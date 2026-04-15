const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <h1>Hello Docker! 這是我的第一個容器網頁</h1>
  `);
});

app.listen(3000, () => {
  console.log('伺服器正在 port 3000 執行中...');
});