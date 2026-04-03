const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

// Загрузка .env файла вручную
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Получаем ключ из .env
const API_KEY = process.env.REACT_APP_API_KEY;

if (!API_KEY) {
  console.error('ОШИБКА: API_KEY не найден в файле .env');
  console.error('Создайте файл .env с содержимым: REACT_APP_API_KEY=ваш_ключ');
  process.exit(1);
}

console.log('API_KEY загружен:', API_KEY.substring(0, 8) + '...');

app.use('/api/rasp', async (req, res) => {
  try {
    const apiPath = req.originalUrl.replace('/api/rasp', '');
    
    // Добавляем apikey к запросу
    const separator = apiPath.includes('?') ? '&' : '?';
    const targetUrl = `https://api.rasp.yandex-net.ru/v3.0${apiPath}${separator}apikey=${API_KEY}`;
    
    console.log('Прокси запрос к:', targetUrl.replace(API_KEY, '***HIDDEN***'));
    
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Получен не-JSON ответ:', text.substring(0, 200));
      throw new Error('API вернул не JSON');
    }
    
    const data = await response.json();
    res.json(data);
    
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