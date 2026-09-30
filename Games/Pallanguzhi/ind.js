const INITIAL_SEEDS = 5;

let cups = Array(14).fill(INITIAL_SEEDS);

let scores = {
    A: 0,
    B: 0
};

let currentPlayer = "A";

const cupElements = document.querySelectorAll(".cup");
const scoreA = document.getElementById("scoreA");
const scoreB = document.getElementById("scoreB");
const turnElement = document.querySelector(".turn span");
const banks = document.querySelectorAll(".bank strong");


// ===========================
// START GAME
// ===========================

function startGame() {

    cups = Array(14).fill(INITIAL_SEEDS);

    scores.A = 0;
    scores.B = 0;

    currentPlayer = "A";

    updateBoard();
}


// ===========================
// UPDATE SCREEN
// ===========================

function updateBoard() {

    cupElements.forEach(cup => {

        const index = Number(cup.dataset.index);

        cup.textContent = cups[index];

        cup.classList.remove("selected");

        const belongsToPlayer =
            currentPlayer === "A"
                ? index >= 0 && index <= 6
                : index >= 7 && index <= 13;

        cup.disabled = !belongsToPlayer || cups[index] === 0;

    });

    scoreA.textContent = scores.A;
    scoreB.textContent = scores.B;

    banks[0].textContent = scores.B;
    banks[1].textContent = scores.A;

    turnElement.textContent =
        `Player ${currentPlayer}'s Turn`;
}


// ===========================
// CLICK CUP
// ===========================

cupElements.forEach(cup => {

    cup.addEventListener("click", () => {

        const index = Number(cup.dataset.index);

        play(index);
    });

});


// ===========================
// PLAY
// ===========================

function play(index) {

    const valid =
        currentPlayer === "A"
            ? index <= 6
            : index >= 7;

    if (!valid) return;

    if (cups[index] === 0) return;

    sow(index);
}


// ===========================
// SOWING
// ===========================

function sow(startIndex) {

    let seeds = cups[startIndex];

    cups[startIndex] = 0;

    let position = startIndex;

    while (seeds > 0) {

        position++;

        if (position >= 14) {
            position = 0;
        }

        cups[position]++;

        seeds--;
    }

    capture(position);

    updateBoard();

    if (!hasMove(currentPlayer)) {

        finishGame();

        return;
    }

    currentPlayer =
        currentPlayer === "A"
            ? "B"
            : "A";

    updateBoard();
}


// ===========================
// CAPTURE
// ===========================

function capture(lastPosition) {

    const ownSide =
        currentPlayer === "A"
            ? lastPosition <= 6
            : lastPosition >= 7;

    if (!ownSide) return;

    // Last cup must contain only the newly
    // dropped seed.
    if (cups[lastPosition] !== 1) return;

    const opposite =
        lastPosition < 7
            ? lastPosition + 7
            : lastPosition - 7;

    if (cups[opposite] === 0) return;

    const captured =
        cups[lastPosition] +
        cups[opposite];

    cups[lastPosition] = 0;
    cups[opposite] = 0;

    scores[currentPlayer] += captured;
}


// ===========================
// VALID MOVE
// ===========================

function hasMove(player) {

    if (player === "A") {

        return cups
            .slice(0, 7)
            .some(seed => seed > 0);

    } else {

        return cups
            .slice(7, 14)
            .some(seed => seed > 0);
    }
}


// ===========================
// END GAME
// ===========================

function finishGame() {

    const remainingA =
        cups.slice(0, 7)
            .reduce((a, b) => a + b, 0);

    const remainingB =
        cups.slice(7, 14)
            .reduce((a, b) => a + b, 0);

    scores.A += remainingA;
    scores.B += remainingB;

    cups.fill(0);

    updateBoard();

    let message;

    if (scores.A > scores.B) {

        message =
            `Player A wins!\n\n` +
            `Player A: ${scores.A}\n` +
            `Player B: ${scores.B}`;

    } else if (scores.B > scores.A) {

        message =
            `Player B wins!\n\n` +
            `Player A: ${scores.A}\n` +
            `Player B: ${scores.B}`;

    } else {

        message =
            `It's a draw!\n\n` +
            `Player A: ${scores.A}\n` +
            `Player B: ${scores.B}`;
    }

    setTimeout(() => {
        alert(message);
    }, 100);
}


// ===========================
// NEW GAME
// ===========================

document
    .getElementById("newGame")
    .addEventListener("click", startGame);


startGame();