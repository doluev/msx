// main.js - Лаунчер для MSX Player с поддержкой старых браузеров

// Полифилы для старых браузеров
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

// Проверка строк (аналог isFullStr)
function isFullStr(str) {
    return typeof str === 'string' && str.length > 0;
}

// Конфигурация с заглушками
var CONFIG = {
    MSX_API: 'http://msx.benzac.de/'
};

// Минимальное меню для теста
var placeholderMenu = [
    {
        type: 'item',
        label: 'Тестовый элемент',
        action: 'execute:plugin:back'
    },
    {
        type: 'separate',
        headline: 'Фильмы (заглушка)',
        items: [
            { type: 'item', label: 'Фильм 1', action: 'execute:plugin:back' },
            { type: 'item', label: 'Фильм 2', action: 'execute:plugin:back' },
            { type: 'item', label: 'Фильм 3', action: 'execute:plugin:back' }
        ]
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
        // Задержка 100 мс для стабильности
        setTimeout(function() {
            window.parent.postMessage(message, '*');
            log('JSON отправлен в MSX для ' + eventType + ': ' + JSON.stringify(message));
        }, 100);
    } catch (e) {
        log('Ошибка postMessage: ' + e.message);
    }
}

// Ответ на запросы с requestId
function respondToRequest(requestId, data) {
    if (!isFullStr(requestId)) {
        log('Ошибка: requestId пустой');
        return;
    }
    try {
        var message = {
            type: 'interactionPlugin',
            sender: 'plugin',
            target: 'app',
            data: {
                requestId: requestId,
                response: data
            }
        };
        window.parent.postMessage(message, '*');
        log('Ответ на requestId: ' + requestId + ', данные: ' + JSON.stringify(data));
    } catch (e) {
        log('Ошибка отправки ответа на requestId: ' + e.message);
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
                var json = generateLauncherJSON();
                sendToMSX(json, event.data.data.event);
            }
        } else if (event.data.data && (isFullStr(event.data.data.requestId) || isFullStr(event.data.data.dataId))) {
            log('Обработка requestId/dataId: ' + JSON.stringify(event.data.data));
            // Отвечаем на запрос, чтобы избежать таймаута
            if (isFullStr(event.data.data.requestId)) {
                respondToRequest(event.data.data.requestId, { status: 'ok' });
            }
        } else {
            log('Неизвестное сообщение от MSX');
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
