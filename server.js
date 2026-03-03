const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/rasp', async (req, res) => {
  try {
    // Берем полный путь запроса
    const apiPath = req.originalUrl.replace('/api/rasp', '');
    
    // ПРАВИЛЬНЫЙ домен Яндекс.Расписаний
    const targetUrl = `https://api.rasp.yandex-net.ru/v3.0${apiPath}`;
    
    console.log('🔄 Прокси запрос к:', targetUrl);
    
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    // Проверяем, что ответ - JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Получен не-JSON ответ:', text.substring(0, 200));
      throw new Error('API вернул не JSON');
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Ошибка прокси:', error.message);
    res.status(500).json({ 
      error: 'Ошибка при выполнении запроса к API Яндекс.Расписаний',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Прокси сервер запущен на http://localhost:${port}`);
  console.log(`📡 Проксирует запросы к api.rasp.yandex-net.ru`);
});