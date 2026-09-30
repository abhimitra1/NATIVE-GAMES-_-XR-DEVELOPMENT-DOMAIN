let selectedMode = "AI";
let selectedSide = "White";


// ===============================
// GAME MODE
// ===============================

function selectMode(card, mode) {

    document.querySelectorAll(".game-card").forEach(function(item) {
        item.classList.remove("selected");
    });

    card.classList.add("selected");

    selectedMode = mode;
}


// ===============================
// PLAYER SIDE
// ===============================

function selectSide(card, side) {

    document.querySelectorAll(".side-card").forEach(function(item) {
        item.classList.remove("selected");
    });

    card.classList.add("selected");

    selectedSide = side;
}


// ===============================
// HOW TO PLAY
// ===============================

function showHowToPlay() {

    document.getElementById("howToPlay").classList.add("show");
}


function closeHowToPlay() {

    document.getElementById("howToPlay").classList.remove("show");
}


// ===============================
// SOUND
// ===============================

const soundToggle = document.getElementById("soundToggle");

if (soundToggle) {

    soundToggle.addEventListener("change", function() {

        const soundText =
            document.getElementById("soundText");

        if (soundToggle.checked) {
            soundText.textContent = "ON";
        } else {
            soundText.textContent = "OFF";
        }

    });

}


// ===============================
// START GAME
// ===============================

function startGame() {

    console.log("START GAME BUTTON CLICKED");

    localStorage.setItem(
        "gameMode",
        selectedMode
    );

    localStorage.setItem(
        "playerSide",
        selectedSide
    );

    window.location.href = "game.html";
}