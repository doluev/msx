// main.js - Лаунчер для MSX Player с поддержкой старых браузеров

// Полифилы для старых браузеров (Promise, Fetch, JSON)
if (!window.JSON) {
    window.JSON = {
        parse: function(s) { eval('(' + s + ')'); },
        stringify: function(v) { return String(v); }
    };
}

if (!window.Promise) {
    window.Promise = (function() {
        function Promise(resolver) {
            var callbacks = [];
            this.then = function(onFulfilled) {
                callbacks.push(onFulfilled);
                return this;
            };
            resolver(function(value) {
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](value);
                }
            });
        }
        return Promise;
    })();
}

if (!window.fetch) {
    window.fetch = function(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({
                            json: function() { return JSON.parse(xhr.responseText); },
                            status: xhr.status
                        });
                    } else {
                        reject(new Error('Fetch error: ' + xhr.status));
                    }
                }
            };
            xhr.onerror = function() { reject(new Error('Network error')); };
            xhr.send();
        });
    };
}

// Логирование
function log(message) {
    if (console && console.log) {
        console.log('[MSX Launcher] ' + message);
    }
    if (window.showLog) {
        window.showLog('[MSX Launcher] ' + message);
    }
}

// Конфигурация с заглушками
var CONFIG = {
    MSX_API: 'http://msx.benzac.de/', // Для интеграции с MSX
    CONTENT: '' // Заглушка для контента
};

// Заглушка для данных меню
var placeholderMenu = [
    {
        type: 'separate',
        headline: 'Фильмы (заглушка)',
        items: [
            { type: 'item', label: 'Фильм 1', icon: 'placeholder1.jpg', action: 'video:play:placeholder1.mp4' },
            { type: 'item', label: 'Фильм 2', icon: 'placeholder2.jpg', action: 'video:play:placeholder2.mp4' },
            { type: 'item', label: 'Фильм 3', icon: 'placeholder3.jpg', action: 'video:play:placeholder3.mp4' }
        ]
    },
    {
        type: 'separate',
        headline: 'IPTV (заглушка)',
        action: 'content:request:m3u:placeholder.m3u'
    },
    {
        type: 'item',
        label: 'Выход',
        action: 'back'
    }
];

// Функция для генерации JSON-меню
function generateLauncherJSON() {
    log('Генерация JSON для MSX...');
    var json = {
        type: 'menu',
        headline: 'Мой Лаунчер',
        items: placeholderMenu
    };
    return json;
}

// Отправка JSON в MSX через postMessage
function sendToMSX(json) {
    if (!window.parent) {
        log('Ошибка: window.parent недоступен');
        return;
    }
    try {
        window.parent.postMessage({
            type: 'interaction',
            data: { json: JSON.stringify(json) }
        }, '*');
        log('JSON отправлен в MSX');
    } catch (e) {
        log('Ошибка postMessage: ' + e.message);
    }
}

// Инициализация лаунчера
function initLauncher() {
    log('Инициализация лаунчера...');
    var json = generateLauncherJSON();
    sendToMSX(json);
}

// Запуск
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        log('DOMContentLoaded сработал');
        initLauncher();
    });
} else {
    window.onload = function() {
        log('window.onload сработал');
        initLauncher();
    };
}

// Обработка сообщений от MSX (для отладки)
if (window.addEventListener) {
    window.addEventListener('message', function(event) {
        log('Получено сообщение от MSX: ' + JSON.stringify(event.data));
    }, false);
}
