// main.js - Лаунчер для MSX Player с поддержкой старых браузеров

// Полифилы для старых браузеров (Promise, JSON, Array.prototype.map)
if (!window.JSON) {
    window.JSON = {
        parse: function(s) { return eval('(' + s + ')'); },
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

if (!Array.prototype.map) {
    Array.prototype.map = function(callback) {
        var result = [];
        for (var i = 0; i < this.length; i++) {
            result.push(callback(this[i], i, this));
        }
        return result;
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
    MSX_API: 'http://msx.benzac.de/',
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
function sendToMSX(json, isInit) {
    if (!window.parent) {
        log('Ошибка: window.parent недоступен');
        return;
    }
    try {
        var message = {
            type: 'interaction',
            sender: 'plugin',
            target: 'app',
            data: { json: JSON.stringify(json) }
        };
        window.parent.postMessage(message, '*');
        log('JSON отправлен в MSX: ' + JSON.stringify(message));
    } catch (e) {
        log('Ошибка postMessage: ' + e.message);
    }
}

// Обработка сообщений от MSX
function handleMSXMessage(event) {
    log('Получено сообщение от MSX: ' + JSON.stringify(event.data));
    if (event.data && event.data.type === 'interaction' && event.data.init === 1) {
        log('Обработка init:1 сообщения');
        var json = generateLauncherJSON();
        sendToMSX(json, true);
    } else if (event.data && event.data.type === 'interaction' && event.data.data) {
        log('Получены данные: ' + JSON.stringify(event.data.data));
        // Здесь можно обработать другие события от MSX, если нужно
    } else {
        log('Неизвестное сообщение от MSX');
    }
}

// Инициализация лаунчера
function initLauncher() {
    log('Инициализация лаунчера...');
    // Отправляем начальное сообщение interaction:init
    if (window.parent) {
        try {
            window.parent.postMessage({
                type: 'interaction',
                sender: 'plugin',
                target: 'app',
                data: { event: 'interaction:init' }
            }, '*');
            log('Отправлено interaction:init');
        } catch (e) {
            log('Ошибка отправки interaction:init: ' + e.message);
        }
    }
    // Ждём сообщения от MSX
}

// Запуск
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        log('DOMContentLoaded сработал');
        initLauncher();
    });
    window.addEventListener('message', handleMSXMessage, false);
} else {
    window.onload = function() {
        log('window.onload сработал');
        initLauncher();
    };
    window.onmessage = handleMSXMessage;
}
