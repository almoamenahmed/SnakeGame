// Constants and Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const moveSound = new Audio('move.wav');
const eatSound = new Audio('bite.wav');
const goldSound = new Audio('gold.wav');
const reverseSound = new Audio('reverse.wav');
const loseSound = new Audio('lose.wav');
const scale = 2;
const snakeSize = 20 * scale;
const appleImage = new Image();
const goldenAppleImage = new Image();
const spikeImage = new Image();
const reverseImage = new Image();
appleImage.src = 'apple.png';
goldenAppleImage.src = 'gold-apple.png';
spikeImage.src = 'spike.png';
reverseImage.src = 'reverse-icon.png';
let gameLoopTimeout, dx = snakeSize, dy = 0, foodX, foodY, goldenAppleX, goldenAppleY, reverseX, reverseY, isReverseActive = false, obstacles = [], score = 0, gameRunning = false;
let snake = createInitialSnake();

spikeImage.onload = initializeGame;

// Sounds
moveSound.volume = 0.25; // 25% volume
eatSound.volume = 0.25; // 25% volume
loseSound.volume = 0.25; // 25% volume
goldSound.volume = 0.25; // 25% volume
reverseSound.volume = 0.25; // 25% volume

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeGame);
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('pauseButton').addEventListener('click', pauseGame);
document.getElementById('restartButton').addEventListener('click', restartGame);
document.addEventListener('keydown', changeDirection);
document.getElementById('clearScoresButton').addEventListener('click', clearScores);

function initializeGame() {
    createObstacles(); // Create obstacles when the page loads
    drawObstacles();   // Draw them immediately
    createFood();      // Draw initial food
    createReversePowerDown();
    getAndDisplayHighScores();
    createGoldenApple();
}

// Game Loop
function gameLoop() {
    if (didGameEnd()) return endGame();
    if (!gameRunning) return;
    clearCanvas();    // Clears the canvas
    drawObstacles();  // Draw the obstacles
    drawSnake();      // Draw the snake
    drawFood();       // Draw the food
    drawGoldenApple();
    drawReversePowerDown();
    gameLoopTimeout = setTimeout(() => {
        updateGame();
        gameLoop();
    }, 100);
}

// Update Game function should only contain the game logic and not drawing functions
function updateGame() {
    updateScoreDisplay();
    moveSnake();
    // Drawing functions are called separately in the game loop
}

function createReversePowerDown() {
    if (reverseX !== undefined && reverseY !== undefined) {
        return; // Reverse power-down already exists, do not create a new one
    }

    if (Math.random() < 0.2) { // 20% chance
        let excludePositions = [{ x: foodX, y: foodY }];
        if (goldenAppleX !== undefined && goldenAppleY !== undefined) {
            excludePositions.push({ x: goldenAppleX, y: goldenAppleY });
        }

        const position = randomGridPosition(excludePositions);
        reverseX = position.x;
        reverseY = position.y;
    }
}


function drawReversePowerDown() {
    if (reverseX !== undefined && reverseY !== undefined) {
        ctx.drawImage(reverseImage, reverseX, reverseY, snakeSize, snakeSize);
    }
}


// Game Control Functions
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gameLoop();
    }
}

function changeDirection(event) {
    const keyPressed = isReverseActive ? reverseKeyCode(event.keyCode) : event.keyCode;
    const goingUp = dy === -snakeSize;
    const goingDown = dy === snakeSize;
    const goingRight = dx === snakeSize;
    const goingLeft = dx === -snakeSize;

    switch (keyPressed) {
        case 37: // Left arrow
        case 65: // A key
            if (!goingRight) {
                moveSound.play();
                dx = -snakeSize;
                dy = 0;
            }
            break;
        case 38: // Up arrow
        case 87: // W key
            if (!goingDown) {
                moveSound.play();
                dx = 0;
                dy = -snakeSize;
            }
            break;
        case 39: // Right arrow
        case 68: // D key
            if (!goingLeft) {
                moveSound.play();
                dx = snakeSize;
                dy = 0;
            }
            break;
        case 40: // Down arrow
        case 83: // S key
            if (!goingUp) {
                moveSound.play();
                dx = 0;
                dy = snakeSize;
            }
            break;
    }

    function reverseKeyCode(keyCode) {
        switch (keyCode) {
            case 37: return 39; // Left arrow becomes right
            case 38: return 40; // Up arrow becomes down
            case 39: return 37; // Right arrow becomes left
            case 40: return 38; // Down arrow becomes up
            default: return keyCode;
        }
    }
}

