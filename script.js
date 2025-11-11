// 游戏配置
const config = {
    gridSize: 20,
    canvasWidth: 400,
    canvasHeight: 400,
    initialSpeed: 150, // 增加初始延迟使游戏变慢一些
    speedIncrement: 3, // 减小速度递增幅度
    maxSpeed: 70,      // 提高最低延迟，保证游戏可控性
    moveThreshold: 0   // 添加移动阈值，使方向变更更及时
};

// 游戏状态
const gameState = {
    snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ],
    food: { x: 15, y: 10 },
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    highScore: 0,
    isRunning: false,
    isPaused: false,
    gameLoop: null,
    speed: config.initialSpeed,
    lastUpdateTime: 0, // 上次更新时间
    pendingDirection: null // 待处理的方向变更
};

// DOM 元素
const elements = {
    canvas: document.getElementById('gameCanvas'),
    ctx: null,
    scoreDisplay: document.getElementById('score'),
    highScoreDisplay: document.getElementById('high-score'),
    startButton: document.getElementById('start-btn'),
    pauseButton: document.getElementById('pause-btn'),
    resetButton: document.getElementById('reset-btn'),
    speedSlider: document.getElementById('speed-slider'),
    speedDisplay: document.getElementById('speed-value'),
    mobileControls: {
        up: document.getElementById('up-btn'),
        down: document.getElementById('down-btn'),
        left: document.getElementById('left-btn'),
        right: document.getElementById('right-btn')
    }
};

// 初始化游戏
function initGame() {
    // 获取画布上下文
    elements.ctx = elements.canvas.getContext('2d');
    
    // 设置画布大小
    elements.canvas.width = config.canvasWidth;
    elements.canvas.height = config.canvasHeight;
    
    // 加载最高分
    loadHighScore();
    
    // 初始化速度设置
    initializeSpeedControl();
    

    
    // 注册事件监听器
    registerEventListeners();
    
    // 初始渲染
    render();
    

}

// 初始化速度控制
function initializeSpeedControl() {
    // 设置初始速度值
    elements.speedSlider.value = gameState.speed;
    updateSpeedDisplay(gameState.speed);
    
    // 添加速度变化事件监听
    elements.speedSlider.addEventListener('input', function() {
        const newSpeed = parseInt(this.value);
        gameState.speed = newSpeed;
        updateSpeedDisplay(newSpeed);
    });
}

// 更新速度显示
function updateSpeedDisplay(speed) {
    // 根据速度值显示文本描述
    let speedText;
    if (speed >= 180) {
        speedText = '非常慢';
    } else if (speed >= 150) {
        speedText = '慢';
    } else if (speed >= 120) {
        speedText = '中等慢';
    } else if (speed >= 90) {
        speedText = '中等';
    } else if (speed >= 70) {
        speedText = '中等快';
    } else if (speed >= 50) {
        speedText = '快';
    } else {
        speedText = '非常快';
    }
    elements.speedDisplay.textContent = speedText;
}



// 注册事件监听器
function registerEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 按钮控制
    elements.startButton.addEventListener('click', startGame);
    elements.pauseButton.addEventListener('click', togglePause);
    elements.resetButton.addEventListener('click', resetGame);
    
    // 移动设备触摸控制
    elements.mobileControls.up.addEventListener('click', () => setDirection('up'));
    elements.mobileControls.left.addEventListener('click', () => setDirection('left'));
    elements.mobileControls.right.addEventListener('click', () => setDirection('right'));
    elements.mobileControls.down.addEventListener('click', () => setDirection('down'));
    
    // 速度控制
    elements.speedSlider.addEventListener('input', handleSpeedChange);
    

    
    // 窗口大小改变时重新渲染
    window.addEventListener('resize', render);
}

// 处理速度变化
function handleSpeedChange(event) {
    const newSpeed = parseInt(event.target.value, 10);
    gameState.speed = newSpeed;
    updateSpeedDisplay(newSpeed);
}



// 处理键盘按下事件
function handleKeyPress(event) {
    const key = event.key;
    
    switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            setDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            setDirection('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            setDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            setDirection('right');
            break;
        case ' ': // 空格键暂停/继续
            if (gameState.isRunning) {
                togglePause();
            }
            break;
        case 'Enter': // 回车键开始/重置
            if (!gameState.isRunning) {
                startGame();
            }
            break;
    }
}

// 设置方向
function setDirection(newDirection) {
    // 防止180度转向（不能直接反向移动）
    const oppositeDirections = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    if (newDirection !== oppositeDirections[gameState.direction]) {
        // 立即设置下一个方向
        gameState.nextDirection = newDirection;
        
        // 设置待处理方向，使其在下一次更新时立即生效
        gameState.pendingDirection = newDirection;
    }
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        updateButtonsState();
        startGameLoop();
    }
}

