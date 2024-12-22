const WebSocket = require('ws');

// 建立 WebSocket 伺服器
const server = new WebSocket.Server({ port: 8080 });

let countdownInterval;
let countdownTime = 90 * 60 * 1000; // 預設 90 分鐘
let startTime = null;

server.on('connection', (socket) => {
    console.log('Client connected');

    // 收到管理者的指令
    socket.on('message', (message) => {
        const command = message.toString();

        if (command === 'START') {
            startTime = Date.now();
            clearInterval(countdownInterval);
            broadcast('START_COUNTDOWN');
            startCountdown();
        } else if (command === 'PAUSE') {
            clearInterval(countdownInterval);
            countdownTime -= Date.now() - startTime;
            broadcast('PAUSE_COUNTDOWN');
        } else if (command === 'RESET') {
            clearInterval(countdownInterval);
            countdownTime = 90 * 60 * 1000; // 重設為 90 分鐘
            broadcast('RESET_COUNTDOWN');
        }
    });

    // 當客戶端斷開連接
    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

// 廣播給所有客戶端
function broadcast(data) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// 倒數計時邏輯
function startCountdown() {
    countdownInterval = setInterval(() => {
        const timeLeft = countdownTime - (Date.now() - startTime);
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            broadcast('TIME_UP');
        } else {
            const timeData = {
                type: 'UPDATE_TIMER',
                timeLeft,
            };
            broadcast(JSON.stringify(timeData));
        }
    }, 1000);
}

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
});

socket.addEventListener('message', (event) => {
    const data = event.data;

    if (data === 'START_COUNTDOWN') {
        startCountdownTimer();
    } else if (data === 'PAUSE_COUNTDOWN') {
        pauseCountdownTimer();
    } else if (data === 'RESET_COUNTDOWN') {
        resetCountdownTimer();
    } else {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'UPDATE_TIMER') {
                updateTimerDisplay(parsedData.timeLeft);
            }
        } catch (e) {
            console.error('Invalid message format:', data);
        }
    }
});

function sendCommand(command) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(command);
    } else {
        console.error('WebSocket is not open');
    }
}

let countdownInterval;

function startCountdownTimer() {
    console.log('Countdown started');
}

function pauseCountdownTimer() {
    console.log('Countdown paused');
    clearInterval(countdownInterval);
}

function resetCountdownTimer() {
    console.log('Countdown reset');
    document.getElementById('timer').innerHTML = 'Waiting to start...';
}

function updateTimerDisplay(timeLeft) {
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    document.getElementById('timer').innerHTML = `${hours}:${minutes}:${seconds}`;
}

