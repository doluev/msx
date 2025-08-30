// main.js - Лаунчер для MSX Player с поддержкой старых браузеров и заглушками

// Полифилы для старых браузеров (Promise, Fetch)
if (!window.Promise) {
  window.Promise = (function() {
    function Promise(resolver) {
      this.then = function(onFulfilled) {
        resolver(onFulfilled);
        return this;
      };
    }
    return Promise;
  })();
}

if (!window.fetch) {
  window.fetch = function(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ json: function() { return JSON.parse(xhr.responseText); } });
        } else {
          reject(new Error('Fetch error'));
        }
      };
      xhr.onerror = reject;
      xhr.send();
    });
  };
}

// Конфигурация с заглушками
var CONFIG = {
  TMDB_API: '', // Заглушка: не использовать реальный API
  IMAGE_PROXY: '', // Заглушка для изображений
  IPTV_PLAYLIST: '', // Заглушка для плейлиста
  MSX_API: 'http://msx.benzac.de/' // Базовый URL MSX (оставляем, так как это для интеграции)
};

// Логирование (для отладки на ТВ)
function log(message) {
  if (console) console.log('[MSX Launcher] ' + message);
}

// Заглушка для данных фильмов (статические данные вместо API)
var placeholderMovies = [
  { title: 'Фильм 1', poster_path: '/placeholder1.jpg', video_url: 'placeholder-video1.mp4' },
  { title: 'Фильм 2', poster_path: '/placeholder2.jpg', video_url: 'placeholder-video2.mp4' },
  { title: 'Фильм 3', poster_path: '/placeholder3.jpg', video_url: 'placeholder-video3.mp4' },
  { title: 'Фильм 4', poster_path: '/placeholder4.jpg', video_url: 'placeholder-video4.mp4' },
  { title: 'Фильм 5', poster_path: '/placeholder5.jpg', video_url: 'placeholder-video5.mp4' }
];

// Функция для генерации JSON-меню лаунчера с заглушками
function generateLauncherJSON(movies) {
  var json = {
    "type": "menu",
    "headline": "Мой Лаунчер",
    "items": [
      {
        "type": "separate",
        "headline": "Популярные фильмы (заглушки)",
        "items": movies.map(function(movie) {
          return {
            "type": "item",
            "label": movie.title,
            "icon": CONFIG.IMAGE_PROXY + movie.poster_path, // Заглушка для иконки
            "action": "video:play:" + movie.video_url // Заглушка для видео
          };
        })
      },
      {
        "type": "separate",
        "headline": "IPTV (заглушка)",
        "action": "content:request:m3u:" + CONFIG.IPTV_PLAYLIST // Заглушка для M3U
      },
      {
        "type": "item",
        "label": "Выход",
        "action": "back"
      }
    ]
  };
  return json;
}

// Инициализация с заглушками (без реальных запросов)
function initLauncher() {
  log('Инициализация лаунчера с заглушками...');
  // Используем статические заглушки вместо fetch
  var movies = placeholderMovies;
  var launcherJSON = generateLauncherJSON(movies);
  // Отправка JSON в MSX через postMessage (interaction plugin)
  if (window.parent) {
    window.parent.postMessage({
      type: 'interaction',
      data: { json: JSON.stringify(launcherJSON) }
    }, '*');
  }
  log('Лаунчер с заглушками загружен');
}

// Запуск при загрузке
if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', initLauncher);
} else {
  window.onload = initLauncher;
}
