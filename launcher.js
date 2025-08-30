// launcher.js - Лаунчер для MSX Player с поддержкой старых браузеров

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

// Конфигурация
var CONFIG = {
  TMDB_API: 'https://api.themoviedb.org/3/movie/popular?api_key=YOUR_TMDB_KEY', // Ваш ключ TMDB
  IMAGE_PROXY: 'https://image.tmdb.org/t/p/w300',
  IPTV_PLAYLIST: 'http://example.com/playlist.m3u', // Ваш M3U-плейлист
  MSX_API: 'http://msx.benzac.de/' // Базовый URL MSX
};

// Логирование (для отладки на ТВ)
function log(message) {
  if (console) console.log('[MSX Launcher] ' + message);
}

// Функция для генерации JSON-меню лаунчера
function generateLauncherJSON(movies) {
  var json = {
    "type": "menu",
    "headline": "Мой Лаунчер",
    "items": [
      {
        "type": "separate",
        "headline": "Популярные фильмы",
        "items": movies.map(function(movie) {
          return {
            "type": "item",
            "label": movie.title,
            "icon": CONFIG.IMAGE_PROXY + movie.poster_path,
            "action": "video:play:" + movie.video_url // Замените на реальный URL видео
          };
        })
      },
      {
        "type": "separate",
        "headline": "IPTV",
        "action": "content:request:m3u:" + CONFIG.IPTV_PLAYLIST // Запуск M3U в MSX
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

// Загрузка данных и инициализация
function initLauncher() {
  log('Инициализация лаунчера...');
  fetch(CONFIG.TMDB_API)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      var movies = data.results.slice(0, 5); // Топ-5 фильмов
      var launcherJSON = generateLauncherJSON(movies);
      // Отправка JSON в MSX через postMessage (interaction plugin)
      if (window.parent) {
        window.parent.postMessage({
          type: 'interaction',
          data: { json: JSON.stringify(launcherJSON) }
        }, '*');
      }
      log('Лаунчер загружен');
    })
    .catch(function(err) {
      log('Ошибка: ' + err.message);
    });
}

// Запуск при загрузке
if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', initLauncher);
} else {
  window.onload = initLauncher;
}
