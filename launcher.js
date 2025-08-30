// main.js - Лаунчер для MSX Player (только пункт "Поиск")

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

function isFullStr(str) {
    return typeof str === 'string' && str.length > 0;
}

// Конфигурация
var CONFIG = {
    DICTIONARY: 'https://wals09.github.io/msx/dictionary.json',
    LOGO: 'https://doluev.github.io/msx/logo_color.png'
};

// Генерация JSON (только пункт "Поиск")
function generateLauncherJSON() {
    log('Генерация JSON для MSX...');
    return {
        extension: '{col:msx-white}{ico:msx-white:search} {txt:Поиск}',
        dictionary: CONFIG.DICTIONARY,
        logo: CONFIG.LOGO,
        headline: 'MSX Поиск',
        menu: [
            {
                icon: 'search',
                label: 'Поиск',
                data: {
                    type: 'search',
                    headline: 'Поиск фильмов и сериалов',
                    url: 'https://kinovod.tv/search?query={query}',
                    mode: 'open'
                }
            }
        ]
    };
}

// Ответные данные
function getResponseData(requestId) {
    if (requestId.includes('menu')) {
        return generateLauncherJSON();
    }
    return { status: 'ok' };
}

// Отправка JSON в MSX
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
            data: { menu: json }
        };
        setTimeout(function() {
            window.parent.postMessage(message, '*');
            log('JSON отправлен в MSX для ' + eventType + ': ' + JSON.stringify(message));
        }, 100);
    } catch (e) {
        log('Ошибка postMessage: ' + e.message);
    }
}

// Ответ на requestId
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

// Обработка сообщений
function handleMSXMessage(event) {
    log('Получено сообщение: ' + JSON.stringify(event.data));
    if (event.data && event.data.type === 'interactionPlugin') {
        if (event.data.init === 1) {
            var json = generateLauncherJSON();
            sendToMSX(json, 'init:1');
        } else if (event.data.data && isFullStr(event.data.data.event)) {
            var json = generateLauncherJSON();
            sendToMSX(json, event.data.data.event);
        } else if (event.data.data && isFullStr(event.data.data.requestId)) {
            var responseData = getResponseData(event.data.data.requestId);
            respondToRequest(event.data.data.requestId, responseData);
        }
    }
}

// Инициализация
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
            log('Ошибка interaction:init: ' + e.message);
        }
    }
}

// Запуск
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        initLauncher();
    });
    window.addEventListener('message', handleMSXMessage, false);
} else {
    window.onload = initLauncher;
    window.onmessage = handleMSXMessage;
}