// 暂停/继续游戏
function togglePause() {
    if (gameState.isRunning) {
        gameState.isPaused = !gameState.isPaused;
        updateButtonsState();
        
        if (gameState.isPaused) {
            // 暂停时不取消动画帧，而是通过isPaused标志控制更新
            // 这样可以保持渲染，显示暂停画面

        } else {
            // 恢复游戏时重置时间戳
            gameState.lastUpdateTime = performance.now();

        }
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
    }
    

    
    // 重置游戏状态
    gameState.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.pendingDirection = null;
    gameState.score = 0;
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.speed = config.initialSpeed;
    gameState.lastUpdateTime = 0;
    
    // 生成新食物
    generateFood();
    
    // 更新UI
    updateScore();
    updateButtonsState();
    
    // 重新渲染
    render();
}

// 游戏结束
function gameOver() {
    // 停止游戏循环
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
    }
    gameState.isRunning = false;
    

    
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore();
        updateHighScore();
    }
    
    // 更新按钮状态
    updateButtonsState();
    
    // 显示游戏结束消息
    alert(`游戏结束！\n得分: ${gameState.score}\n最高分: ${gameState.highScore}`);
}

// 开始游戏循环
function startGameLoop() {
    // 清除任何现有的游戏循环
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
    }
    
    // 重置上次更新时间
    gameState.lastUpdateTime = performance.now();
    
    // 使用requestAnimationFrame实现游戏循环
    function gameLoop(timestamp) {
        if (gameState.isRunning && !gameState.isPaused) {
            // 计算经过的时间
            const elapsedTime = timestamp - gameState.lastUpdateTime;
            
            // 当经过的时间大于当前速度阈值时更新游戏状态
            if (elapsedTime > gameState.speed) {
                // 立即应用待处理的方向变更
                if (gameState.pendingDirection) {
                    gameState.direction = gameState.pendingDirection;
                    gameState.nextDirection = gameState.pendingDirection;
                    gameState.pendingDirection = null;
                } else {
                    // 正常更新方向
                    gameState.direction = gameState.nextDirection;
                }
                
                update();
                gameState.lastUpdateTime = timestamp;
            }
        }
        
        // 无论游戏状态如何都进行渲染
        render();
        
        // 继续游戏循环
        if (gameState.isRunning) {
            gameState.gameLoop = requestAnimationFrame(gameLoop);
        }
    }
    
    // 启动游戏循环
    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 获取蛇头位置
    const head = { ...gameState.snake[0] };
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查边界碰撞
    if (head.x < 0 || head.x >= config.canvasWidth / config.gridSize ||
        head.y < 0 || head.y >= config.canvasHeight / config.gridSize) {
        gameOver();
        return;
    }
    
    // 检查自身碰撞
    if (checkSelfCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新的头部添加到蛇身体
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        updateScore();
        
        // 提高速度
        if (gameState.speed > config.maxSpeed) {
            gameState.speed -= config.speedIncrement;
            // 更新速度滑块
            elements.speedSlider.value = gameState.speed;
            updateSpeedDisplay(gameState.speed);
        }
        
        // 生成新食物
        generateFood();
    } else {
        // 如果没吃到食物，移除尾部
        gameState.snake.pop();
    }
}

// 渲染游戏
function render() {
    // 清空画布
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // 绘制网格（可选）
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 如果游戏暂停，显示暂停消息
    if (gameState.isPaused) {
        drawPausedMessage();
    }
}

// 绘制网格
function drawGrid() {
    const gridWidth = config.canvasWidth / config.gridSize;
    const gridHeight = config.canvasHeight / config.gridSize;
    
    elements.ctx.strokeStyle = '#e0e0e0';
    elements.ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= config.canvasWidth; x += gridWidth) {
        elements.ctx.beginPath();
        elements.ctx.moveTo(x, 0);
        elements.ctx.lineTo(x, config.canvasHeight);
        elements.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= config.canvasHeight; y += gridHeight) {
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, y);
        elements.ctx.lineTo(config.canvasWidth, y);
        elements.ctx.stroke();
    }
}