function pauseGame() {
    gameRunning = false;
}

function restartGame() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        gameLoop();
    }
}

function endGame() {
    gameRunning = false;
    clearTimeout(gameLoopTimeout);
    clearCanvas();       // Clears the canvas
    drawObstacles();     // Redraw the obstacles so they remain visible
    drawGameOver();
    disableButtons(['startButton', 'pauseButton']);
    setTimeout(promptForScore, 100);
}

// Helper Functions
function disableButtons(buttonIds) {
    buttonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.disabled = true;
        button.classList.add('button-disabled');
    });
}

function promptForScore() {
    const playerName = prompt("Game Over! Enter your name for the high score table:", "Player");
    if (playerName && playerName.trim()) {
        submitScore(playerName.trim(), score);
    }
}

function createInitialSnake() {
    return Array.from({ length: 5 }, (v, i) => ({
        x: 200 - i * snakeSize,
        y: 200
    }));
}

function randomGridPosition(excludePositions = []) {
    let newPosition;
    do {
        newPosition = {
            x: Math.floor(Math.random() * (canvas.width / snakeSize)) * snakeSize,
            y: Math.floor(Math.random() * (canvas.height / snakeSize)) * snakeSize
        };
    } while (
        excludePositions.some(pos => pos.x === newPosition.x && pos.y === newPosition.y) ||
        snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y) ||
        obstacles.some(obstacle => obstacle.x === newPosition.x && obstacle.y === newPosition.y)
    );
    return newPosition;
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(spikeImage, obstacle.x, obstacle.y, snakeSize, snakeSize);
    });
}

function createObstacles() {
    obstacles = []; // Reset the obstacles array for a new game
    while (obstacles.length < 5) { // Create 5 obstacles
        const position = randomGridPosition();
        obstacles.push({
            x: position.x,
            y: position.y
        });
    }
}

function clearCanvas() {
    ctx.fillStyle = '#00011c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    const gridSize = snakeSize;
    ctx.strokeStyle = 'rgb(128,128,128)'; // Light grey lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach(drawSnakePart);
}

function drawSnakePart(snakePart, index) {
    // Alternate colors for the snake's body
    ctx.fillStyle = index % 2 === 0 ? '#27f502' : '#00d919';

    ctx.fillRect(snakePart.x, snakePart.y, snakeSize, snakeSize);

    ctx.strokeStyle = index % 2 === 0 ? '#00d919' : '#00d919';
    ctx.strokeRect(snakePart.x, snakePart.y, snakeSize, snakeSize);
}


