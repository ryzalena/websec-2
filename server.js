const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/rasp', async (req, res) => {
  try {
    const apiPath = req.originalUrl.replace('/api/rasp', '');
    const separator = apiPath.includes('?') ? '&' : '?';
    const API_KEY = '5ec8e859-5593-4cf0-b9a9-0eecac0647bb';
    const targetUrl = `https://api.rasp.yandex-net.ru/v3.0${apiPath}${separator}apikey=${API_KEY}`;
    
    console.log('Прокси запрос к:', targetUrl.replace(API_KEY, '***HIDDEN***'));
    
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      console.error('Ошибка парсинга JSON. Получено:', text.substring(0, 500));
      res.status(500).json({ 
        error: 'API вернул невалидный JSON',
        details: text.substring(0, 200)
      });
    }
    
  } catch (error) {
    console.error('Ошибка прокси:', error.message);
    res.status(500).json({ 
      error: 'Ошибка при выполнении запроса к API Яндекс.Расписаний',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Прокси сервер запущен на http://localhost:${port}`);
  console.log(`Проксирует запросы к api.rasp.yandex-net.ru`);
});