// ========================================
// BAGHA CHELI - HTML5 GAME
// ========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const turnText = document.getElementById("turnText");
const goatCount = document.getElementById("goatCount");
const capturedCount = document.getElementById("capturedCount");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");


// ========================================
// BOARD SETTINGS
// ========================================

const BOARD_SIZE = 600;

const OFFSET = 60;

const GAP = 120;

const ROWS = 5;
const COLS = 5;


// ========================================
// GAME SETTINGS
// ========================================

const TOTAL_GOATS = 20;

const TIGER_WIN_COUNT = 5;


// ========================================
// GAME VARIABLES
// ========================================

let tiger;

let goats = [];

let selectedGoat = null;

let currentPlayer = "goat";

let placedGoats = 0;

let capturedGoats = 0;

let gameOver = false;


// ========================================
// BOARD POINTS
// ========================================

let points = [];


// Create board points
function createPoints() {

    points = [];

    for (let row = 0; row < ROWS; row++) {

        for (let col = 0; col < COLS; col++) {

            points.push({
                row: row,
                col: col
            });

        }
    }
}


// ========================================
// START GAME
// ========================================

function startGame() {

    tiger = {
        row: 2,
        col: 2
    };

    goats = [];

    selectedGoat = null;

    currentPlayer = "goat";

    placedGoats = 0;

    capturedGoats = 0;

    gameOver = false;

    message.innerText =
        "Click an empty point to place a goat.";

    updateUI();

    drawGame();
}


// ========================================
// UPDATE UI
// ========================================

function updateUI() {

    turnText.innerText =
        currentPlayer === "goat"
            ? "Goat"
            : "Tiger";

    goatCount.innerText =
        TOTAL_GOATS - placedGoats;

    capturedCount.innerText =
        capturedGoats;
}


// ========================================
// DRAW COMPLETE GAME
// ========================================

function drawGame() {

    // Clear canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawBackground();

    drawBoard();

    drawPieces();
}


// ========================================
// BACKGROUND
// ========================================

function drawBackground() {

    ctx.fillStyle = "#d9b879";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// ========================================
// DRAW BOARD
// ========================================

function drawBoard() {

    ctx.strokeStyle = "#633718";

    ctx.lineWidth = 5;


    // ------------------------------------
    // Horizontal lines
    // ------------------------------------

    for (let row = 0; row < ROWS; row++) {

        const y = OFFSET + row * GAP;

        ctx.beginPath();

        ctx.moveTo(
            OFFSET,
            y
        );

        ctx.lineTo(
            OFFSET + GAP * 4,
            y
        );

        ctx.stroke();
    }


    // ------------------------------------
    // Vertical lines
    // ------------------------------------

    for (let col = 0; col < COLS; col++) {

        const x = OFFSET + col * GAP;

        ctx.beginPath();

        ctx.moveTo(
            x,
            OFFSET
        );

        ctx.lineTo(
            x,
            OFFSET + GAP * 4
        );

        ctx.stroke();
    }


    // ------------------------------------
    // Diagonal lines
    // ------------------------------------

    for (let row = 0; row < 4; row++) {

        for (let col = 0; col < 4; col++) {

            const x =
                OFFSET + col * GAP;

            const y =
                OFFSET + row * GAP;


            // \
            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x + GAP,
                y + GAP
            );

            ctx.stroke();


            // /
            ctx.beginPath();

            ctx.moveTo(
                x + GAP,
                y
            );

            ctx.lineTo(
                x,
                y + GAP
            );

            ctx.stroke();
        }
    }


    // ------------------------------------
    // Draw board points
    // ------------------------------------

    for (const point of points) {

        const x =
            OFFSET + point.col * GAP;

        const y =
            OFFSET + point.row * GAP;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            10,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#fff0c8";

        ctx.fill();

        ctx.strokeStyle = "#542d18";

        ctx.lineWidth = 3;

        ctx.stroke();
    }
}


// ========================================
// DRAW PIECES
// ========================================

function drawPieces() {

    // Draw goats
    for (const goat of goats) {

        drawGoat(
            goat.row,
            goat.col
        );
    }


    // Draw tiger
    drawTiger(
        tiger.row,
        tiger.col
    );
}


// ========================================
// DRAW GOAT
// ========================================

