const board = document.getElementById("board");
const countText = document.getElementById("count");
const message = document.getElementById("message");

const gameMessages = {
    en: {
        selectPiece: "Select a piece to start",
        selectPoint: "Now select an empty point",
        moved: "Piece moved!",
        invalidMove: "Invalid move. Move along a line or jump over an occupied piece.",
        win: "🎉 YOU WIN!\nOnly 1 piece remains."
    },
    hi: {
        selectPiece: "शुरू करने के लिए एक गोटी चुनें",
        selectPoint: "अब खाली स्थान चुनें",
        moved: "गोटी चली!",
        invalidMove: "अमान्य चाल। रेखा पर चलें या भरी हुई गोटी के ऊपर से कूदें।",
        win: "🎉 आप जीत गए!\nकेवल 1 गोटी बची है।"
    }
};

function gameText(key) {
    const language = window.panchKoneLanguage || "en";
    return gameMessages[language][key];
}

const positions = [
    { x: 50, y: 8 },
    { x: 82, y: 30 },
    { x: 70, y: 72 },
    { x: 30, y: 72 },
    { x: 18, y: 30 },
    { x: 39, y: 30 },
    { x: 61, y: 30 },
    { x: 61, y: 50 },
    { x: 39, y: 50 },
    { x: 50, y: 50 },
    { x: 50, y: 92 }
];

let pieces = [0, 1, 2, 3, 4, 5, 6, 7, 8];

let selected = null;
let gameOver = false;

const lines = [
    [0, 5, 8, 3],
    [0, 6, 7, 4],
    [4, 5, 6, 1],
    [3, 8, 7, 2],
    [5, 9, 7],
    [6, 9, 8],
    [9, 10]
];

function createStarLines() {

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "1";

    lines.forEach(linePoints => {

        for (let i = 0; i < linePoints.length - 1; i++) {

            const p1 = positions[linePoints[i]];
            const p2 = positions[linePoints[i + 1]];

            const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            line.setAttribute("x1", p1.x + "%");
            line.setAttribute("y1", p1.y + "%");
            line.setAttribute("x2", p2.x + "%");
            line.setAttribute("y2", p2.y + "%");

            line.setAttribute("stroke", "#b96b25");
            line.setAttribute("stroke-width", "3");

            svg.appendChild(line);
        }
    });

    board.appendChild(svg);
}

function createBoard() {

    board.innerHTML = "";
    selected = null;

    createStarLines();

    positions.forEach((pos, index) => {

        const point = document.createElement("div");

        point.className = "point";

        point.style.position = "absolute";
        point.style.left = pos.x + "%";
        point.style.top = pos.y + "%";
        point.style.transform = "translate(-50%, -50%)";
        point.style.width = "14px";
        point.style.height = "14px";
        point.style.borderRadius = "50%";
        point.style.background = "#ffe08a";
        point.style.border = "2px solid #8b4513";
        point.style.zIndex = "3";

        board.appendChild(point);

        if (pieces.includes(index)) {

            const piece = document.createElement("div");

            piece.className = "piece";

            piece.style.position = "absolute";
            piece.style.left = pos.x + "%";
            piece.style.top = pos.y + "%";
            piece.style.transform = "translate(-50%, -50%)";
            piece.style.width = "38px";
            piece.style.height = "38px";
            piece.style.borderRadius = "50%";
            piece.style.background = "#ffb52e";
            piece.style.border = "3px solid #8b4513";
            piece.style.boxShadow =
                "0 3px 6px rgba(0,0,0,0.4)";
            piece.style.zIndex = "5";
            piece.style.cursor = "pointer";

            piece.dataset.position = index;

            piece.addEventListener("click", function () {
                selectPiece(index);
            });

            board.appendChild(piece);
        }
    });

    countText.textContent = pieces.length;
    message.textContent = gameText("selectPiece");
    message.style.whiteSpace = "";
}

function selectPiece(index) {

    if (gameOver) return;
    if (!pieces.includes(index)) return;

    selected = index;

    message.textContent = gameText("selectPoint");

    document.querySelectorAll(".piece").forEach(piece => {
        piece.style.transform = "translate(-50%, -50%)";
    });

    const selectedPiece = document.querySelector(
        `.piece[data-position="${index}"]`
    );

    if (selectedPiece) {
        selectedPiece.style.transform =
            "translate(-50%, -50%) scale(1.2)";
    }
}

function getJumpMiddle(start, destination) {
    for (const line of lines) {
        for (let index = 0; index <= line.length - 3; index++) {
            const first = line[index];
            const middle = line[index + 1];
            const last = line[index + 2];

            if (
                (first === start && last === destination) ||
                (last === start && first === destination)
            ) {
                return middle;
            }
        }
    }

    return null;
}

function isAdjacentMove(start, destination) {
    return lines.some(line =>
        line.some((position, index) =>
            (position === start && line[index + 1] === destination) ||
            (position === destination && line[index + 1] === start)
        )
    );
}