function submitScore(playerName, score) {
    fetch('/submit-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName, score }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Score submitted', data);
            getAndDisplayHighScores(); // Refresh high scores
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Client-side function to clear scores
function clearScores() {
    if (confirm('Are you sure you want to clear all the high scores? This cannot be undone.')) {
        fetch('/clear-scores', { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Scores cleared', data);
                getAndDisplayHighScores(); // Refresh high scores
            })
            .catch((error) => {
                console.error('Error clearing scores:', error);
            });
    }
}

function getAndDisplayHighScores() {
    fetch('/high-scores')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(scores => {
            const highScoresList = document.getElementById('high-scores-list');
            highScoresList.innerHTML = ''; // Clear current list
            scores.forEach(score => {
                const li = document.createElement('li');
                li.textContent = `${score.playerName}: ${score.score}`;
                highScoresList.appendChild(li);
            });
        })
        .catch((error) => {
            console.error('Error fetching high scores:', error);
        });
}

function moveSnake() {
    // Create new head based on direction
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // Add new head to the beginning of the snake body

    if (head.x === reverseX && head.y === reverseY) {
        reverseSound.play();
        isReverseActive = true;
        reverseX = reverseY = undefined; // Remove reverse power-down from grid
        setTimeout(() => isReverseActive = false, 1500); // Reverse effect lasts for 1.5 seconds
        createReversePowerDown(); // Generate a new reverse power-down
    }

    // Handling eating the golden apple
    if (head.x === goldenAppleX && head.y === goldenAppleY) {
        score += 3; // Increase score by 3
        goldSound.play();
        goldenAppleX = goldenAppleY = undefined; // Remove golden apple from grid
        // Add 3 segments to the snake
        for (let i = 0; i < 3; i++) {
            snake.push({ ...snake[snake.length - 1] });
        }
        createGoldenApple(); // Generate a new golden apple
    }

    // Check if snake has eaten the food
    if (head.x === foodX && head.y === foodY) {
        score += 1;
        eatSound.play();
        createFood(); // Generate new food
        createGoldenApple(); //Chance for Gold Apple

        // Decide randomly whether to create a reverse power-down
        if (Math.random() < 0.7) { // 20% chance to spawn the reverse power-down
            createReversePowerDown();
        }
    } else {
        snake.pop(); // Remove the last part of the snake
    }
}

function createFood() {
    let excludePositions = [];
    if (goldenAppleX !== undefined && goldenAppleY !== undefined) {
        excludePositions.push({ x: goldenAppleX, y: goldenAppleY });
    }
    if (reverseX !== undefined && reverseY !== undefined) {
        excludePositions.push({ x: reverseX, y: reverseY });
    }

    const position = randomGridPosition(excludePositions);
    foodX = position.x;
    foodY = position.y;
}

function createGoldenApple() {
    if (goldenAppleX !== undefined && goldenAppleY !== undefined) {
        return; // Golden apple already exists, do not create a new one
    }

    if (Math.random() < 0.25) { // 25% chance to spawn the golden apple
        let excludePositions = [{ x: foodX, y: foodY }];
        if (reverseX !== undefined && reverseY !== undefined) {
            excludePositions.push({ x: reverseX, y: reverseY });
        }

        const position = randomGridPosition(excludePositions);
        goldenAppleX = position.x;
        goldenAppleY = position.y;
    }
}


function drawFood() {
    ctx.drawImage(appleImage, foodX, foodY, snakeSize, snakeSize);
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = "Score: " + score;
}

function drawGoldenApple() {
    if (goldenAppleX !== undefined && goldenAppleY !== undefined) {
        ctx.drawImage(goldenAppleImage, goldenAppleX, goldenAppleY, snakeSize, snakeSize);
    }
}

function didGameEnd() {
    // Check for collision with the snake itself
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }

    // Check for collision with walls
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x > canvas.width - snakeSize;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y > canvas.height - snakeSize;
    const hitObstacle = obstacles.some(obstacle => obstacle.x === snake[0].x && obstacle.y === snake[0].y);
    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall || hitObstacle;
}

function randomTen(min, max) {
    return Math.round((Math.random() * (max - min) + min) / snakeSize) * snakeSize;
}

function drawGameOver() {
    loseSound.play();
    const lines = ["Game Over.", "Press Restart to Play Again"]; // Split text into lines
    const fontSize = 42; // Set the font size
    ctx.font = `${fontSize}px "Chakra Petch"`;
    ctx.fillStyle = '#00011c'; // Background color for the text box
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate the overall height needed for the background box, accounting for all lines
    const lineHeight = fontSize * 1.2; // Line height, 1.2 is a typical value for line spacing
    const backgroundHeight = lineHeight * lines.length;
    const textX = canvas.width / 2;
    const textY = canvas.height / 2 - (backgroundHeight / 2) + (lineHeight / 2); // Starting Y position for the first line

    // Draw text background box once, large enough to contain all lines
    ctx.fillRect(
        textX - (ctx.measureText(lines[0]).width / 2) - 10, // Some padding
        textY - 10, // Some padding above the first line
        ctx.measureText(lines[0]).width + 20, // Use the width of the widest line plus some padding
        backgroundHeight + 20 // Total height for all lines plus some padding
    );

    // Draw each line of text separately
    ctx.fillStyle = '#ff0000'; // Text color
    lines.forEach((line, i) => {
        ctx.fillText(line, textX, textY + (i * lineHeight));
    });
}

function resetGame() {
    clearTimeout(gameLoopTimeout); // Clear any existing game loop timeouts
    snake = createInitialSnake(); // Reset the snake
    dx = snakeSize; // Reset movement direction
    dy = 0;
    score = 0;
    createFood(); // Create new food
    createGoldenApple();
    createReversePowerDown();
    updateScoreDisplay();
    // Re-enable buttons
    document.getElementById('startButton').disabled = false;
    document.getElementById('pauseButton').disabled = false;
    document.getElementById('startButton').classList.remove('button-disabled');
    document.getElementById('pauseButton').classList.remove('button-disabled');
}