function drawGoat(row, col) {

    const x =
        OFFSET + col * GAP;

    const y =
        OFFSET + row * GAP;


    // Body
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        27,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#f4f4f4";

    ctx.fill();

    ctx.strokeStyle = "#333";

    ctx.lineWidth = 3;

    ctx.stroke();


    // Eyes
    ctx.fillStyle = "#111";


    ctx.beginPath();

    ctx.arc(
        x - 8,
        y - 5,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 8,
        y - 5,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Horns
    ctx.strokeStyle = "#555";

    ctx.lineWidth = 4;


    ctx.beginPath();

    ctx.moveTo(
        x - 15,
        y - 20
    );

    ctx.lineTo(
        x - 25,
        y - 32
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        x + 15,
        y - 20
    );

    ctx.lineTo(
        x + 25,
        y - 32
    );

    ctx.stroke();
}


// ========================================
// DRAW TIGER
// ========================================

function drawTiger(row, col) {

    const x =
        OFFSET + col * GAP;

    const y =
        OFFSET + row * GAP;


    // Highlight selected position
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        40,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#f39a27";

    ctx.fill();

    ctx.strokeStyle = "#71340f";

    ctx.lineWidth = 5;

    ctx.stroke();


    // Tiger eyes
    ctx.fillStyle = "white";


    ctx.beginPath();

    ctx.arc(
        x - 10,
        y - 7,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 10,
        y - 7,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "black";


    ctx.beginPath();

    ctx.arc(
        x - 10,
        y - 7,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 10,
        y - 7,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Tiger nose
    ctx.beginPath();

    ctx.arc(
        x,
        y + 10,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ========================================
// GET CLICKED POINT
// ========================================

function getClickedPoint(event) {

    const rect =
        canvas.getBoundingClientRect();


    const scaleX =
        canvas.width / rect.width;

    const scaleY =
        canvas.height / rect.height;


    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const mouseY =
        (event.clientY - rect.top) * scaleY;


    for (const point of points) {

        const x =
            OFFSET + point.col * GAP;

        const y =
            OFFSET + point.row * GAP;


        const distance =
            Math.sqrt(
                (mouseX - x) ** 2 +
                (mouseY - y) ** 2
            );


        if (distance < 35) {

            return point;
        }
    }


    return null;
}


// ========================================
// CHECK PIECE
// ========================================

function getPiece(row, col) {

    if (
        tiger.row === row &&
        tiger.col === col
    ) {

        return "tiger";
    }


    for (const goat of goats) {

        if (
            goat.row === row &&
            goat.col === col
        ) {

            return "goat";
        }
    }


    return null;
}


// ========================================
// GET NEIGHBOURS
// ========================================

function getNeighbours(row, col) {

    const result = [];


    const directions = [

        [-1, 0],
        [1, 0],

        [0, -1],
        [0, 1],

        [-1, -1],
        [-1, 1],

        [1, -1],
        [1, 1]

    ];


    for (const direction of directions) {

        const newRow =
            row + direction[0];

        const newCol =
            col + direction[1];


        if (
            newRow >= 0 &&
            newRow < ROWS &&
            newCol >= 0 &&
            newCol < COLS
        ) {

            result.push({
                row: newRow,
                col: newCol
            });
        }
    }


    return result;
}


// ========================================
// PLACE GOAT
// ========================================

function placeGoat(point) {

    if (
        getPiece(
            point.row,
            point.col
        )
    ) {

        message.innerText =
            "This point is already occupied.";

        return false;
    }


    goats.push({

        row: point.row,

        col: point.col

    });


    placedGoats++;

    return true;
}


// ========================================
// MOVE TIGER
// ========================================

function moveTiger(point) {

    const neighbours =
        getNeighbours(
            tiger.row,
            tiger.col
        );


    const valid =
        neighbours.some(
            p =>
                p.row === point.row &&
                p.col === point.col
        );


    if (!valid) {

        message.innerText =
            "Tiger can move only to a connected point.";

        return false;
    }


    if (
        getPiece(
            point.row,
            point.col
        )
    ) {

        message.innerText =
            "That point is occupied.";

        return false;
    }


    tiger.row =
        point.row;

    tiger.col =
        point.col;


    return true;
}


// ========================================
// TIGER CAPTURE
// ========================================

function captureGoat(point) {

    const rowDifference =
        point.row - tiger.row;

    const colDifference =
        point.col - tiger.col;


    // Goat must be next to tiger
    if (
        Math.abs(rowDifference) !== 1 &&
        Math.abs(colDifference) !== 1
    ) {

        message.innerText =
            "The goat is not in a capture position.";

        return false;
    }


    const landingRow =
        point.row + rowDifference;

    const landingCol =
        point.col + colDifference;


    // Landing position must exist
    if (
        landingRow < 0 ||
        landingRow >= ROWS ||
        landingCol < 0 ||
        landingCol >= COLS
    ) {

        message.innerText =
            "Tiger cannot jump outside the board.";

        return false;
    }


    // Landing position must be empty
    if (
        getPiece(
            landingRow,
            landingCol
        )
    ) {

        message.innerText =
            "Tiger cannot jump there.";

        return false;
    }


    // Find goat
    const goatIndex =
        goats.findIndex(
            goat =>
                goat.row === point.row &&
                goat.col === point.col
        );


    if (goatIndex === -1) {

        return false;
    }


    // Remove goat
    goats.splice(
        goatIndex,
        1
    );


    // Move tiger
    tiger.row =
        landingRow;

    tiger.col =
        landingCol;


    capturedGoats++;


    message.innerText =
        "🐯 Tiger captured a goat!";


    return true;
}


// ========================================
// CHECK TIGER MOVEMENT
// ========================================

function tigerHasMoves() {

    const neighbours =
        getNeighbours(
            tiger.row,
            tiger.col
        );


    // Normal movement
    for (const point of neighbours) {

        if (
            !getPiece(
                point.row,
                point.col
            )
        ) {

            return true;
        }
    }


    // Capture movement
    for (const point of neighbours) {

        if (
            getPiece(
                point.row,
                point.col
            ) === "goat"
        ) {

            const dr =
                point.row - tiger.row;

            const dc =
                point.col - tiger.col;


            const landingRow =
                point.row + dr;

            const landingCol =
                point.col + dc;


            if (
                landingRow >= 0 &&
                landingRow < ROWS &&
                landingCol >= 0 &&
                landingCol < COLS &&
                !getPiece(
                    landingRow,
                    landingCol
                )
            ) {

                return true;
            }
        }
    }


    return false;
}


// ========================================
// CHECK WIN
// ========================================

function checkWinner() {

    // Tiger wins
    if (
        capturedGoats >= TIGER_WIN_COUNT
    ) {

        gameOver = true;

        message.innerText =
            "🐯 TIGER WINS! 5 goats captured.";

        return true;
    }


    // Goats win
    if (
        !tigerHasMoves()
    ) {

        gameOver = true;

        message.innerText =
            "🐐 GOATS WIN! Tiger is trapped.";

        return true;
    }


    return false;
}


// ========================================
// CANVAS CLICK
// ========================================

canvas.addEventListener(
    "click",
    function(event) {

        if (gameOver) {

            return;
        }


        const point =
            getClickedPoint(event);


        if (!point) {

            return;
        }


        // ==================================
        // GOAT TURN
        // ==================================

        if (
            currentPlayer === "goat"
        ) {

            // Place goats
            if (
                placedGoats < TOTAL_GOATS
            ) {

                if (
                    placeGoat(point)
                ) {

                    currentPlayer =
                        "tiger";

                    message.innerText =
                        "🐯 Tiger turn.";

                }

            }

            // Move goats after all placed
            else {

                message.innerText =
                    "All goats are placed.";

            }
        }


        // ==================================
        // TIGER TURN
        // ==================================

        else {

            const piece =
                getPiece(
                    point.row,
                    point.col
                );


            // Capture goat
            if (
                piece === "goat"
            ) {

                if (
                    captureGoat(point)
                ) {

                    if (
                        !checkWinner()
                    ) {

                        currentPlayer =
                            "goat";

                        message.innerText =
                            "🐐 Goat turn.";
                    }
                }
            }


            // Normal movement
            else if (
                piece === null
            ) {

                if (
                    moveTiger(point)
                ) {

                    if (
                        !checkWinner()
                    ) {

                        currentPlayer =
                            "goat";

                        message.innerText =
                            "🐐 Goat turn.";
                    }
                }
            }
        }


        updateUI();

        drawGame();
    }
);


// ========================================
// RESTART
// ========================================

restartBtn.addEventListener(
    "click",
    startGame
);


// ========================================
// INITIALIZE
// ========================================

createPoints();

startGame();