board.addEventListener("click", function (event) {

    if (gameOver || selected === null) return;

    if (
        event.target.classList.contains("piece") ||
        event.target.tagName === "line" ||
        event.target.tagName === "svg"
    ) {
        return;
    }

    const rect = board.getBoundingClientRect();

    const clickX =
        ((event.clientX - rect.left) / rect.width) * 100;

    const clickY =
        ((event.clientY - rect.top) / rect.height) * 100;

    let nearest = null;
    let distance = Infinity;

    positions.forEach((pos, index) => {

        const dx = clickX - pos.x;
        const dy = clickY - pos.y;

        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < distance) {
            distance = d;
            nearest = index;
        }
    });

    if (distance >= 10 || nearest === null || pieces.includes(nearest)) {
        return;
    }

    const jumpedPosition = getJumpMiddle(selected, nearest);
    const isCapture = jumpedPosition !== null;

    if (isCapture && !pieces.includes(jumpedPosition)) {
        message.textContent = gameText("invalidMove");
        return;
    }

    if (!isCapture && !isAdjacentMove(selected, nearest)) {
        message.textContent = gameText("invalidMove");
        return;
    }

    const source = selected;
    pieces = pieces.filter(position =>
        position !== source && (!isCapture || position !== jumpedPosition)
    );
    pieces.push(nearest);

    selected = null;
    createBoard();

    if (isCapture && pieces.length === 1) {
        gameOver = true;
        message.style.whiteSpace = "pre-line";
        message.textContent = gameText("win");
    } else {
        message.textContent = gameText("moved");
    }
});

function restartGame() {

    pieces = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    gameOver = false;

    createBoard();
}

createBoard();

