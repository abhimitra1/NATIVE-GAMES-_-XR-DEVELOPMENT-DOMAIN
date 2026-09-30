"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const BOARD_SIZE = 650;
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;

// Keep the existing board positions and connections.
const points = [
    { x: 325, y: 80 },
    { x: 150, y: 180 },
    { x: 325, y: 180 },
    { x: 500, y: 180 },
    { x: 150, y: 325 },
    { x: 325, y: 325 },
    { x: 500, y: 325 },
    { x: 150, y: 470 },
    { x: 325, y: 470 },
    { x: 500, y: 470 },
    { x: 325, y: 570 }
];

const connections = [
    [0, 2],
    [1, 2], [2, 3],
    [1, 4], [1, 5],
    [2, 5],
    [3, 6], [3, 5],
    [4, 5], [5, 6],
    [4, 7], [4, 8],
    [5, 8],
    [6, 9], [6, 8],
    [7, 8], [8, 9],
    [7, 10], [8, 10], [9, 10]
];

const TOTAL_HERD = 15;
const MAX_CAPTURES = 6;

let tigers = [];
let herd = [];
let currentTurn = "herd";
let selectedTiger = null;
let selectedHerd = null;
let highlightedMoves = [];
let highlightedCaptures = [];
let highlightedHerdMoves = [];
let captures = 0;
let gameOver = false;
let selectedSide = "tiger";
let selectedColour = "#d97827";

// ========================================
// SCREENS AND SETUP
// ========================================

