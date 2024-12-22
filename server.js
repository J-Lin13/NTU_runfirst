const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('WebSocket server started on ws://localhost:8080');
});

let countdownTime = 90 * 60 * 1000; // 倒數90分鐘
let countdownInterval = null;

wss.on('connection', (ws) => {
    console.log('New client connected');

    // 當收到訊息時處理指令
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        if (message === 'START') {
            startCountdown(ws);
        } else if (message === 'PAUSE') {
            pauseCountdown();
        } else if (message === 'RESET') {
            resetCountdown(ws);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// 啟動倒數
function startCountdown(ws) {
    clearInterval(countdownInterval);
    const startTime = Date.now();
    countdownInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const timeLeft = countdownTime - elapsedTime;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            broadcast({ type: 'TIME_UP' });
        } else {
            broadcast({
                type: 'UPDATE_TIMER',
                timeLeft,
            });
        }
    }, 1000);

    broadcast({ type: 'START_COUNTDOWN' });
}

// 暫停倒數
function pauseCountdown() {
    clearInterval(countdownInterval);
    broadcast({ type: 'PAUSE_COUNTDOWN' });
}

// 重設倒數
function resetCountdown(ws) {
    clearInterval(countdownInterval);
    countdownTime = 90 * 60 * 1000; // 重設為90分鐘
    broadcast({ type: 'RESET_COUNTDOWN' });
}

// 廣播訊息給所有客戶端
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
