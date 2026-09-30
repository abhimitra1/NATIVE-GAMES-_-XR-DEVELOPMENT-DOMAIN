// ======================================================
// CHATURANGA GAME
// ======================================================


// ======================================================
// HTML ELEMENTS
// ======================================================

const board = document.getElementById("board");

const statusText = document.getElementById("status");

const messageText = document.getElementById("message");


// ======================================================
// STARTING BOARD
// ======================================================

const startingPieces = [

    ["R", "H", "E", "M", "K", "E", "H", "R"],

    ["P", "P", "P", "P", "P", "P", "P", "P"],

    ["", "", "", "", "", "", ""],

    ["", "", "", "", "", "", ""],

    ["", "", "", "", "", "", ""],

    ["", "", "", "", "", "", ""],

    ["p", "p", "p", "p", "p", "p", "p", "p"],

    ["r", "h", "e", "k", "m", "e", "h", "r"]

];


// ======================================================
// GAME VARIABLES
// ======================================================

let pieces = copyBoard(startingPieces);

let currentPlayer = "white";

let selectedRow = null;

let selectedCol = null;

let gameOver = false;


// ======================================================
// COPY BOARD
// ======================================================

function copyBoard(boardData) {

    return boardData.map(function(row) {

        return [...row];

    });

}


// ======================================================
// PIECE SYMBOLS
// ======================================================

function getPieceSymbol(piece) {

    const symbols = {

        // White

        "K": "♔",
        "M": "♕",
        "E": "♗",
        "H": "♘",
        "R": "♖",
        "P": "♙",

        // Black

        "k": "♚",
        "m": "♛",
        "e": "♝",
        "h": "♞",
        "r": "♜",
        "p": "♟"

    };

    return symbols[piece] || "";

}


// ======================================================
// CREATE BOARD
// ======================================================

function createBoard() {

    board.innerHTML = "";


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");


            // Add square class

            square.classList.add("square");


            // Board colors

            if ((row + col) % 2 === 0) {

                square.classList.add("light");

            } else {

                square.classList.add("dark");

            }


            // Add piece

            square.textContent =
                getPieceSymbol(
                    pieces[row][col]
                );


            // Selected square

            if (
                selectedRow === row &&
                selectedCol === col
            ) {

                square.classList.add("selected");

            }


            // Click square

            square.addEventListener(
                "click",
                function() {

                    handleClick(row, col);

                }
            );


            board.appendChild(square);

        }

    }


    updateStatus();

}


// ======================================================
// HANDLE CLICK
// ======================================================

function handleClick(row, col) {

    // Don't allow moves after game over

    if (gameOver) {

        return;

    }


    const piece = pieces[row][col];


    // ==================================================
    // SELECT PIECE
    // ==================================================

    if (selectedRow === null) {


        // Empty square

        if (piece === "") {

            return;

        }


        // Wrong player's piece

        if (
            !isPieceOfCurrentPlayer(piece)
        ) {

            return;

        }


        // Select piece

        selectedRow = row;

        selectedCol = col;


        createBoard();

        return;

    }


    // ==================================================
    // CLICK SELECTED PIECE AGAIN
    // ==================================================

    if (
        selectedRow === row &&
        selectedCol === col
    ) {

        selectedRow = null;

        selectedCol = null;

        createBoard();

        return;

    }


    // ==================================================
    // TRY TO MOVE
    // ==================================================

    const moved = tryMove(
        selectedRow,
        selectedCol,
        row,
        col
    );


    if (moved) {

        // Remove selection

        selectedRow = null;

        selectedCol = null;


        // Change turn

        changeTurn();


        // Draw board

        createBoard();


        // Check game

        checkGameStatus();

    } else {


        // Clicked another own piece

        if (
            piece !== "" &&
            isPieceOfCurrentPlayer(piece)
        ) {

            selectedRow = row;

            selectedCol = col;

            createBoard();

        }

    }

}


// ======================================================
// CHECK CURRENT PLAYER PIECE
// ======================================================

function isPieceOfCurrentPlayer(piece) {

    if (piece === "") {

        return false;

    }


    if (currentPlayer === "white") {

        return piece ===
            piece.toUpperCase();

    }


    return piece ===
        piece.toLowerCase();

}


// ======================================================
// CHECK PIECE COLOR
// ======================================================

function isPieceOfColor(piece, color) {

    if (piece === "") {

        return false;

    }


    if (color === "white") {

        return piece ===
            piece.toUpperCase();

    }


    return piece ===
        piece.toLowerCase();

}


// ======================================================
// SAME COLOR
// ======================================================

function sameColor(piece1, piece2) {

    return (
        isPieceOfColor(piece1, "white") ===
        isPieceOfColor(piece2, "white")
    );

}


// ======================================================
// TRY MOVE
// ======================================================

function tryMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        pieces[fromRow][fromCol];

    const target =
        pieces[toRow][toCol];


    // Cannot capture own piece

    if (
        target !== "" &&
        sameColor(piece, target)
    ) {

        return false;

    }


    // Check movement

    if (
        !isValidMovement(
            fromRow,
            fromCol,
            toRow,
            toCol
        )
    ) {

        return false;

    }


    // Save board

    const oldBoard =
        copyBoard(pieces);


    // Make move

    pieces[toRow][toCol] = piece;

    pieces[fromRow][fromCol] = "";


    // Check own king

    if (
        isKingInCheck(currentPlayer)
    ) {

        // Undo move

        pieces = oldBoard;

        return false;

    }


    return true;

}


// ======================================================
// VALID MOVEMENT
// ======================================================

function isValidMovement(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        pieces[fromRow][fromCol];


    if (piece === "") {

        return false;

    }


    // Difference

    const rowDifference =
        Math.abs(
            toRow - fromRow
        );

    const colDifference =
        Math.abs(
            toCol - fromCol
        );


    // Same square

    if (
        rowDifference === 0 &&
        colDifference === 0
    ) {

        return false;

    }


    // ==================================================
    // KING
    // ==================================================

    if (
        piece.toLowerCase() === "k"
    ) {

        return (
            rowDifference <= 1 &&
            colDifference <= 1
        );

    }


    // ==================================================
    // MINISTER
    // ==================================================

    if (
        piece.toLowerCase() === "m"
    ) {

        return (
            rowDifference === 1 &&
            colDifference === 1
        );

    }


    // ==================================================
    // ELEPHANT
    // ==================================================

    if (
        piece.toLowerCase() === "e"
    ) {

        return (
            rowDifference === 2 &&
            colDifference === 2
        );

    }


    // ==================================================
    // HORSE
    // ==================================================

    if (
        piece.toLowerCase() === "h"
    ) {

        return (

            (
                rowDifference === 2 &&
                colDifference === 1
            )

            ||

            (
                rowDifference === 1 &&
                colDifference === 2
            )

        );

    }


    // ==================================================
    // CHARIOT
    // ==================================================

    if (
        piece.toLowerCase() === "r"
    ) {


        // Must move straight

        if (
            rowDifference !== 0 &&
            colDifference !== 0
        ) {

            return false;

        }


        // Vertical movement

        if (colDifference === 0) {

            const direction =
                toRow > fromRow
                    ? 1
                    : -1;


            for (
                let row = fromRow + direction;

                row !== toRow;

                row += direction
            ) {

                if (
                    pieces[row][fromCol] !== ""
                ) {

                    return false;

                }

            }


            return true;

        }


        // Horizontal movement

        if (rowDifference === 0) {

            const direction =
                toCol > fromCol
                    ? 1
                    : -1;


            for (
                let col = fromCol + direction;

                col !== toCol;

                col += direction
            ) {

                if (
                    pieces[fromRow][col] !== ""
                ) {

                    return false;

                }

            }


            return true;

        }

    }


    // ==================================================
    // PAWN
    // ==================================================

    if (
        piece.toLowerCase() === "p"
    ) {


        // WHITE PAWN

        if (piece === "P") {


            // Move forward

            if (
                toRow === fromRow + 1 &&
                toCol === fromCol &&
                pieces[toRow][toCol] === ""
            ) {

                return true;

            }


            // Capture diagonally

            if (
                toRow === fromRow + 1 &&
                colDifference === 1 &&
                pieces[toRow][toCol] !== "" &&
                !sameColor(
                    piece,
                    pieces[toRow][toCol]
                )
            ) {

                return true;

            }

        }


        // BLACK PAWN

        else {


            // Move forward

            if (
                toRow === fromRow - 1 &&
                toCol === fromCol &&
                pieces[toRow][toCol] === ""
            ) {

                return true;

            }


            // Capture diagonally

            if (
                toRow === fromRow - 1 &&
                colDifference === 1 &&
                pieces[toRow][toCol] !== "" &&
                !sameColor(
                    piece,
                    pieces[toRow][toCol]
                )
            ) {

                return true;

            }

        }

    }


    return false;

}


// ======================================================
// CHANGE TURN
// ======================================================

function changeTurn() {

    if (currentPlayer === "white") {

        currentPlayer = "black";

    } else {

        currentPlayer = "white";

    }

}


// ======================================================
// FIND KING
// ======================================================

function findKing(color) {

    const king =
        color === "white"
            ? "K"
            : "k";


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            if (
                pieces[row][col] === king
            ) {

                return {
                    row: row,
                    col: col
                };

            }

        }

    }


    return null;

}


// ======================================================
// KING IN CHECK
// ======================================================

function isKingInCheck(color) {

    const king =
        findKing(color);


    // King has been captured

    if (!king) {

        return true;

    }


    const opponent =
        color === "white"
            ? "black"
            : "white";


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                pieces[row][col];


            if (piece === "") {

                continue;

            }


            if (
                !isPieceOfColor(
                    piece,
                    opponent
                )
            ) {

                continue;

            }


            if (
                isValidMovementForCheck(
                    row,
                    col,
                    king.row,
                    king.col
                )
            ) {

                return true;

            }

        }

    }


    return false;

}


// ======================================================
// MOVEMENT USED FOR CHECK
// ======================================================