const homeScreen = document.getElementById("homeScreen");
const setupScreen = document.getElementById("setupScreen");
const howToPlayScreen = document.getElementById("howToPlayScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const statusMessage = document.getElementById("statusMessage");

function showScreen(screenToShow) {
    [homeScreen, setupScreen, howToPlayScreen, gameScreen].forEach(screen => {
        screen.classList.add("hidden");
    });
    screenToShow.classList.remove("hidden");
}

function showHome() {
    gameOverScreen.classList.add("hidden");
    showScreen(homeScreen);
}

function showSetup() {
    gameOverScreen.classList.add("hidden");
    showScreen(setupScreen);
}

function showHowToPlay() {
    showScreen(howToPlayScreen);
}

function showGame() {
    showScreen(gameScreen);
    initializeGame();
}

document.getElementById("startSetupButton").addEventListener("click", showSetup);
document.getElementById("setupBackButton").addEventListener("click", showHome);
document.getElementById("rulesBackButton").addEventListener("click", showHome);
document.getElementById("howToPlayButton").addEventListener("click", showHowToPlay);
document.getElementById("beginGameButton").addEventListener("click", showGame);
document.getElementById("gameHomeButton").addEventListener("click", showHome);
document.getElementById("gameOverHomeButton").addEventListener("click", showHome);
document.getElementById("restartButton").addEventListener("click", restartGame);
document.getElementById("playAgainButton").addEventListener("click", restartGame);

document.querySelectorAll(".side-choice").forEach(button => {
    button.addEventListener("click", () => {
        selectedSide = button.dataset.side;
        document.querySelectorAll(".side-choice").forEach(option => {
            const selected = option === button;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-pressed", String(selected));
        });
    });
});

document.querySelectorAll(".colour-choice").forEach(button => {
    button.addEventListener("click", () => {
        selectedColour = button.dataset.colour;
        document.querySelectorAll(".colour-choice").forEach(option => {
            const selected = option === button;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-pressed", String(selected));
        });
    });
});

// ========================================
// BOARD DRAWING
// ========================================

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d8b878";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#5b3a20";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    connections.forEach(([from, to]) => {
        ctx.beginPath();
        ctx.moveTo(points[from].x, points[from].y);
        ctx.lineTo(points[to].x, points[to].y);
        ctx.stroke();
    });

    points.forEach((point, index) => {
        let highlight = null;
        if (highlightedCaptures.some(move => move.landingPoint === index)) {
            highlight = "#ef9277";
        } else if (highlightedMoves.includes(index) || highlightedHerdMoves.includes(index)) {
            highlight = "#9bcc73";
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = highlight || "#fff8e8";
        ctx.fill();
        ctx.strokeStyle = highlight ? "#47752c" : "#5b3a20";
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    tigers.forEach((tiger, index) => drawTiger(tiger.position, index));
    herd.forEach((animal, index) => drawHerd(animal.position, index));
}

function drawTiger(positionIndex, tigerIndex) {
    const point = points[positionIndex];

    ctx.beginPath();
    ctx.arc(point.x, point.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = selectedTiger === tigerIndex ? "#ffad48" :
        (selectedSide === "tiger" ? selectedColour : "#d97827");
    ctx.fill();
    ctx.strokeStyle = selectedTiger === tigerIndex ? "#fff2ca" : "#4a2815";
    ctx.lineWidth = selectedTiger === tigerIndex ? 6 : 4;
    ctx.stroke();

    ctx.font = "26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐯", point.x, point.y);
}

function drawHerd(positionIndex, herdIndex) {
    const point = points[positionIndex];

    ctx.beginPath();
    ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = selectedSide === "herd" ? selectedColour : "#fffaf0";
    ctx.fill();
    ctx.strokeStyle = selectedHerd === herdIndex ? "#c96d27" : "#4a2815";
    ctx.lineWidth = selectedHerd === herdIndex ? 5 : 3;
    ctx.stroke();

    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐐", point.x, point.y);
}

// ========================================
// BOARD HELPERS AND LEGAL MOVES
// ========================================

function isPointOccupied(pointIndex) {
    return tigers.some(tiger => tiger.position === pointIndex) ||
        herd.some(animal => animal.position === pointIndex);
}

function getTigerAtPoint(pointIndex) {
    return tigers.findIndex(tiger => tiger.position === pointIndex);
}

function getHerdAtPoint(pointIndex) {
    return herd.findIndex(animal => animal.position === pointIndex);
}

function getConnectedPoints(pointIndex) {
    const connected = [];
    connections.forEach(([from, to]) => {
        if (from === pointIndex) connected.push(to);
        else if (to === pointIndex) connected.push(from);
    });
    return connected;
}

function hasConnection(pointA, pointB) {
    return connections.some(([from, to]) =>
        (from === pointA && to === pointB) ||
        (from === pointB && to === pointA)
    );
}

function getLegalMoves(tigerIndex) {
    if (!tigers[tigerIndex]) return [];
    return getConnectedPoints(tigers[tigerIndex].position)
        .filter(pointIndex => !isPointOccupied(pointIndex));
}

function getCaptureMoves(tigerIndex) {
    if (!tigers[tigerIndex]) return [];

    const tigerPosition = tigers[tigerIndex].position;
    const tigerPoint = points[tigerPosition];
    const available = [];

    getConnectedPoints(tigerPosition).forEach(middlePoint => {
        const herdIndex = getHerdAtPoint(middlePoint);
        if (herdIndex === -1) return;

        const middle = points[middlePoint];
        const targetX = middle.x + (middle.x - tigerPoint.x);
        const targetY = middle.y + (middle.y - tigerPoint.y);
        const landingPoint = points.findIndex(point =>
            point.x === targetX && point.y === targetY
        );

        if (landingPoint === -1 || !hasConnection(middlePoint, landingPoint)) return;
        if (isPointOccupied(landingPoint)) return;

        available.push({ landingPoint, herdIndex });
    });

    return available;
}

function getHerdMoves(herdIndex) {
    if (!herd[herdIndex]) return [];
    return getConnectedPoints(herd[herdIndex].position)
        .filter(pointIndex => !isPointOccupied(pointIndex));
}

// ========================================
// GAME PLAY
// ========================================

function initializeGame() {
    tigers = [{ position: 1 }, { position: 3 }, { position: 5 }];
    herd = [];
    currentTurn = "herd";
    selectedTiger = null;
    selectedHerd = null;
    highlightedMoves = [];
    highlightedCaptures = [];
    highlightedHerdMoves = [];
    captures = 0;
    gameOver = false;

    gameOverScreen.classList.add("hidden");
    statusMessage.textContent = "Place a herd piece on an empty point.";
    drawBoard();
    updateGameInfo();
}

function restartGame() {
    initializeGame();
}

function handlePositionClick(pointIndex) {
    if (gameOver) return;

    if (currentTurn === "herd") {
        handleHerdClick(pointIndex);
    } else {
        handleTigerClick(pointIndex);
    }
}

function handleHerdClick(pointIndex) {
    if (herd.length < TOTAL_HERD) {
        placeHerd(pointIndex);
        return;
    }

    const herdIndex = getHerdAtPoint(pointIndex);
    if (herdIndex !== -1) {
        selectedHerd = herdIndex;
        selectedTiger = null;
        highlightedHerdMoves = getHerdMoves(herdIndex);
        highlightedMoves = [];
        highlightedCaptures = [];
        statusMessage.textContent = highlightedHerdMoves.length
            ? "Choose a highlighted point to move the herd."
            : "That herd piece cannot move. Select another piece.";
        drawBoard();
        return;
    }

    if (selectedHerd !== null && highlightedHerdMoves.includes(pointIndex)) {
        herd[selectedHerd].position = pointIndex;
        selectedHerd = null;
        highlightedHerdMoves = [];
        currentTurn = "tiger";
        statusMessage.textContent = "Select a tiger to move or capture.";
        drawBoard();
        updateGameInfo();
        checkWin();
    }
}

function placeHerd(pointIndex) {
    if (isPointOccupied(pointIndex)) {
        statusMessage.textContent = "Choose an empty point for the herd.";
        return;
    }

    herd.push({ position: pointIndex });
    selectedHerd = null;
    currentTurn = "tiger";
    statusMessage.textContent = "Select a tiger to move or capture.";

    drawBoard();
    updateGameInfo();
    checkWin();
}

function handleTigerClick(pointIndex) {
    const tigerIndex = getTigerAtPoint(pointIndex);

    if (tigerIndex !== -1) {
        selectedTiger = tigerIndex;
        selectedHerd = null;
        highlightedMoves = getLegalMoves(tigerIndex);
        highlightedCaptures = getCaptureMoves(tigerIndex);
        highlightedHerdMoves = [];
        statusMessage.textContent = highlightedCaptures.length
            ? "Choose a highlighted landing point to capture, or move to a highlighted point."
            : "Choose a highlighted point to move the tiger.";
        drawBoard();
        return;
    }

    if (selectedTiger === null) return;

    const captureMove = highlightedCaptures.find(move => move.landingPoint === pointIndex);
    if (captureMove) {
        performCapture(captureMove);
        return;
    }

    if (highlightedMoves.includes(pointIndex)) {
        tigers[selectedTiger].position = pointIndex;
        endTigerTurn();
    }
}

function performCapture(captureMove) {
    if (!herd[captureMove.herdIndex] || isPointOccupied(captureMove.landingPoint)) return;

    herd.splice(captureMove.herdIndex, 1);
    tigers[selectedTiger].position = captureMove.landingPoint;
    captures++;

    if (captures >= MAX_CAPTURES) {
        drawBoard();
        updateGameInfo();
        finishGame("🐯 TIGERS WIN!", "6 herd pieces have been captured.");
        return;
    }

    const nextCaptures = getCaptureMoves(selectedTiger);
    if (nextCaptures.length > 0) {
        highlightedMoves = [];
        highlightedCaptures = nextCaptures;
        statusMessage.textContent = "Another capture is possible. Continue with the selected tiger.";
        drawBoard();
        updateGameInfo();
        return;
    }

    endTigerTurn();
}

function endTigerTurn() {
    selectedTiger = null;
    highlightedMoves = [];
    highlightedCaptures = [];
    currentTurn = "herd";
    statusMessage.textContent = herd.length < TOTAL_HERD
        ? "Place a herd piece on an empty point."
        : "Select a herd piece and move it along a line.";

    drawBoard();
    updateGameInfo();
    checkWin();
}

// ========================================
// WIN CONDITIONS AND UI
// ========================================

function checkWin() {
    if (captures >= MAX_CAPTURES) {
        finishGame("🐯 TIGERS WIN!", "6 herd pieces have been captured.");
        return true;
    }

    const allTigersBlocked = tigers.every((tiger, index) =>
        getLegalMoves(index).length === 0 && getCaptureMoves(index).length === 0
    );

    if (allTigersBlocked) {
        finishGame("🐐 HERD WINS!", "The tigers have been completely blocked.");
        return true;
    }

    return false;
}

function finishGame(title, message) {
    gameOver = true;
    winnerText.textContent = title;
    winnerMessage.textContent = message;
    gameOverScreen.classList.remove("hidden");
}

function updateGameInfo() {
    document.getElementById("turnText").textContent =
        `Turn: ${currentTurn === "herd" ? "Herd" : "Tiger"}`;
    document.getElementById("herdText").textContent =
        `Herd placed: ${herd.length} / ${TOTAL_HERD}`;
    document.getElementById("captureText").textContent =
        `Captures: ${captures} / ${MAX_CAPTURES}`;
}

// Convert clicks correctly when the canvas is scaled by CSS.
function getMousePoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    for (let i = 0; i < points.length; i++) {
        const dx = mouseX - points[i].x;
        const dy = mouseY - points[i].y;
        if (Math.sqrt(dx * dx + dy * dy) <= 28) return i;
    }

    return null;
}

canvas.addEventListener("click", event => {
    const pointIndex = getMousePoint(event);
    if (pointIndex !== null) handlePositionClick(pointIndex);
});

window.addEventListener("resize", drawBoard);

initializeGame();