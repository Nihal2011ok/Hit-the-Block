const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const paddleWidth = 100;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 8;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballDX = 3;
let ballDY = -3;

const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let score = 0;
let lives = 3;
let level = 1;
let highScore = localStorage.getItem('highScore') || 0;

const powerUpTypes = ['expand', 'shrink', 'speedUp', 'slowDown'];
let activePowerUps = [];

const bricks = [];
let particles = [];

let gameStarted = false;
let gamePaused = false;

const sounds = {
    brick: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-mechanical-bling-210.mp3'),
    powerUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
    gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3'),
    levelUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3')
};

function initializeBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1, 
                powerUp: Math.random() < 0.1 ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] : null 
            };
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].powerUp ? '#FF69B4' : '#0095DD';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawPowerUps() {
    activePowerUps = activePowerUps.filter(powerUp => {
        powerUp.y += 2;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FF69B4';
        ctx.fill();
        ctx.closePath();

        if (powerUp.y > canvas.height - paddleHeight && powerUp.x > paddleX && powerUp.x < paddleX + paddleWidth) {
            activatePowerUp(powerUp.type);
            sounds.powerUp.play();
            return false;
        }

        return powerUp.y <= canvas.height;
    });
}

function activatePowerUp(type) {
    switch (type) {
        case 'expand':
            paddleWidth = Math.min(paddleWidth * 1.5, canvas.width / 2);
            setTimeout(() => paddleWidth /= 1.5, 10000);
            break;
        case 'shrink':
            paddleWidth = Math.max(paddleWidth / 1.5, 50);
            setTimeout(() => paddleWidth *= 1.5, 10000);
            break;
        case 'speedUp':
            ballDX *= 1.5;
            ballDY *= 1.5;
            setTimeout(() => {
                ballDX /= 1.5;
                ballDY /= 1.5;
            }, 10000);
            break;
        case 'slowDown':
            ballDX /= 1.5;
            ballDY /= 1.5;
            setTimeout(() => {
                ballDX *= 1.5;
                ballDY *= 1.5;
            }, 10000);
            break;
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
                    ballDY = -ballDY;
                    b.status = 0;
                    score++;
                    updateScore();
                    createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2);
                    sounds.brick.play();
                    if (b.powerUp) {
                        activePowerUps.push({ x: b.x + brickWidth / 2, y: b.y + brickHeight, type: b.powerUp });
                    }
                    if (score === brickRowCount * brickColumnCount) {
                        level++;
                        if (level > 3) {
                            alert('Congratulations! You won the game!');
                            document.location.reload();
                        } else {
                            sounds.levelUp.play();
                            alert('Congratulations! Next level');
                            initializeBricks();
                            ballX = canvas.width / 2;
                            ballY = canvas.height - 30;
                            ballDX = 3 + level;
                            ballDY = -(3 + level);
                            paddleX = (canvas.width - paddleWidth) / 2;
                            updateLevel();
                        }
                    }
                }
            }
        }
    }
}

function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 1,
            color: `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`,
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 4 - 2,
            life: 30
        });
    }
}

function drawParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.closePath();

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

function updateScore() {
    score = Math.max(0, score);  // Ensure score is not negative
    document.getElementById('score').textContent = `Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScore').textContent = `High Score: ${highScore}`;
    }
}

function updateLives() {
    document.getElementById('lives').textContent = `Lives: ${lives}`;
}

function updateLevel() {
    document.getElementById('level').textContent = `Level: ${level}`;
}

function draw() {
    if (!gameStarted || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawPowerUps();
    drawParticles();
    collisionDetection();

    if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
        ballDX = -ballDX;
    }
    if (ballY + ballDY < ballRadius) {
        ballDY = -ballDY;
    } else if (ballY + ballDY > canvas.height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            ballDY = -ballDY;
        } else {
            lives--;
            updateLives();
            if (lives === 0) {
                sounds.gameOver.play();
                alert('GAME OVER');
                document.location.reload();
            } else {
                ballX = canvas.width / 2;
                ballY = canvas.height - 30;
                ballDX = 3 + level;
                ballDY = -(3 + level);
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    ballX += ballDX;
    ballY += ballDY;

    requestAnimationFrame(draw);
}

let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function togglePause() {
    gamePaused = !gamePaused;
    if (!gamePaused) {
        requestAnimationFrame(draw);
    }
}

document.getElementById('startButton').addEventListener('click', () => {
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    initializeBricks();
    updateScore();
    updateLives();
    updateLevel();
    draw();
});

document.getElementById('highScore').textContent = `High Score: ${highScore}`;