function initializeHomeScreen() {
    const translations = {
        en: {
            title: "✦ PANCH KONE ✦",
            subtitle: "THE FIVE CORNERS GAME",
            welcome: "Welcome to Panch Kone",
            introduction: "Choose your pieces, plan your moves and clear the board by jumping over the opponent's pieces.",
            howToPlay: "HOW TO PLAY",
            chooseMode: "CHOOSE GAME MODE",
            vsAi: "VS AI",
            vsAiDescription: "Play against the computer",
            twoPlayers: "2 PLAYERS",
            twoPlayersDescription: "Local pass-and-play",
            fourPlayers: "4 PLAYERS",
            fourPlayersDescription: "Play with friends",
            choosePiece: "CHOOSE YOUR PIECE",
            gold: "GOLD",
            red: "RED",
            green: "GREEN",
            blue: "BLUE",
            settings: "SETTINGS",
            language: "LANGUAGE",
            sound: "SOUND",
            ambience: "AMBIENCE",
            on: "ON",
            off: "OFF",
            begin: "BEGIN THE GAME",
            home: "HOME",
            piecesRemaining: "Pieces Remaining:",
            restart: "Restart Game",
            tutorialTitle: "How to Play",
            tutorialSelect: "Select one of your pieces.",
            tutorialMove: "Choose a valid empty point on the board to move to.",
            tutorialJump: "Jump over a piece to remove it.",
            tutorialClear: "Clear the opponent's pieces.",
            tutorialWin: "The player who completes the objective wins.",
            close: "CLOSE",
            homeLabel: "Home",
            languageLabel: "Language"
        },
        hi: {
            title: "✦ पंच कोण ✦",
            subtitle: "पाँच कोनों का खेल",
            welcome: "पंच कोण में आपका स्वागत है",
            introduction: "अपनी गोटियाँ चुनें, चालों की योजना बनाएँ और विरोधी की गोटियों को कूदकर हटाएँ।",
            howToPlay: "कैसे खेलें",
            chooseMode: "खेल का तरीका चुनें",
            vsAi: "कंप्यूटर के साथ",
            vsAiDescription: "कंप्यूटर के विरुद्ध खेलें",
            twoPlayers: "2 खिलाड़ी",
            twoPlayersDescription: "एक ही डिवाइस पर बारी-बारी से",
            fourPlayers: "4 खिलाड़ी",
            fourPlayersDescription: "दोस्तों के साथ खेलें",
            choosePiece: "अपनी गोटी चुनें",
            gold: "सुनहरा",
            red: "लाल",
            green: "हरा",
            blue: "नीला",
            settings: "सेटिंग्स",
            language: "भाषा",
            sound: "ध्वनि",
            ambience: "पृष्ठभूमि संगीत",
            on: "चालू",
            off: "बंद",
            begin: "खेल शुरू करें",
            home: "होम",
            piecesRemaining: "बची हुई गोटियाँ:",
            restart: "फिर से शुरू करें",
            tutorialTitle: "कैसे खेलें",
            tutorialSelect: "अपनी एक गोटी चुनें।",
            tutorialMove: "चाल चलने के लिए बोर्ड पर खाली स्थान चुनें।",
            tutorialJump: "गोटी हटाने के लिए उसके ऊपर से कूदें।",
            tutorialClear: "विरोधी की गोटियाँ हटाएँ।",
            tutorialWin: "उद्देश्य पूरा करने वाला खिलाड़ी जीतता है।",
            close: "बंद करें",
            homeLabel: "होम",
            languageLabel: "भाषा"
        }
    };

    const homeScreen = document.getElementById("home-screen");
    const gameScreen = document.getElementById("game-screen");
    const tutorialModal = document.getElementById("tutorial-modal");
    const soundToggle = document.getElementById("sound-toggle");
    const ambienceToggle = document.getElementById("ambience-toggle");
    const languageSelect = document.getElementById("language-select");
    let audioContext = null;
    let ambienceOscillators = [];

    window.panchKoneLanguage = "en";

    function applyLanguage(language) {
        window.panchKoneLanguage = language;
        document.documentElement.lang = language;

        document.querySelectorAll("[data-i18n]").forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = translations[language][key];
        });

        document.getElementById("home-button").setAttribute(
            "aria-label",
            translations[language].homeLabel
        );
        languageSelect.setAttribute("aria-label", translations[language].languageLabel);
        soundToggle.nextElementSibling.textContent =
            soundToggle.checked ? translations[language].on : translations[language].off;
        ambienceToggle.nextElementSibling.textContent =
            ambienceToggle.checked ? translations[language].on : translations[language].off;
        message.textContent = gameText("selectPiece");
    }

    function setSelectedCard(cards, selectedCard) {
        cards.forEach(card => {
            const isSelected = card === selectedCard;
            card.classList.toggle("is-selected", isSelected);
            card.setAttribute("aria-pressed", String(isSelected));
        });
    }

    function selectPieceColor(color) {
        const colors = {
            gold: ["#ffb52e", "#8b4513"],
            red: ["#ef655e", "#7c211e"],
            green: ["#67bd78", "#245c32"],
            blue: ["#69aef1", "#234f7c"]
        };
        const [fill, border] = colors[color];
        document.documentElement.style.setProperty("--piece-color", fill);
        document.documentElement.style.setProperty("--piece-border", border);
    }

    function getAudioContext() {
        if (!audioContext) {
            const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextConstructor) return null;
            audioContext = new AudioContextConstructor();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        return audioContext;
    }

    function playUiSound() {
        const context = getAudioContext();
        if (!context) return;

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(660, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.07);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    function startAmbience() {
        const context = getAudioContext();
        if (!context || ambienceOscillators.length > 0) return;

        [110, 164.81].forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.value = index === 0 ? 0.012 : 0.006;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            ambienceOscillators.push(oscillator);
        });
    }

    function stopAmbience() {
        ambienceOscillators.forEach(oscillator => oscillator.stop());
        ambienceOscillators = [];
    }

    document.querySelectorAll(".mode-card").forEach(card => {
        card.addEventListener("click", () => {
            setSelectedCard(document.querySelectorAll(".mode-card"), card);
        });
    });

    document.querySelectorAll(".piece-card").forEach(card => {
        card.addEventListener("click", () => {
            setSelectedCard(document.querySelectorAll(".piece-card"), card);
            selectPieceColor(card.dataset.piece);
        });
    });

    languageSelect.addEventListener("change", () => {
        applyLanguage(languageSelect.value);
    });

    soundToggle.addEventListener("change", () => {
        soundToggle.nextElementSibling.textContent =
            soundToggle.checked ? translations[window.panchKoneLanguage].on : translations[window.panchKoneLanguage].off;
    });

    ambienceToggle.addEventListener("change", () => {
        ambienceToggle.nextElementSibling.textContent =
            ambienceToggle.checked ? translations[window.panchKoneLanguage].on : translations[window.panchKoneLanguage].off;
        if (ambienceToggle.checked) startAmbience();
        else stopAmbience();
    });

    document.getElementById("begin-button").addEventListener("click", () => {
        homeScreen.hidden = true;
        gameScreen.hidden = false;
    });

    document.getElementById("home-button").addEventListener("click", () => {
        gameScreen.hidden = true;
        homeScreen.hidden = false;
    });

    document.getElementById("restart-button").addEventListener("click", restartGame);

    document.getElementById("tutorial-button").addEventListener("click", () => {
        tutorialModal.hidden = false;
        document.getElementById("close-tutorial").focus();
    });

    function closeTutorial() {
        tutorialModal.hidden = true;
        document.getElementById("tutorial-button").focus();
    }

    document.getElementById("close-tutorial").addEventListener("click", closeTutorial);
    tutorialModal.addEventListener("click", event => {
        if (event.target === tutorialModal) closeTutorial();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !tutorialModal.hidden) closeTutorial();
    });

    document.addEventListener("click", event => {
        if (!event.target.closest("button, select, input")) return;
        if (soundToggle.checked) playUiSound();
        if (ambienceToggle.checked) startAmbience();
    });

    applyLanguage("en");
    selectPieceColor("gold");
}

initializeHomeScreen();