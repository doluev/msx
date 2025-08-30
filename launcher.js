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

// Проверка строк (аналог isFullStr из исходного main.js)
function isFullStr(str) {
    return typeof str === 'string' && str.length > 0;
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
        action: 'execute:plugin:back'
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
function sendToMSX(json, eventType) {
    if (!window.parent) {
        log('Ошибка: window.parent недоступен');
        return;
    }
    try {
        var message = {
            type: 'interactionPlugin',
            sender: 'plugin',
            target: 'app',
            data: { json: JSON.stringify(json) }
        };
        window.parent.postMessage(message, '*');
        log('JSON отправлен в MSX для ' + eventType + ': ' + JSON.stringify(message));
    } catch (e) {
        log('Ошибка postMessage: ' + e.message);
    }
}

// Обработка сообщений от MSX
function handleMSXMessage(event) {
    log('Получено сообщение от MSX: ' + JSON.stringify(event.data));
    if (event.data && event.data.type === 'interactionPlugin') {
        if (event.data.init === 1) {
            log('Обработка init:1 сообщения');
            var json = generateLauncherJSON();
            sendToMSX(json, 'init:1');
        } else if (event.data.data && isFullStr(event.data.data.event)) {
            log('Обработка события: ' + event.data.data.event);
            if (event.data.data.event === 'app:resize') {
                log('Обработка app:resize');
                var json = generateLauncherJSON();
                sendToMSX(json, 'app:resize');
            } else {
                log('Неизвестное событие: ' + event.data.data.event);
            }
        } else if (event.data.data && (isFullStr(event.data.data.requestId) || isFullStr(event.data.data.dataId))) {
            log('Обработка данных requestId/dataId: ' + JSON.stringify(event.data.data));
            // Можно добавить обработку, если нужно
        } else {
            log('Неизвестное сообщение от MSX');
            // На всякий случай отправляем меню
            var json = generateLauncherJSON();
            sendToMSX(json, 'unknown');
        }
    } else {
        log('Игнорируем сообщение с типом: ' + (event.data ? event.data.type : 'undefined'));
    }
}

// Инициализация лаунчера
function initLauncher() {
    log('Инициализация лаунчера...');
    // Отправляем начальное сообщение interaction:init
    if (window.parent) {
        try {
            window.parent.postMessage({
                type: 'interactionPlugin',
                sender: 'plugin',
                target: 'app',
                data: { event: 'interaction:init' }
            }, '*');
            log('Отправлено interaction:init');
        } catch (e) {
            log('Ошибка отправки interaction:init: ' + e.message);
        }
    }
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