// 绘制蛇
function drawSnake() {
    const gridWidth = config.canvasWidth / config.gridSize;
    const gridHeight = config.canvasHeight / config.gridSize;
    
    // 绘制蛇头
    elements.ctx.fillStyle = '#27ae60';
    const head = gameState.snake[0];
    elements.ctx.fillRect(
        head.x * gridWidth,
        head.y * gridHeight,
        gridWidth - 1,
        gridHeight - 1
    );
    
    // 绘制蛇眼睛
    elements.ctx.fillStyle = 'white';
    const eyeSize = gridWidth * 0.2;
    const eyeOffset = gridWidth * 0.3;
    
    switch (gameState.direction) {
        case 'right':
            elements.ctx.fillRect(
                head.x * gridWidth + gridWidth - eyeOffset,
                head.y * gridHeight + eyeOffset,
                eyeSize,
                eyeSize
            );
            elements.ctx.fillRect(
                head.x * gridWidth + gridWidth - eyeOffset,
                head.y * gridHeight + gridHeight - eyeOffset - eyeSize,
                eyeSize,
                eyeSize
            );
            break;
        case 'left':
            elements.ctx.fillRect(
                head.x * gridWidth + eyeOffset,
                head.y * gridHeight + eyeOffset,
                eyeSize,
                eyeSize
            );
            elements.ctx.fillRect(
                head.x * gridWidth + eyeOffset,
                head.y * gridHeight + gridHeight - eyeOffset - eyeSize,
                eyeSize,
                eyeSize
            );
            break;
        case 'up':
            elements.ctx.fillRect(
                head.x * gridWidth + eyeOffset,
                head.y * gridHeight + eyeOffset,
                eyeSize,
                eyeSize
            );
            elements.ctx.fillRect(
                head.x * gridWidth + gridWidth - eyeOffset - eyeSize,
                head.y * gridHeight + eyeOffset,
                eyeSize,
                eyeSize
            );
            break;
        case 'down':
            elements.ctx.fillRect(
                head.x * gridWidth + eyeOffset,
                head.y * gridHeight + gridHeight - eyeOffset - eyeSize,
                eyeSize,
                eyeSize
            );
            elements.ctx.fillRect(
                head.x * gridWidth + gridWidth - eyeOffset - eyeSize,
                head.y * gridHeight + gridHeight - eyeOffset - eyeSize,
                eyeSize,
                eyeSize
            );
            break;
    }
    
    // 绘制蛇身
    for (let i = 1; i < gameState.snake.length; i++) {
        const segment = gameState.snake[i];
        // 根据位置设置不同的颜色，形成渐变效果
        const colorIntensity = 1 - (i / gameState.snake.length) * 0.3;
        elements.ctx.fillStyle = `rgba(39, 174, 96, ${colorIntensity})`;
        elements.ctx.fillRect(
            segment.x * gridWidth,
            segment.y * gridHeight,
            gridWidth - 1,
            gridHeight - 1
        );
    }
}

// 绘制食物
function drawFood() {
    const gridWidth = config.canvasWidth / config.gridSize;
    const gridHeight = config.canvasHeight / config.gridSize;
    
    // 绘制食物（苹果形状）
    const x = gameState.food.x * gridWidth + gridWidth / 2;
    const y = gameState.food.y * gridHeight + gridHeight / 2;
    const radius = gridWidth * 0.4;
    
    // 苹果主体
    elements.ctx.fillStyle = '#e74c3c';
    elements.ctx.beginPath();
    elements.ctx.arc(x, y, radius, 0, Math.PI * 2);
    elements.ctx.fill();
    
    // 苹果叶子
    elements.ctx.fillStyle = '#2ecc71';
    elements.ctx.beginPath();
    elements.ctx.arc(x, y - radius * 0.7, radius * 0.3, 0, Math.PI * 2);
    elements.ctx.fill();
    
    // 苹果柄
    elements.ctx.strokeStyle = '#8b4513';
    elements.ctx.lineWidth = radius * 0.1;
    elements.ctx.beginPath();
    elements.ctx.moveTo(x, y - radius * 0.7);
    elements.ctx.lineTo(x + radius * 0.3, y - radius * 0.9);
    elements.ctx.stroke();
}

// 绘制暂停消息
function drawPausedMessage() {
    elements.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    elements.ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    elements.ctx.fillStyle = 'white';
    elements.ctx.font = '30px Arial';
    elements.ctx.textAlign = 'center';
    elements.ctx.fillText('游戏暂停', elements.canvas.width / 2, elements.canvas.height / 2);
    
    elements.ctx.font = '16px Arial';
    elements.ctx.fillText('按空格键继续', elements.canvas.width / 2, elements.canvas.height / 2 + 30);
}

// 生成食物
function generateFood() {
    const gridWidth = config.canvasWidth / config.gridSize;
    const gridHeight = config.canvasHeight / config.gridSize;
    
    let newFood;
    let isOnSnake;
    
    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // 检查食物是否生成在蛇身上
        for (const segment of gameState.snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);
    
    gameState.food = newFood;
}

// 检查自身碰撞 - 优化版本
function checkSelfCollision(head) {
    // 反向遍历通常更快，因为新添加的头部更可能与前面的部分碰撞
    for (let i = gameState.snake.length - 1; i > 0; i--) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    return false;
}

// 更新分数
function updateScore() {
    elements.scoreDisplay.textContent = gameState.score;
}

// 更新最高分
function updateHighScore() {
    elements.highScoreDisplay.textContent = gameState.highScore;
}

// 保存最高分到本地存储
function saveHighScore() {
    localStorage.setItem('snakeGameHighScore', gameState.highScore.toString());
}

// 从本地存储加载最高分
function loadHighScore() {
    const savedHighScore = localStorage.getItem('snakeGameHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
        updateHighScore();
    }
}

// 更新按钮状态
function updateButtonsState() {
    elements.startButton.disabled = gameState.isRunning && !gameState.isPaused;
    elements.pauseButton.disabled = !gameState.isRunning;
    elements.resetButton.disabled = !gameState.isRunning && gameState.score === 0;
    
    // 启用/禁用速度滑块
    elements.speedSlider.disabled = gameState.isRunning;
}

// 当页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);