function isValidMovementForCheck(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        pieces[fromRow][fromCol];


    const rowDifference =
        Math.abs(
            toRow - fromRow
        );

    const colDifference =
        Math.abs(
            toCol - fromCol
        );


    // KING

    if (
        piece.toLowerCase() === "k"
    ) {

        return (
            rowDifference <= 1 &&
            colDifference <= 1 &&
            rowDifference + colDifference > 0
        );

    }


    // MINISTER

    if (
        piece.toLowerCase() === "m"
    ) {

        return (
            rowDifference === 1 &&
            colDifference === 1
        );

    }


    // ELEPHANT

    if (
        piece.toLowerCase() === "e"
    ) {

        return (
            rowDifference === 2 &&
            colDifference === 2
        );

    }


    // HORSE

    if (
        piece.toLowerCase() === "h"
    ) {

        return (

            (
                rowDifference === 2 &&
                colDifference === 1
            )

            ||

            (
                rowDifference === 1 &&
                colDifference === 2
            )

        );

    }


    // CHARIOT

    if (
        piece.toLowerCase() === "r"
    ) {


        if (
            rowDifference !== 0 &&
            colDifference !== 0
        ) {

            return false;

        }


        // Vertical

        if (colDifference === 0) {

            const direction =
                toRow > fromRow
                    ? 1
                    : -1;


            for (
                let row = fromRow + direction;

                row !== toRow;

                row += direction
            ) {

                if (
                    pieces[row][fromCol] !== ""
                ) {

                    return false;

                }

            }


            return true;

        }


        // Horizontal

        if (rowDifference === 0) {

            const direction =
                toCol > fromCol
                    ? 1
                    : -1;


            for (
                let col = fromCol + direction;

                col !== toCol;

                col += direction
            ) {

                if (
                    pieces[fromRow][col] !== ""
                ) {

                    return false;

                }

            }


            return true;

        }

    }


    // PAWN

    if (
        piece.toLowerCase() === "p"
    ) {

        if (piece === "P") {

            return (
                toRow === fromRow + 1 &&
                colDifference === 1
            );

        } else {

            return (
                toRow === fromRow - 1 &&
                colDifference === 1
            );

        }

    }


    return false;

}


// ======================================================
// CHECK FOR ANY LEGAL MOVE
// ======================================================

function hasAnyLegalMove(color) {

    for (
        let fromRow = 0;
        fromRow < 8;
        fromRow++
    ) {

        for (
            let fromCol = 0;
            fromCol < 8;
            fromCol++
        ) {

            const piece =
                pieces[fromRow][fromCol];


            if (piece === "") {

                continue;

            }


            if (
                !isPieceOfColor(
                    piece,
                    color
                )
            ) {

                continue;

            }


            for (
                let toRow = 0;
                toRow < 8;
                toRow++
            ) {

                for (
                    let toCol = 0;
                    toCol < 8;
                    toCol++
                ) {


                    if (
                        !isValidMovement(
                            fromRow,
                            fromCol,
                            toRow,
                            toCol
                        )
                    ) {

                        continue;

                    }


                    const target =
                        pieces[toRow][toCol];


                    if (
                        target !== "" &&
                        sameColor(
                            piece,
                            target
                        )
                    ) {

                        continue;

                    }


                    const oldBoard =
                        copyBoard(pieces);


                    pieces[toRow][toCol] =
                        piece;

                    pieces[fromRow][fromCol] =
                        "";


                    const safe =
                        !isKingInCheck(color);


                    pieces =
                        oldBoard;


                    if (safe) {

                        return true;

                    }

                }

            }

        }

    }


    return false;

}


// ======================================================
// GAME STATUS
// ======================================================

function checkGameStatus() {

    if (
        isKingInCheck(currentPlayer)
    ) {


        if (
            !hasAnyLegalMove(
                currentPlayer
            )
        ) {

            gameOver = true;


            const winner =
                currentPlayer === "white"
                    ? "Black"
                    : "White";


            statusText.textContent =
                "GAME OVER";


            messageText.textContent =
                winner +
                " wins by Checkmate!";


            return;

        }


        messageText.textContent =
            currentPlayer +
            " King is in CHECK!";


        return;

    }


    updateStatus();

}


// ======================================================
// UPDATE STATUS
// ======================================================

function updateStatus() {

    if (gameOver) {

        return;

    }


    if (
        currentPlayer === "white"
    ) {

        statusText.textContent =
            "White's Turn";

    } else {

        statusText.textContent =
            "Black's Turn";

    }


    if (
        isKingInCheck(currentPlayer)
    ) {

        messageText.textContent =
            currentPlayer +
            " King is in CHECK!";

    } else {

        messageText.textContent = "";

    }

}


// ======================================================
// RESTART GAME
// ======================================================

function restartGame() {

    // Reset board

    pieces =
        copyBoard(startingPieces);


    // White starts

    currentPlayer =
        "white";


    // Remove selection

    selectedRow = null;

    selectedCol = null;


    // Game active

    gameOver = false;


    // Reset text

    statusText.textContent =
        "White's Turn";

    messageText.textContent = "";


    // Draw fresh board

    createBoard();

}


// ======================================================
// START GAME
// ======================================================

createBoard();