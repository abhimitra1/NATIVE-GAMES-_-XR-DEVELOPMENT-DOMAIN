// Chauka Bara Engine & Page Controller

const PATH_5X5 = [
    // Outer Ring (16)
    [4, 2], [4, 1], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1],
    [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3],
    // Inner Ring (8)
    [3, 3], [3, 2], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [2, 3],
    // Home (1)
    [2, 2]
];

const PATH_7X7 = [
    // Outer Ring (24)
    [6, 3], [6, 2], [6, 1], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2],
    [0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4],
    // Middle Ring (16)
    [5, 4], [5, 3], [5, 2], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
    // Inner Ring (8)
    [4, 4], [4, 3], [4, 2], [3, 2], [2, 2], [2, 3], [2, 4], [3, 4],
    // Home (1)
    [3, 3]
];


// ==================== FORMAL FINITE STATE MACHINE ENUM ====================
const GameState = {
    BOOT: 'BOOT',
    MAIN_MENU: 'MAIN_MENU',
    SETUP: 'SETUP',
    ROLL_PENDING: 'ROLL_PENDING',
    MOVE_PENDING: 'MOVE_PENDING',
    ANIMATING: 'ANIMATING',
    NEXT_PLAYER: 'NEXT_PLAYER',
    GAME_OVER: 'GAME_OVER',
    PAUSED: 'PAUSED'
};

const DEFAULT_COLORS = ['red', 'blue', 'yellow', 'green'];
const TRADITIONAL_PLAYER_NAMES = [
    { hindi: 'सिन्दूर', eng: 'Sindoor' },
    { hindi: 'मयूर', eng: 'Mayur' },
    { hindi: 'हल्दी', eng: 'Haldi' },
    { hindi: 'नील', eng: 'Neel' }
];

class SoundFx {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
    }

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        return this.muted;
    }

    vibrate(pattern) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    roll() {
        this.init();
        this.vibrate([20, 30, 20]);
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Multi-hit cowrie shell rattle clatter sound
        for (let i = 0; i < 5; i++) {
            const delay = i * 0.04 + Math.random() * 0.02;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freq = 750 + Math.random() * 950;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(120, now + delay + 0.07);

            gain.gain.setValueAtTime(0.28, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        }

        // Settling wood tray thud
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(190, now + 0.22);
        thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
        thudGain.gain.setValueAtTime(0.3, now + 0.22);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        thudOsc.connect(thudGain);
        thudGain.connect(this.ctx.destination);
        thudOsc.start(now + 0.22);
        thudOsc.stop(now + 0.36);
    }

    move() {
        this.init();
        this.vibrate(15);
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    capture() {
        this.init();
        this.vibrate([60, 40, 90]);
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Low drum strike
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.38);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.39);

        // High ghungroo bell chime
        const bell = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1300, now);
        bell.frequency.exponentialRampToValueAtTime(850, now + 0.28);
        bGain.gain.setValueAtTime(0.2, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        bell.connect(bGain);
        bGain.connect(this.ctx.destination);
        bell.start(now);
        bell.stop(now + 0.29);
    }

    win() {
        this.init();
        this.vibrate([100, 50, 100, 50, 150]);
        if (this.muted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.48);
        });
    }
}


const TRANSLATIONS = {
    en: {
        selectLangLabel: "🌐 Select Language:",
        title: "CHAUKA BARA",
        tagline: "Chowka Bhara — The Traditional Cowrie Race of Destiny",
        heritageBadge: "✨ ANCIENT HERITAGE",
        aboutTitle: "📜 ABOUT THE GAME",
        tabOrigin: "🏛️ Origin",
        tabCowrie: "🐚 Cowries",
        tabRules: "🛡️ Safe & Capture",
        tabGoal: "🏆 Goal",
        originP1: "<strong>Chauka Bara</strong> (also known as <em>Chowka Bhara</em>, <em>Ashta Chamma</em>, or <em>Kavade Kali</em>) is one of India's oldest strategic race games, played on a sacred square grid with natural cowrie shells as dice.",
        originHighlightTitle: "✨ ANCIENT HERITAGE",
        originHighlightText: "Played for centuries across Indian households, combining tactical movement, blocking, risk management, and cowrie probability!",
        cowrieIntro: "Four natural cowrie shells are thrown on the square tray. Count the <strong>Mouth-Up</strong> shells:",
        cowrie4: "4 Up = 4 Steps",
        cowrie0: "0 Up = 8 Steps",
        cowrie1: "1 Up = 1 Step",
        cowrie2: "2 Up = 2 Steps",
        cowrie3: "3 Up = 3 Steps",
        bonusRollText: "✨ Bonus Roll",
        safeTitle: "Safe Cross Squares (X):",
        safeDesc: "Squares with cross hatchings are sanctuaries. Multiple pawns from any player can share safe squares without risk.",
        captureTitle: "Capturing Pawns:",
        captureDesc: "Landing on an unprotected opponent pawn captures it, sending it back to start and earning a <strong>Bonus Roll</strong>!",
        goalIntro: "Tokens race counter-clockwise around outer rings before turning inward to the central <strong>HOME</strong> house.",
        goalBanner: "🏆 First player to get all 4 pawns inside HOME wins!",
        setupTitle: "🎮 SETUP YOUR MATCH",
        lblGameMode: "SELECT GAME MODE",
        modeVsAI: "Vs AI",
        descVsAI: "1 Player vs Computer",
        mode2P: "2 Players",
        desc2P: "Local Pass & Play",
        mode4P: "4 Players",
        desc4P: "4-Way Free For All",
        mode2v2: "2v2 Team",
        desc2v2: "Partnership Match",
        lblBoardGrid: "SELECT BOARD GRID",
        grid5: "5×5 Grid (Primary)",
        desc5: "25 Squares • Fast Track",
        grid7: "7×7 Grid",
        desc7: "49 Squares • Extended Track",
        lblAIDiff: "AI DIFFICULTY",
        diffEasy: "Easy",
        diffMedium: "Medium",
        diffHard: "Hard",
        lblPawnColors: "CHOOSE PAWN COLORS",
        p1Label: "Player 1 (Bottom):",
        p2Label: "Player 2 (Left):",
        p3Label: "Player 3 (Top):",
        p4Label: "Player 4 (Right):",
        beginGame: "🚀 BEGIN GAME",
        mainMenuBtn: "🏠 MAIN MENU",
        headerBadge5: "5×5 CLASSIC GRID",
        headerBadge7: "7×7 EXTENDED GRID",
        diceTrayTitle: "🎲 COWRIE THROW TRAY",
        rollResultLabel: "Roll Result Steps",
        btnRoll: "🎲 THROW COWRIES",
        turnTitle: "CURRENT TURN",
        msgRollPrompt: "Roll the Cowrie Shells!",
        msgAIThinking: "AI is thinking...",
        msgSelectToken: "Select glowing token!",
        msgAISelecting: "AI selecting token...",
        msgNoLegalMoves: "No legal moves available!",
        msgBonusRoll: "Bonus Roll Awarded!",
        msgPaused: "Game Paused",
        moveLogTitle: "MOVE LOG",
        logStarted: "Match Started! All pawns placed in starting home houses.",
        rulesModalTitle: "📖 BEGINNER'S GUIDE TO CHAUKA BARA",
        rulesSubtext: "Learn the ancient heritage cowrie race in simple visual steps!",
        playerPrefix: "Player",
        pawnPrefix: "P",
        pauseTitle: "⏸️ GAME PAUSED",
        pauseSubtext: "Take a breather or adjust match settings!",
        btnResumeGame: "▶️ RESUME GAME",
        btnRestartPause: "🔄 RESTART MATCH",
        btnQuitMenu: "🏠 QUIT TO MAIN MENU",
        victoryTitle: "🎉 VICTORY! 🎉",
        btnPlayAgain: "PLAY AGAIN"
    },
    hi: {
        selectLangLabel: "🌐 भाषा चुनें (Select Language):",
        title: "चौका बारा",
        tagline: "चौका भारा — प्राचीन भारतीय कौड़ी दौड़ खेल",
        heritageBadge: "✨ प्राचीन भारतीय विरासत",
        aboutTitle: "📜 खेल के बारे में",
        tabOrigin: "🏛️ उत्पत्ति",
        tabCowrie: "🐚 कौड़ियां",
        tabRules: "🛡️ सुरक्षित व काटना",
        tabGoal: "🏆 लक्ष्य",
        originP1: "<strong>चौका बारा</strong> (जिसे <em>चौका भारा</em>, <em>अष्टा चम्मा</em> या <em>कवड़े काली</em> भी कहा जाता है) भारत के सबसे पुराने रणनीतिक रेस खेलों में से एक है, जो प्राकृतिक कौड़ियों के साथ खेला जाता है।",
        originHighlightTitle: "✨ प्राचीन विरासत",
        originHighlightText: "भारतीय घरों में सदियों से खेला जाने वाला खेल, जिसमें रणनीति, गोटी काटना और कौड़ियों का भाग्य शामिल है!",
        cowrieIntro: "थाल में चार प्राकृतिक कौड़ियां फेंकी जाती हैं। <strong>खुले मुंह (Mouth-Up)</strong> वाली कौड़ियों को गिनें:",
        cowrie4: "4 खुले = 4 कदम",
        cowrie0: "0 खुले = 8 कदम",
        cowrie1: "1 खुला = 1 कदम",
        cowrie2: "2 खुले = 2 कदम",
        cowrie3: "3 खुले = 3 कदम",
        bonusRollText: "✨ बोनस दांव",
        safeTitle: "सुरक्षित क्रास वर्ग (X):",
        safeDesc: "क्रास निशान वाले खाने सुरक्षित स्थान हैं। यहां किसी भी खिलाड़ी की गोटियां सुरक्षित रहती हैं।",
        captureTitle: "गोटी काटना (Capture):",
        captureDesc: "असुरक्षित विपक्षी गोटी के खाने पर उतरने पर वह कटकर घर लौट जाती है और आपको <strong>बोनस दांव</strong> मिलता है!",
        goalIntro: "गोटियां बाहरी चक्कर लगाकर अंदर की ओर घूमते हुए केंद्रीय <strong>घर (HOME)</strong> तक पहुंचती हैं।",
        goalBanner: "🏆 अपनी चारों गोटियों को सबसे पहले घर पहुंचाने वाला खिलाड़ी विजेता बनता है!",
        setupTitle: "🎮 मैच सेट करें",
        lblGameMode: "गेम मोड चुनें",
        modeVsAI: "कंप्यूटर से (Vs AI)",
        descVsAI: "1 खिलाड़ी बनाम कंप्यूटर",
        mode2P: "2 खिलाड़ी",
        desc2P: "पास एंड प्ले",
        mode4P: "4 खिलाड़ी",
        desc4P: "4-खिलाड़ी मुकाबला",
        mode2v2: "2v2 टीम",
        desc2v2: "पार्टनरशिप मैच",
        lblBoardGrid: "बोर्ड ग्रिड चुनें",
        grid5: "5×5 ग्रिड (प्राथमिक)",
        desc5: "25 खाने • तेज़ ट्रैक",
        grid7: "7×7 ग्रिड",
        desc7: "49 खाने • विस्तृत ट्रैक",
        lblAIDiff: "एआई कठिनाई",
        diffEasy: "आसान",
        diffMedium: "मध्यम",
        diffHard: "कठिन",
        lblPawnColors: "गोटी के रंग चुनें",
        p1Label: "खिलाड़ी 1 (नीचे):",
        p2Label: "खिलाड़ी 2 (बाएं):",
        p3Label: "खिलाड़ी 3 (ऊपर):",
        p4Label: "खिलाड़ी 4 (दाएं):",
        beginGame: "🚀 खेल शुरू करें",
        mainMenuBtn: "🏠 मुख्य मेनू",
        headerBadge5: "5×5 क्लासिक ग्रिड",
        headerBadge7: "7×7 विस्तृत ग्रिड",
        diceTrayTitle: "🎲 कौड़ी फेंकने का थाल",
        rollResultLabel: "दांव के कदम",
        btnRoll: "🎲 कौड़ियां फेंकें",
        turnTitle: "वर्तमान बारी",
        msgRollPrompt: "कौड़ियां फेंकें! (Space)",
        msgAIThinking: "कंप्यूटर सोच रहा है...",
        msgSelectToken: "चमकती गोटी चुनें! (Keys 1-4)",
        msgAISelecting: "कंप्यूटर गोटी चुन रहा है...",
        msgNoLegalMoves: "कोई वैध चाल उपलब्ध नहीं है!",
        msgBonusRoll: "बोनस दांव मिला!",
        msgPaused: "खेल रुका हुआ है",
        moveLogTitle: "चाल विवरण",
        logStarted: "मैच शुरू हुआ! सभी गोटियां शुरुआती घर में स्थित हैं।",
        rulesModalTitle: "📖 चौका बारा गाइड",
        rulesSubtext: "आसान चरणों में पारंपरिक खेल सीखें!",
        playerPrefix: "खिलाड़ी",
        pawnPrefix: "ग",
        pauseTitle: "⏸️ खेल रुका है",
        pauseSubtext: "थोड़ा विश्राम करें या सेटिंग्स बदलें!",
        btnResumeGame: "▶️ खेल जारी रखें",
        btnRestartPause: "🔄 मैच पुनः शुरू करें",
        btnQuitMenu: "🏠 मुख्य मेनू पर जाएं",
        victoryTitle: "🎉 विजय! 🎉",
        btnPlayAgain: "पुनः खेलें"
    },
    te_ap: {
        selectLangLabel: "🌐 భాష ఎంచుకోండి (AP):",
        title: "అష్టా చమ్మ (ఆంధ్రా)",
        tagline: "చౌకా బారా — ఆంధ్రప్రదేశ్ సాంప్రదాయ గవ్వల ఆట",
        heritageBadge: "✨ ఆంధ్రా సాంప్రదాయ క్రీడ",
        aboutTitle: "📜 ఆట గురించి",
        tabOrigin: "🏛️ మూలం",
        tabCowrie: "🐚 గవ్వలు",
        tabRules: "🛡️ సురక్షితం & గుడ్డి",
        tabGoal: "🏆 గమ్యం",
        originP1: "<strong>అష్టా చమ్మ / చౌకా బారా</strong> ఆంధ్రప్రదేశ్‌లో అత్యంత ప్రజాదరణ పొందిన సాంప్రదాయ గవ్వల పందెం ఆట.",
        originHighlightTitle: "✨ ఆంధ్ర సంస్కృతి",
        originHighlightText: "తరతరాలుగా ఇళ్లలో ఆడే వ్యూహాత్మక ఆట! గవ్వల అదృష్టం మరియు పావుల యుక్తి కలయిక!",
        cowrieIntro: "నాలుగు గవ్వలను పళ్లెంలో వేయండి. <strong>పైకి తిరిగిన గవ్వలను (Mouth-Up)</strong> లెక్కించండి:",
        cowrie4: "4 పైకి = 4 అడుగులు",
        cowrie0: "0 పైకి = 8 అడుగులు (అష్టా)",
        cowrie1: "1 పైకి = 1 అడుగు (చమ్మ)",
        cowrie2: "2 పైకి = 2 అడుగులు",
        cowrie3: "3 పైకి = 3 అడుగులు",
        bonusRollText: "✨ బోనస్ వంతు",
        safeTitle: "గుడి/సురక్షిత గడులు (X):",
        safeDesc: "గుడి గుర్తు ఉన్న గడులలో పావులకు రక్షణ ఉంటుంది. ప్రత్యర్థి పావులు మిమ్మల్ని చంపలేవు.",
        captureTitle: "పావును చంపడం (Capture):",
        captureDesc: "రక్షణ లేని ప్రత్యర్థి పావు ఉన్న గడికి వెళ్తే అది చనిపోయి బయటకు వెళ్తుంది మరియు మీకు <strong>మరో వంతు</strong> వస్తుంది!",
        goalIntro: "పావులు బయటి గడుల చుట్టూ తిరిగి లోపలికి ప్రవేశించి మధ్యలోని <strong>ఇల్లు (HOME)</strong> చేరుకోవాలి.",
        goalBanner: "🏆 4 పావులను మొదటగా మధ్య ఇంట్లోకి చేర్చిన ఆటగాడే విజేత!",
        setupTitle: "🎮 మ్యాచ్ ఎంపిక",
        lblGameMode: "ఆట విధానం ఎంచుకోండి",
        modeVsAI: "కంప్యూటర్‌తో (Vs AI)",
        descVsAI: "1 ఆటగాడు వర్సెస్ కంప్యూటర్",
        mode2P: "2 ఆటగాళ్ళు",
        desc2P: "స్థానిక పాస్ & ప్లే",
        mode4P: "4 ఆటగాళ్ళు",
        desc4P: "4 వైపుల పోటీ",
        mode2v2: "2v2 టీమ్",
        desc2v2: "భాగస్వామ్య మ్యాచ్",
        lblBoardGrid: "బోర్డ్ గ్రిడ్ ఎంచుకోండి",
        grid5: "5×5 గ్రిడ్ (ప్రధానం)",
        desc5: "25 గడులు • వేగవంతమైన ఆట",
        grid7: "7×7 గ్రిడ్",
        desc7: "49 గడులు • పెద్ద బోర్డు",
        lblAIDiff: "ఏఐ కఠినత్వం",
        diffEasy: "సులభం",
        diffMedium: "మధ్యమం",
        diffHard: "కఠినం",
        lblPawnColors: "పావుల రంగులు ఎంచుకోండి",
        p1Label: "ఆటగాడు 1 (కింద):",
        p2Label: "ఆటగాడు 2 (ఎడమ):",
        p3Label: "ఆటగాడు 3 (పైన):",
        p4Label: "ఆటగాడు 4 (కుడి):",
        beginGame: "🚀 ఆట ప్రారంభించండి",
        mainMenuBtn: "🏠 ప్రధాన మెనూ",
        headerBadge5: "5×5 క్లాసిక్ గ్రిడ్",
        headerBadge7: "7×7 పెద్ద గ్రిడ్",
        diceTrayTitle: "🎲 గవ్వల పళ్లెం",
        rollResultLabel: "వచ్చిన అడుగులు",
        btnRoll: "🎲 గవ్వలు వేయండి",
        turnTitle: "ప్రస్తుత వంతు",
        msgRollPrompt: "గవ్వలు వేయండి! (Space)",
        msgAIThinking: "కంప్యూటర్ ఆలోచిస్తోంది...",
        msgSelectToken: "మెరుస్తున్న పావును ఎంచుకోండి! (Keys 1-4)",
        msgAISelecting: "కంప్యూటర్ పావును ఎంచుకుంటోంది...",
        msgNoLegalMoves: "ఎలాంటి చట్టబద్ధమైన నడకలు లేవు!",
        msgBonusRoll: "బోనస్ వంతు లభించింది!",
        msgPaused: "ఆట నిలిపివేయబడింది",
        moveLogTitle: "ఆట వివరాలు",
        logStarted: "ఆట ప్రారంభమైంది! పావులు ప్రారంభ స్థానంలో ఉన్నాయి.",
        rulesModalTitle: "📖 అష్టా చమ్మ మార్గదర్శిని",
        rulesSubtext: "సాంప్రదాయ గవ్వల ఆట నియమాలు!",
        playerPrefix: "ఆటగాడు",
        pawnPrefix: "పా",
        pauseTitle: "⏸️ ఆట నిలిపివేయబడింది",
        pauseSubtext: "కాసేపు విశ్రాంతి తీసుకోండి లేదా సెట్టింగ్‌లను మార్చండి!",
        btnResumeGame: "▶️ ఆట కొనసాగించండి",
        btnRestartPause: "🔄 మ్యాచ్ తిరిగి ప్రారంభించు",
        btnQuitMenu: "🏠 ప్రధాన మెనూకి వెళ్ళు",
        victoryTitle: "🎉 విజయం! 🎉",
        btnPlayAgain: "మళ్ళీ ఆడండి"
    },
    te_ts: {
        selectLangLabel: "🌐 భాష ఎంచుకోండి (TS):",
        title: "చౌకా బారా (తెలంగాణ)",
        tagline: "చౌకా బారా — తెలంగాణ సాంప్రదాయ గవ్వలాట",
        heritageBadge: "✨ తెలంగాణ సాంస్కృతిక క్రీడ",
        aboutTitle: "📜 ఆట విశేషాలు",
        tabOrigin: "🏛️ చరిత్ర",
        tabCowrie: "🐚 గవ్వలు",
        tabRules: "🛡️ గుళ్ళు & దెబ్బ",
        tabGoal: "🏆 గమ్యం",
        originP1: "<strong>చౌకా బారా</strong> తెలంగాణ పల్లెల్లో ఎంతో ఉత్సాహంగా ఆడే ప్రాచీన గవ్వల ఆట.",
        originHighlightTitle: "✨ తెలంగాణ వారసత్వం",
        originHighlightText: "పండుగలు మరియు ఖాళీ సమయాల్లో ఆడే వ్యూహాత్మక గవ్వల పందెం ఆట!",
        cowrieIntro: "నాలుగు గవ్వలను దొర్లించండి. <strong>వెల్లకిలా పడిన గవ్వల (Mouth-Up)</strong> సంఖ్యను లెక్కించండి:",
        cowrie4: "4 వెల్లకిలా = 4 కైలు",
        cowrie0: "0 వెల్లకిలా = 8 కైలు (అష్టా)",
        cowrie1: "1 వెల్లకిలా = 1 కై (చమ్మ)",
        cowrie2: "2 వెల్లకిలా = 2 కైలు",
        cowrie3: "3 వెల్లకిలా = 3 కైలు",
        bonusRollText: "✨ బోనస్ ఛాన్స్",
        safeTitle: "గుడి గడులు (X):",
        safeDesc: "గుడి గురుతున్న గడుల్లో పావులపై దాడి జరగదు. సురక్షితంగా ఉండవచ్చు.",
        captureTitle: "పావును కొట్టడం (Dabba/Capture):",
        captureDesc: "ఒంటరిగా ఉన్న ఎదురు పావు గడిలోకి వెళ్తే దాన్ని కొట్టి బయటకు పంపవచ్చు. మీకు <strong>మరో దాడి అవకాశం</strong> లభిస్తుంది!",
        goalIntro: "పావులు చుట్టూ తిరుగుతూ లోపలికి వచ్చి మధ్యలోని <strong>కేంద్ర ఇల్లు (HOME)</strong> చేరుకోవాలి.",
        goalBanner: "🏆 నాలుగు పావులను ముందుగా ఇంట్లోకి చేర్చినవారే విజేత!",
        setupTitle: "🎮 ఆట ఏర్పాటు",
        lblGameMode: "ఆట మోడ్ ఎంచుకోండి",
        modeVsAI: "కంప్యూటర్‌తో (Vs AI)",
        descVsAI: "1 ప్లేయర్ వర్సెస్ కంప్యూటర్",
        mode2P: "2 ప్లేయర్లు",
        desc2P: "లోకల్ పాస్ & ప్లే",
        mode4P: "4 ప్లేయర్లు",
        desc4P: "4 గురి పోటీ",
        mode2v2: "2v2 జోడీ",
        desc2v2: "జోడీ మ్యాచ్",
        lblBoardGrid: "బోర్డు రకం ఎంచుకోండి",
        grid5: "5×5 గ్రిడ్ (చిన్నది)",
        desc5: "25 గడులు • వేగవంతమైన ఆట",
        grid7: "7×7 గ్రిడ్ (పెద్దది)",
        desc7: "49 గడులు • విస్తృత ఆట",
        lblAIDiff: "ఏఐ స్థాయి",
        diffEasy: "తేలిక",
        diffMedium: "మధ్యమం",
        diffHard: "కఠినం",
        lblPawnColors: "పావుల రంగులు",
        p1Label: "ఆటగాడు 1 (కింద):",
        p2Label: "ఆటగాడు 2 (ఎడమ):",
        p3Label: "ఆటగాడు 3 (పైన):",
        p4Label: "ఆటగాడు 4 (కుడి):",
        beginGame: "🚀 ఆట షురూ చేయండి",
        mainMenuBtn: "🏠 మెయిన్ మెనూ",
        headerBadge5: "5×5 క్లాసిక్",
        headerBadge7: "7×7 బిగ్ గ్రిడ్",
        diceTrayTitle: "🎲 గవ్వల చట్రం",
        rollResultLabel: "పడిన కైలు",
        btnRoll: "🎲 గవ్వలు వేయండి",
        turnTitle: "ఇప్పుడు ఎవరి వంతు",
        msgRollPrompt: "గవ్వలు వేయండి! (Space)",
        msgAIThinking: "కంప్యూటర్ ఆలోచిస్తుంది...",
        msgSelectToken: "మెరుస్తున్న పావును ఎంచుకోండి! (Keys 1-4)",
        msgAISelecting: "కంప్యూటర్ పావును ఎంచుకుంటోంది...",
        msgNoLegalMoves: "ఎలాంటి నడకలు లేవు!",
        msgBonusRoll: "బోనస్ అవకాశం లభించింది!",
        msgPaused: "ఆట నిలిపివేయబడింది",
        moveLogTitle: "ఆట లాగ్",
        logStarted: "ఆట షురూ అయ్యింది! పావులు ఇంట్లో సిద్ధంగా ఉన్నాయి.",
        rulesModalTitle: "📖 చౌకా బారా నిబంధనలు",
        rulesSubtext: "గవ్వలాట వివరాలు సులభంగా తెలుసుకోండి!",
        playerPrefix: "ప్లేయర్",
        pawnPrefix: "పా",
        pauseTitle: "⏸️ ఆట నిలిపివేయబడింది",
        pauseSubtext: "కాసేపు విశ్రాంతి తీసుకోండి లేదా సెట్టింగ్‌లను మార్చండి!",
        btnResumeGame: "▶️ ఆట కొనసాగించండి",
        btnRestartPause: "🔄 మ్యాచ్ తిరిగి ప్రారంభించు",
        btnQuitMenu: "🏠 మెయిన్ మెనూకి వెళ్ళు",
        victoryTitle: "🎉 విజయం! 🎉",
        btnPlayAgain: "మళ్ళీ ఆడండి"
    },
    kn: {
        selectLangLabel: "🌐 ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ (KA):",
        title: "ಚೌಕಾ ಬಾರಾ (ಕರ್ನಾಟಕ)",
        tagline: "ಚೌಕಾ ಬಾರಾ — ಕವಡೆ ಕಾಳಿ ಪರಂಪರೆಯ ಆಟ",
        heritageBadge: "✨ ಕರ್ನಾಟಕದ ಪಾರಂಪರಿಕ ಆಟ",
        aboutTitle: "📜 ಆಟದ ವಿವರಣೆ",
        tabOrigin: "🏛️ ಮೂಲ",
        tabCowrie: "🐚 ಕವಡೆಗಳು",
        tabRules: "🛡️ ಮನೆ & ಪೆಟ್ಟು",
        tabGoal: "🏆 ಗುರಿ",
        originP1: "<strong>ಚೌಕಾ ಬಾರಾ</strong> (ಕರ್ನಾಟಕದಲ್ಲಿ <em>ಕವಡೆ ಕಾಳಿ</em> ಎಂದೂ ಕರೆಯಲ್ಪಡುವ) ಭಾರತದ ಅತ್ಯಂತ ಪ್ರಾಚೀನ ತಂತ್ರಗಾರಿಕೆಯ ಕವಡೆ ಆಟ.",
        originHighlightTitle: "✨ ಕನ್ನಡ ನಾಡಿನ ಪರಂಪರೆ",
        originHighlightText: "ಶತಮಾನಗಳಿಂದ ಮನೆಮನೆಗಳಲ್ಲಿ ಆಡಲ್ಪಡುವ ಆಟ! ಕವಡೆಗಳ ಅದೃಷ್ಟ ಮತ್ತು ದಾಳಗಳ ತಂತ್ರಗಾರಿಕೆಯ ಸಮ್ಮಿಲನ!",
        cowrieIntro: "ನಾಲ್ಕು ಕವಡೆಗಳನ್ನು ಚೌಕಟ್ಟಿನಲ್ಲಿ ಎಸೆಯಿರಿ. <strong>ಮೇಲ್ಮುಖವಾಗಿ ಬಿದ್ದ (Mouth-Up)</strong> ಕವಡೆಗಳನ್ನು ಎಣಿಸಿ:",
        cowrie4: "4 ಮೇಲ್ಮುಖ = 4 ಹೆಜ್ಜೆ",
        cowrie0: "0 ಮೇಲ್ಮುಖ = 8 ಹೆಜ್ಜೆ (ಅಷ್ಟ)",
        cowrie1: "1 ಮೇಲ್ಮುಖ = 1 ಹೆಜ್ಜೆ",
        cowrie2: "2 ಮೇಲ್ಮುಖ = 2 ಹೆಜ್ಜೆ",
        cowrie3: "3 ಮೇಲ್ಮುಖ = 3 ಹೆಜ್ಜೆ",
        bonusRollText: "✨ ಬೋನಸ್ ಅವಕಾಶ",
        safeTitle: "ಸುರಕ್ಷಿತ ಮನೆಗಳು (X):",
        safeDesc: "ಕ್ರಾಸ್ ಗುರುತಿರುವ ಮನೆಗಳು ಸುರಕ್ಷಿತ ನೆಲೆಗಳು. ಇಲ್ಲಿ ದಾಳಗಳಿಗೆ ಯಾವುದೇ ಅಪಾಯವಿರುವುದಿಲ್ಲ.",
        captureTitle: "ದಾಳ ಹೊಡೆಯುವುದು (Capture):",
        captureDesc: "ಎದುರಾಳಿಯ ಸುರಕ್ಷಿತವಲ್ಲದ ದಾಳವಿರುವ ಮನೆಗೆ ನಿಮ್ಮ ದಾಳ ತಲುಪಿದರೆ ಎದುರಾಳಿ ದಾಳವನ್ನು ಹೊಡೆದು ಹೊರಗಟ್ಟಬಹುದು ಮತ್ತು <strong>ಬೋನಸ್ ಅವಕಾಶ</strong> ಪಡೆಯಬಹುದು!",
        goalIntro: "ದಾಳಗಳು ಹೊರ ವರ್ತುಲದಲ್ಲಿ ಸುತ್ತಿ ಒಳಕ್ಕೆ ಚಲಿಸಿ ಮಧ್ಯದ <strong>ಮನೆ (HOME)</strong> ತಲುಪಬೇಕು.",
        goalBanner: "🏆 ತನ್ನ 4 ದಾಳಗಳನ್ನು ಮೊದಲು ಮನೆ ತಲುಪಿಸುವ ಆಟಗಾರನೇ ವಿಜೇತ!",
        setupTitle: "🎮 ಆಟದ ಸಿದ್ಧತೆ",
        lblGameMode: "ಆಟದ ಮೋಡ್ ಆಯ್ಕೆಮಾಡಿ",
        modeVsAI: "ಕಂಪ್ಯೂಟರ್ ಜೊತೆ (Vs AI)",
        descVsAI: "1 ಆಟಗಾರ ವರ್ಸಸ್ ಕಂಪ್ಯೂಟರ್",
        mode2P: "2 ಆಟಗಾರರು",
        desc2P: "ಲೋಕಲ್ ಪಾಸ್ & ಪ್ಲೇ",
        mode4P: "4 ಆಟಗಾರರು",
        desc4P: "4 ಜನ ಸ್ಪರ್ಧೆ",
        mode2v2: "2v2 ತಂಡ",
        desc2v2: "ಪಾಲುದಾರಿಕೆ ಪಂದ್ಯ",
        lblBoardGrid: "ಬೋರ್ಡ್ ಗ್ರಿಡ್ ಆಯ್ಕೆಮಾಡಿ",
        grid5: "5×5 ಗ್ರಿಡ್ (ಪ್ರಾಥಮಿಕ)",
        desc5: "25 ಮನೆಗಳು • ವೇಗದ ಆಟ",
        grid7: "7×7 ಗ್ರಿಡ್",
        desc7: "49 ಮನೆಗಳು • ವಿಸ್ತೃತ ಆಟ",
        lblAIDiff: "ಎಐ ಕಠಿಣತೆ",
        diffEasy: "ಸುಲಭ",
        diffMedium: "ಮಧ್ಯಮ",
        diffHard: "ಕಠಿಣ",
        lblPawnColors: "ದಾಳಗಳ ಬಣ್ಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        p1Label: "ಆಟಗಾರ 1 (ಕೆಳಗೆ):",
        p2Label: "ಆಟಗಾರ 2 (ಎಡ):",
        p3Label: "ಆಟಗಾರ 3 (ಮೇಲೆ):",
        p4Label: "ಆಟಗಾರ 4 (ಬಲ):",
        beginGame: "🚀 ಆಟ ಪ್ರಾರಂಭಿಸಿ",
        mainMenuBtn: "🏠 ಮುಖ್ಯ ಮೆನು",
        headerBadge5: "5×5 ಕ್ಲಾಸಿಕ್ ಗ್ರಿಡ್",
        headerBadge7: "7×7 ವಿಸ್ತೃತ ಗ್ರಿಡ್",
        diceTrayTitle: "🎲 ಕವಡೆ ಚೌಕಟ್ಟು",
        rollResultLabel: "ಬಿದ್ದ ಹೆಜ್ಜೆಗಳು",
        btnRoll: "🎲 ಕವಡೆಗಳನ್ನು ಎಸೆಯಿರಿ",
        turnTitle: "ಪ್ರಸ್ತುತ ಸರದಿ",
        msgRollPrompt: "ಕವಡೆಗಳನ್ನು ಎಸೆಯಿರಿ! (Space)",
        msgAIThinking: "ಎಐ ಆಲೋಚಿಸುತ್ತಿದೆ...",
        msgSelectToken: "ಹೊಳೆಯುವ ದಾಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ! (Keys 1-4)",
        msgAISelecting: "ಎಐ ದಾಳವನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತಿದೆ...",
        msgNoLegalMoves: "ಯಾವುದೇ ಚಲನೆ ಲಭ್ಯವಿಲ್ಲ!",
        msgBonusRoll: "ಬೋನಸ್ ಅವಕಾಶ ದೊರೆತಿದೆ!",
        msgPaused: "ಆಟವನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ",
        moveLogTitle: "ಚಲನೆಗಳ ವಿವರ",
        logStarted: "ಆಟ ಪ್ರಾರಂಭವಾಗಿದೆ! ಎಲ್ಲಾ ದಾಳಗಳು ಆರಂಭಿಕ ಮನೆಯಲ್ಲಿವೆ.",
        rulesModalTitle: "📖 ಚೌಕಾ ಬಾರಾ ಮಾರ್ಗದರ್ಶಿ",
        rulesSubtext: "ಸುಲಭ ಹಂತಗಳಲ್ಲಿ ಕವಡೆ ಆಟ ಕಲಿಯಿರಿ!",
        playerPrefix: "ಆಟಗಾರ",
        pawnPrefix: "ದಾ",
        pauseTitle: "⏸️ ಆಟ ನಿಲ್ಲಿಸಲಾಗಿದೆ",
        pauseSubtext: "ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ಸಂಯೋಜನೆಗಳನ್ನು ಬದಲಿಸಿ!",
        btnResumeGame: "▶️ ಆಟ ಮುಂದುವರಿಸಿ",
        btnRestartPause: "🔄 ಪಂದ್ಯ ಪುನರಾರಂಭಿಸಿ",
        btnQuitMenu: "🏠 ಮುಖ್ಯ ಮೆನುಗೆ ಹೋಗಿ",
        victoryTitle: "🎉 ವಿಜಯ! 🎉",
        btnPlayAgain: "ಮತ್ತೆ ಆಡಿ"
    },
    or: {
        selectLangLabel: "🌐 ଭାଷା ବାଛନ୍ତୁ (Select Language):",
        title: "ଚୌକା ବାରା",
        tagline: "ଚୌକା ଭାରା — ପାରମ୍ପରିକ କଉଡ଼ି ଖେଳ",
        heritageBadge: "✨ ପାରମ୍ପରିକ ଐତିହ୍ୟ",
        aboutTitle: "📜 ଖେଳ ବିଷୟରେ",
        tabOrigin: "🏛️ ଉତ୍ପତ୍ତି",
        tabCowrie: "🐚 କଉଡ଼ି",
        tabRules: "🛡️ ସୁରକ୍ଷିତ ଓ କାଟିବା",
        tabGoal: "🏆 ଲକ୍ଷ୍ୟ",
        originP1: "<strong>ଚୌକା ବାରା</strong> (ଯାହାକୁ <em>ଚୌକା ଭାରା</em>, <em>ଅଷ୍ଟା ଚମ୍ମା</em> କିମ୍ବା <em>କଭଡ଼େ କାଳି</em> କୁହାଯାଏ) ଭାରତର ସବୁଠାରୁ ପୁରାତନ କଉଡ଼ି ଖେଳ।",
        originHighlightTitle: "✨ ପ୍ରାଚୀନ ଐତିହ୍ୟ",
        originHighlightText: "ଶତାବ୍ଦୀ ଧରି ଭାରତୀୟ ପରିବାରରେ ଖେଳାଯାଉଥିବା ରଣନୀତିକ ଖେଳ!",
        cowrieIntro: "ଚାରୋଟି କଉଡ଼ି ଫିଙ୍ଗାଯାଏ। <strong>ଖୋଲା ମୁହଁ (Mouth-Up)</strong> ଗଣନ୍ତୁ:",
        cowrie4: "୪ ଖୋଲା = ୪ ପାଦ",
        cowrie0: "୦ ଖୋଲା = ୮ ପାଦ",
        cowrie1: "୧ ଖୋଲା = ୧ ପାଦ",
        cowrie2: "୨ ଖୋଲା = ୨ ପାଦ",
        cowrie3: "୩ ଖୋଲା = ୩ ପାଦ",
        bonusRollText: "✨ ବୋନସ୍ ଚାଲ୍",
        safeTitle: "ସୁରକ୍ଷିତ ଘର (X):",
        safeDesc: "କ୍ରସ୍ ଚିହ୍ନ ଥିବା ଘରଗୁଡ଼ିକ ସୁରକ୍ଷିତ। ଏଠାରେ ଗୋଟି କଟାଯାଏ ନାହିଁ।",
        captureTitle: "ଗୋଟି କାଟିବା (Capture):",
        captureDesc: "ବିପକ୍ଷ ଗୋଟି ଉପରେ ରହିଲେ ତାହା କଟି ଘରକୁ ଫେରିଯାଏ ଏବଂ <strong>ବୋନସ୍ ଚାଲ୍</strong> ମିଳେ!",
        goalIntro: "ଗୋଟିଗୁଡ଼ିକ ଚାରିପାଖରେ ବୁଲି ଭିତରକୁ ଆସି କେନ୍ଦ୍ର <strong>ଘର (HOME)</strong> ରେ ପହଞ୍ଚିବା ଉଚିତ୍।",
        goalBanner: "🏆 ନିଜର ୪ଟି ଗୋଟି ସବୁଠାରୁ ପ୍ରଥମେ ଘରକୁ ନେଉଥିବା ଖେଳାଳି ବିଜେତା!",
        setupTitle: "🎮 ମ୍ୟାଚ୍ ସେଟ୍ କରନ୍ତୁ",
        lblGameMode: "ଖେଳ ମୋଡ୍ ବାଛନ୍ତୁ",
        modeVsAI: "କମ୍ପ୍ୟୁଟର ସହ (Vs AI)",
        descVsAI: "୧ ଖେଳାଳି ବନାମ କମ୍ପ୍ୟୁଟର",
        mode2P: "୨ ଖେଳାଳି",
        desc2P: "ଲୋକାଲ୍ ପାସ୍ ଏବଂ ପ୍ଲେ",
        mode4P: "୪ ଖେଳାଳି",
        desc4P: "୪ ଜଣିଆ ପ୍ରତିଯୋଗିତା",
        mode2v2: "୨v୨ ଟିମ୍",
        desc2v2: "ପାର୍ଟନରସିପ୍ ମ୍ୟାଚ୍",
        lblBoardGrid: "ବୋର୍ଡ ଗ୍ରିଡ୍ ବାଛନ୍ତୁ",
        grid5: "୫×୫ ଗ୍ରିଡ୍ (ମୁଖ୍ୟ)",
        desc5: "୨୫ ଘର • ଦ୍ରୁତ ଖେଳ",
        grid7: "୭×୭ ଗ୍ରିଡ୍",
        desc7: "୪୯ ଘର • ବଡ଼ ବୋର୍ଡ",
        lblAIDiff: "ଏଆଇ କାଠିନ୍ୟ",
        diffEasy: "ସହଜ",
        diffMedium: "ମଧ୍ୟମ",
        diffHard: "କଠିନ",
        lblPawnColors: "ଗୋଟି ରଙ୍ଗ ବାଛନ୍ତୁ",
        p1Label: "ଖେଳାଳି ୧ (ତଳ):",
        p2Label: "ଖେଳାଳି ୨ (ବାମ):",
        p3Label: "ଖେଳାଳି ୩ (ଉପର):",
        p4Label: "ଖେଳାଳି ୪ (ଡାହାଣ):",
        beginGame: "🚀 ଖେଳ ଆରମ୍ଭ କରନ୍ତୁ",
        mainMenuBtn: "🏠 ମୁଖ୍ୟ ମେନୁ",
        headerBadge5: "୫×୫ କ୍ଲାସିକ୍",
        headerBadge7: "୭×୭ ବଡ଼ ଗ୍ରିଡ୍",
        diceTrayTitle: "🎲 କଉଡ଼ି ଥାଳି",
        rollResultLabel: "ପଡ଼ିଥିବା ପାଦ",
        btnRoll: "🎲 କଉଡ଼ି ଫିଙ୍ଗନ୍ତୁ",
        turnTitle: "ବର୍ତ୍ତମାନ ପାଳି",
        msgRollPrompt: "କଉଡ଼ି ଫିଙ୍ଗନ୍ତୁ! (Space)",
        msgAIThinking: "କମ୍ପ୍ୟୁଟର ଚିନ୍ତା କରୁଛି...",
        msgSelectToken: "ଉଜ୍ଜ୍ୱଳ ଗୋଟିକୁ ବାଛନ୍ତୁ! (Keys 1-4)",
        msgAISelecting: "କମ୍ପ୍ୟୁଟର ଗୋଟି ବାଛୁଛି...",
        msgNoLegalMoves: "କୌଣସି ଚାଲ ଉପଲବ୍ଧ ନାହିଁ!",
        msgBonusRoll: "ବୋନସ୍ ଚାଲ୍ ମିଳିଲା!",
        msgPaused: "ଖେଳ ସ୍ଥଗିତ ଅଛି",
        moveLogTitle: "ଖେଳ ବିବରଣୀ",
        logStarted: "ମ୍ୟାଚ୍ ଆରମ୍ଭ ହେଲା! ସମସ୍ତ ଗୋଟି ପ୍ରାରମ୍ଭିକ ଘରେ ଅଛନ୍ତି।",
        rulesModalTitle: "📖 ଚୌକା ବାରା ମାର୍ଗଦର୍ଶିକା",
        rulesSubtext: "ସହଜ ପଦକ୍ଷେପରେ ପାରମ୍ପରିକ ଖେଳ ଶିଖନ୍ତୁ!",
        playerPrefix: "ଖେଳାଳି",
        pawnPrefix: "ଗୋ",
        pauseTitle: "⏸️ ଖେଳ ସ୍ଥଗିତ ଅଛି",
        pauseSubtext: "ଟିକିଏ ବିଶ୍ରାମ ନିଅନ୍ତୁ କିମ୍ବା ସେଟିଂସ ବଦଳାନ୍ତୁ!",
        btnResumeGame: "▶️ ଖେଳ ଜାରି ରଖନ୍ତୁ",
        btnRestartPause: "🔄 ମ୍ୟାଚ୍ ପୁନର୍ବାର ଆରମ୍ଭ କରନ୍ତୁ",
        btnQuitMenu: "🏠 ମୁଖ୍ୟ ମେନୁକୁ ଫେରନ୍ତୁ",
        victoryTitle: "🎉 ବିଜୟ! 🎉",
        btnPlayAgain: "ପୁନର୍ବାର ଖେଳନ୍ତୁ"
    }
};

console.log('Translations defined successfully');


class ChaukaBaraApp {
    constructor() {
        // Match Config Settings
        this.selectedMode = 'vs_ai'; // vs_ai, pass_play_2, pass_play_4, partnership_2v2
        this.boardSize = 5; // 5x5 default
        this.aiDiff = 'medium'; // easy, medium, hard
        this.playerColors = ['red', 'blue', 'yellow', 'green'];
        this.currentLang = localStorage.getItem('chauka_bara_lang') || 'en';

        // Runtime State
        this.playerCount = 2;
        this.humanCount = 1;
        this.activePlayerIndex = 0;
        this.players = [];
        this.finishedPlayers = [];
        this.currentRoll = null;
        this.gameState = GameState.ROLL_PENDING;
        this.previousStateBeforePause = null;
        this.sound = new SoundFx();

        this.initDOM();
        this.initKeyboardShortcuts();
    }

    setLanguage(lang) {
        if (!TRANSLATIONS[lang]) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('chauka_bara_lang', lang);

        const t = TRANSLATIONS[lang];

        // Highlight active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Landing Header
        const mainTitle = document.getElementById('txt-main-title');
        if (mainTitle) mainTitle.innerText = t.title;

        const mainTagline = document.getElementById('txt-main-tagline');
        if (mainTagline) mainTagline.innerText = t.tagline;

        const heritageBadge = document.querySelector('.landing-header .heritage-badge');
        if (heritageBadge) heritageBadge.innerText = t.heritageBadge;

        const langLabel = document.getElementById('lbl-select-lang');
        if (langLabel) langLabel.innerText = t.selectLangLabel;

        // About Card
        const aboutTitle = document.querySelector('.about-card h2');
        if (aboutTitle) aboutTitle.innerText = t.aboutTitle;

        const tabOriginBtn = document.querySelector('[data-about-tab="about-origin"]');
        if (tabOriginBtn) tabOriginBtn.innerText = t.tabOrigin;

        const tabCowrieBtn = document.querySelector('[data-about-tab="about-cowrie"]');
        if (tabCowrieBtn) tabCowrieBtn.innerText = t.tabCowrie;

        const tabRulesBtn = document.querySelector('[data-about-tab="about-rules"]');
        if (tabRulesBtn) tabRulesBtn.innerText = t.tabRules;

        const tabGoalBtn = document.querySelector('[data-about-tab="about-goal"]');
        if (tabGoalBtn) tabGoalBtn.innerText = t.tabGoal;

        const aboutOriginPanel = document.getElementById('about-origin');
        if (aboutOriginPanel) {
            aboutOriginPanel.innerHTML = `<p>${t.originP1}</p><div class="about-highlight-box"><span class="highlight-title">${t.originHighlightTitle}</span><p>${t.originHighlightText}</p></div>`;
        }

        const aboutCowriePanel = document.getElementById('about-cowrie');
        if (aboutCowriePanel) {
            aboutCowriePanel.innerHTML = `<p>${t.cowrieIntro}</p><div class="about-cowrie-grid"><div class="cowrie-score-pill"><span class="c-val">${t.cowrie4}</span><span class="c-bonus">${t.bonusRollText}</span></div><div class="cowrie-score-pill"><span class="c-val">${t.cowrie0}</span><span class="c-bonus">${t.bonusRollText}</span></div><div class="cowrie-score-pill"><span class="c-val">${t.cowrie1}</span></div><div class="cowrie-score-pill"><span class="c-val">${t.cowrie2}</span></div><div class="cowrie-score-pill"><span class="c-val">${t.cowrie3}</span></div></div>`;
        }

        const aboutRulesPanel = document.getElementById('about-rules');
        if (aboutRulesPanel) {
            aboutRulesPanel.innerHTML = `<div class="about-rule-item"><span class="rule-icon">🛡️</span><div><strong>${t.safeTitle}</strong><p>${t.safeDesc}</p></div></div><div class="about-rule-item"><span class="rule-icon">💥</span><div><strong>${t.captureTitle}</strong><p>${t.captureDesc}</p></div></div>`;
        }

        const aboutGoalPanel = document.getElementById('about-goal');
        if (aboutGoalPanel) {
            aboutGoalPanel.innerHTML = `<p>${t.goalIntro}</p><div class="about-goal-banner"><span>${t.goalBanner}</span></div>`;
        }

        // Match Setup Card
        const setupTitle = document.querySelector('.setup-main-card h2');
        if (setupTitle) setupTitle.innerText = t.setupTitle;

        const groupLabels = document.querySelectorAll('.group-label');
        if (groupLabels.length >= 4) {
            groupLabels[0].innerText = t.lblGameMode;
            groupLabels[1].innerText = t.lblBoardGrid;
            groupLabels[2].innerText = t.lblAIDiff;
            groupLabels[3].innerText = t.lblPawnColors;
        }

        // Mode Buttons
        const btnVsAI = document.querySelector('[data-mode="vs_ai"]');
        if (btnVsAI) {
            btnVsAI.querySelector('.mode-name').innerText = t.modeVsAI;
            btnVsAI.querySelector('.mode-desc').innerText = t.descVsAI;
        }
        const btn2P = document.querySelector('[data-mode="pass_play_2"]');
        if (btn2P) {
            btn2P.querySelector('.mode-name').innerText = t.mode2P;
            btn2P.querySelector('.mode-desc').innerText = t.desc2P;
        }
        const btn4P = document.querySelector('[data-mode="pass_play_4"]');
        if (btn4P) {
            btn4P.querySelector('.mode-name').innerText = t.mode4P;
            btn4P.querySelector('.mode-desc').innerText = t.desc4P;
        }
        const btn2v2 = document.querySelector('[data-mode="partnership_2v2"]');
        if (btn2v2) {
            btn2v2.querySelector('.mode-name').innerText = t.mode2v2;
            btn2v2.querySelector('.mode-desc').innerText = t.desc2v2;
        }

        // Grid Variant Buttons
        const btnGrid5 = document.querySelector('[data-grid="5"]');
        if (btnGrid5) {
            btnGrid5.querySelector('.v-title').innerText = t.grid5;
            btnGrid5.querySelector('.v-sub').innerText = t.desc5;
        }
        const btnGrid7 = document.querySelector('[data-grid="7"]');
        if (btnGrid7) {
            btnGrid7.querySelector('.v-title').innerText = t.grid7;
            btnGrid7.querySelector('.v-sub').innerText = t.desc7;
        }

        // AI Diff Buttons
        const btnEasy = document.querySelector('[data-diff="easy"]');
        if (btnEasy) btnEasy.innerText = t.diffEasy;
        const btnMedium = document.querySelector('[data-diff="medium"]');
        if (btnMedium) btnMedium.innerText = t.diffMedium;
        const btnHard = document.querySelector('[data-diff="hard"]');
        if (btnHard) btnHard.innerText = t.diffHard;

        // Pawn Color Labels
        const colorPicks = document.querySelectorAll('.player-color-pick span');
        if (colorPicks.length >= 4) {
            colorPicks[0].innerText = t.p1Label;
            colorPicks[1].innerText = t.p2Label;
            colorPicks[2].innerText = t.p3Label;
            colorPicks[3].innerText = t.p4Label;
        }

        // SVG Icon Helpers
        const SVG_THEME_MENU = `<svg class="theme-icon-svg menu-icon-svg" viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;"><defs><linearGradient id="menuGoldGradDyn" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fff0a0"/><stop offset="50%" stop-color="#ffd700"/><stop offset="100%" stop-color="#b8860b"/></linearGradient></defs><path d="M12 2.5L2 9.5h2.5V20a1 1 0 001 1h13a1 1 0 001-1V9.5H22L12 2.5zm0 3.8l5 3.7V19H7V10l5-3.7zM10.5 14h3v5h-3v-5z" fill="url(#menuGoldGradDyn)"/><circle cx="12" cy="7.2" r="1.1" fill="url(#menuGoldGradDyn)"/></svg>`;
        const SVG_THEME_COWRIE = `<svg class="theme-icon-svg cowrie-icon-svg" viewBox="0 0 24 24" width="20" height="20" style="margin-right: 6px;"><defs><linearGradient id="cowrieGoldGradDyn" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff5ca"/><stop offset="45%" stop-color="#ffd700"/><stop offset="100%" stop-color="#b8860b"/></linearGradient></defs><path d="M12 2.5C7.5 2.5 3.8 6.5 3.8 12c0 5 3.7 9.5 8.2 9.5s8.2-4.5 8.2-9.5c0-5.5-3.7-9.5-8.2-9.5z" fill="url(#cowrieGoldGradDyn)" stroke="#5c4010" stroke-width="0.8"/><path d="M12 5.5c-1.3 2-1.9 4.2-1.9 6.5s0.6 4.5 1.9 6.5c1.3-2 1.9-4.2 1.9-6.5s-0.6-4.5-1.9-6.5z" fill="#200d05"/><line x1="9" y1="9.5" x2="11.2" y2="9.5" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/><line x1="8.8" y1="12" x2="11.2" y2="12" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/><line x1="9" y1="14.5" x2="11.2" y2="14.5" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/><line x1="12.8" y1="9.5" x2="15" y2="9.5" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/><line x1="12.8" y1="12" x2="15.2" y2="12" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/><line x1="12.8" y1="14.5" x2="15" y2="14.5" stroke="url(#cowrieGoldGradDyn)" stroke-width="1.1" stroke-linecap="round"/></svg>`;
        const SVG_THEME_PLAY = `<svg class="theme-icon-svg" viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;"><defs><linearGradient id="pGradDyn" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fff0a0"/><stop offset="100%" stop-color="#b8860b"/></linearGradient></defs><path d="M8 5v14l11-7z" fill="url(#pGradDyn)"/></svg>`;
        const SVG_THEME_REFRESH = `<svg class="theme-icon-svg" viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;"><defs><linearGradient id="rGradDyn" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fff0a0"/><stop offset="100%" stop-color="#b8860b"/></linearGradient></defs><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="url(#rGradDyn)"/></svg>`;

        // Buttons
        if (this.btnBeginGame) this.btnBeginGame.innerHTML = `${SVG_THEME_COWRIE}<span>${t.beginGame.replace(/^[🚀🎲]\s*/, '')}</span>`;
        if (this.btnBackMenu) this.btnBackMenu.innerHTML = `${SVG_THEME_MENU}<span>${t.mainMenuBtn.replace(/^🏠\s*/, '')}</span>`;

        const logoTitle = document.querySelector('.logo-area h1');
        if (logoTitle) logoTitle.innerText = t.title;

        const headerBadge = document.getElementById('header-mode-badge');
        if (headerBadge) {
            headerBadge.innerText = this.boardSize === 5 ? t.headerBadge5 : t.headerBadge7;
        }

        const diceTrayHeader = document.querySelector('.square-dice-panel h3');
        if (diceTrayHeader) diceTrayHeader.innerHTML = `${SVG_THEME_COWRIE}<span>${t.diceTrayTitle.replace(/^🎲\s*/, '')}</span>`;

        const rollLabel = document.querySelector('.roll-label');
        if (rollLabel) rollLabel.innerText = t.rollResultLabel;

        if (this.btnRoll) this.btnRoll.innerHTML = `${SVG_THEME_COWRIE}<span>${t.btnRoll.replace(/^🎲\s*/, '')}</span>`;

        const turnHeader = document.querySelector('.turn-card h3');
        if (turnHeader) turnHeader.innerText = t.turnTitle;

        const moveLogHeader = document.querySelector('.log-card h3');
        if (moveLogHeader) moveLogHeader.innerText = t.moveLogTitle;

        // Rules Modal
        const rulesModalHeader = document.querySelector('.rules-modal-header h2');
        if (rulesModalHeader) rulesModalHeader.innerText = t.rulesModalTitle;

        const rulesSubtext = document.querySelector('.rules-subtext');
        if (rulesSubtext) rulesSubtext.innerText = t.rulesSubtext;

        // Pause Modal
        const pauseTitle = document.getElementById('pause-title');
        if (pauseTitle) pauseTitle.innerText = t.pauseTitle;

        const pauseSubtext = document.getElementById('pause-subtext');
        if (pauseSubtext) pauseSubtext.innerText = t.pauseSubtext;

        const pauseLangLabel = document.getElementById('lbl-pause-lang');
        if (pauseLangLabel) pauseLangLabel.innerText = t.selectLangLabel;

        const btnResume = document.getElementById('btn-resume-game');
        if (btnResume) btnResume.innerHTML = `${SVG_THEME_PLAY}<span>${t.btnResumeGame.replace(/^▶️\s*/, '')}</span>`;

        const btnRestartPause = document.getElementById('btn-restart-pause');
        if (btnRestartPause) btnRestartPause.innerHTML = `${SVG_THEME_REFRESH}<span>${t.btnRestartPause.replace(/^🔄\s*/, '')}</span>`;

        const btnMenuPause = document.getElementById('btn-menu-pause');
        if (btnMenuPause) btnMenuPause.innerHTML = `${SVG_THEME_MENU}<span>${t.btnQuitMenu.replace(/^🏠\s*/, '')}</span>`;

        // Victory Modal
        const victoryTitle = document.getElementById('victory-title');
        if (victoryTitle) victoryTitle.innerText = t.victoryTitle;

        const btnVictoryRestart = document.getElementById('btn-victory-restart');
        if (btnVictoryRestart) btnVictoryRestart.innerText = t.btnPlayAgain;

        // Active match player names & HUD update
        if (this.players && this.players.length > 0) {
            const playerPrefix = t.playerPrefix || 'Player';
            this.players.forEach((p, idx) => {
                p.name = `${playerPrefix} ${idx + 1}${p.isAI ? ' [AI]' : ''}`;
            });
            this.updateScores();
            this.updateUI();
            this.renderTokens();
        }
    }

    initDOM() {
        // Views
        this.landingPage = document.getElementById('landing-page');
        this.gamePage = document.getElementById('game-page');

        // Landing Setup Controls
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.variantBtns = document.querySelectorAll('.variant-btn');
        this.diffBtns = document.querySelectorAll('.diff-btn');
        this.swatches = document.querySelectorAll('.swatch');
        this.btnBeginGame = document.getElementById('btn-begin-game');
        this.btnBackMenu = document.getElementById('btn-back-menu');

        // Game Board Elements
        this.domBoard = document.getElementById('board');
        this.btnRoll = document.getElementById('btn-roll');
        this.btnSound = document.getElementById('btn-sound');
        this.btnRestartHeader = document.getElementById('btn-restart-header');
        this.btnPause = document.getElementById('btn-pause');
        this.btnRulesFab = document.getElementById('btn-rules-fab');
        this.modalRules = document.getElementById('modal-rules');
        this.modalVictory = document.getElementById('modal-victory');
        this.modalPause = document.getElementById('modal-pause');

        this.rollResultDisplay = document.querySelector('.roll-value');
        this.activePlayerName = document.getElementById('active-player-name');
        this.activePlayerDisplay = document.getElementById('active-player-display');
        this.turnStatusMsg = document.getElementById('turn-status-msg');
        this.moveLog = document.getElementById('move-log');

        // Setup Event Listeners
        this.initLandingListeners();
        this.initGameListeners();
    }

    initLandingListeners() {
        // Language Selection Buttons Listener
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.setLanguage(lang);
            });
        });
        this.setLanguage(this.currentLang);

        // Interactive About Tabs Switcher
        const aboutTabBtns = document.querySelectorAll('.about-tab-btn');
        aboutTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                aboutTabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.about-tab-panel').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetId = btn.dataset.aboutTab;
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) targetPanel.classList.add('active');
            });
        });

        // Game Mode Buttons
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMode = btn.dataset.mode;

                const aiContainer = document.getElementById('ai-diff-container');
                if (aiContainer) {
                    aiContainer.style.display = this.selectedMode === 'vs_ai' ? 'block' : 'none';
                }

                // Show all 4 player color pickers for 4-player / 2v2 modes
                const is4Player = (this.selectedMode === 'pass_play_4' || this.selectedMode === 'partnership_2v2');
                document.querySelectorAll('.player-color-pick').forEach(row => {
                    const rowIdx = parseInt(row.dataset.playerRow);
                    if (is4Player) {
                        row.style.display = 'flex';
                    } else {
                        row.style.display = (rowIdx === 0 || rowIdx === 2) ? 'flex' : 'none';
                    }
                });
            });
        });

        // Board Variant Buttons
        this.variantBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.variantBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.boardSize = parseInt(btn.dataset.grid);
            });
        });

        // AI Difficulty Buttons
        this.diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aiDiff = btn.dataset.diff;
            });
        });

        // Pawn Color Picker Swatches
        this.swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const pIdx = parseInt(swatch.parentElement.dataset.player);
                const color = swatch.dataset.color;
                swatch.parentElement.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.playerColors[pIdx] = color;
            });
        });

        // BEGIN GAME Button
        if (this.btnBeginGame) {
            this.btnBeginGame.addEventListener('click', () => {
                this.sound.init();
                this.showGamePage();
            });
        }
    }

    initGameListeners() {
        const backMenuAction = () => this.showLandingPage();
        if (this.btnBackMenu) this.btnBackMenu.addEventListener('click', backMenuAction);

        if (this.btnRestartHeader) {
            this.btnRestartHeader.addEventListener('click', () => this.startNewMatch());
        }

        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => this.togglePause());
        }

        const btnResume = document.getElementById('btn-resume-game');
        if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

        const btnRestartPause = document.getElementById('btn-restart-pause');
        if (btnRestartPause) {
            btnRestartPause.addEventListener('click', () => {
                if (this.modalPause) this.modalPause.style.display = 'none';
                this.startNewMatch();
            });
        }

        const btnMenuPause = document.getElementById('btn-menu-pause');
        if (btnMenuPause) {
            btnMenuPause.addEventListener('click', () => {
                if (this.modalPause) this.modalPause.style.display = 'none';
                this.showLandingPage();
            });
        }

        if (this.btnRoll) {
            this.btnRoll.addEventListener('click', () => {
                this.sound.init();
                this.onRollClick();
            });
        }

        const toggleSoundAction = () => {
            const isMuted = this.sound.toggleMute();
            if (this.btnSound) this.btnSound.innerText = isMuted ? '🔇' : '🔊';
        };

        if (this.btnSound) this.btnSound.addEventListener('click', toggleSoundAction);

        const openRulesAction = () => {
            if (this.modalRules) this.modalRules.style.display = 'flex';
        };
        if (this.btnRulesFab) this.btnRulesFab.addEventListener('click', openRulesAction);

        const closeRules = document.getElementById('close-rules');
        if (closeRules) closeRules.addEventListener('click', () => {
            if (this.modalRules) this.modalRules.style.display = 'none';
        });

        const btnVictoryRestart = document.getElementById('btn-victory-restart');
        if (btnVictoryRestart) {
            btnVictoryRestart.addEventListener('click', () => {
                if (this.modalVictory) this.modalVictory.style.display = 'none';
                this.startNewMatch();
            });
        }

        // Tab switching for visual beginner rules guide
        const tabBtns = document.querySelectorAll('.rules-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.rules-tab-panel').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = document.getElementById(btn.dataset.tab);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }

    togglePause() {
        if (this.gameState === GameState.GAME_OVER) return;

        if (this.gameState === GameState.PAUSED) {
            this.gameState = this.previousStateBeforePause || GameState.ROLL_PENDING;
            if (this.modalPause) this.modalPause.style.display = 'none';
            this.updateUI();
        } else {
            this.previousStateBeforePause = this.gameState;
            this.gameState = GameState.PAUSED;
            if (this.modalPause) this.modalPause.style.display = 'flex';
            if (this.btnRoll) this.btnRoll.disabled = true;
        }
    }

    initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                this.togglePause();
                return;
            }

            if (this.gameState === GameState.PAUSED) return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === GameState.ROLL_PENDING) {
                    const activePlayer = this.players[this.activePlayerIndex];
                    if (activePlayer && !activePlayer.isAI) {
                        this.sound.init();
                        this.onRollClick();
                    }
                }
            }

            if (['1', '2', '3', '4'].includes(e.key) && this.gameState === GameState.MOVE_PENDING) {
                const pIdx = parseInt(e.key) - 1;
                const activePlayer = this.players[this.activePlayerIndex];
                if (activePlayer && !activePlayer.isAI) {
                    const legalMoves = this.getLegalMoves(activePlayer, this.currentRoll.steps);
                    if (legalMoves.includes(pIdx)) {
                        this.onTokenClick(pIdx);
                    }
                }
            }
        });
    }

    showLandingPage() {
        this.gamePage.classList.remove('active-view');
        this.landingPage.classList.add('active-view');
        window.scrollTo(0, 0);
    }

    showGamePage() {
        this.landingPage.classList.remove('active-view');
        this.gamePage.classList.add('active-view');
        window.scrollTo(0, 0);
        this.startNewMatch();
    }

    startNewMatch() {
        this.activePlayerIndex = 0;
        this.currentRoll = null;
        this.gameState = GameState.ROLL_PENDING;
        this.players = [];
        this.finishedPlayers = [];
        this.previousStateBeforePause = null;

        if (this.moveLog) {
            this.moveLog.innerHTML = '';
        }

        const modeNames = {
            'vs_ai': 'VS AI',
            'pass_play_2': '2 PLAYERS',
            'pass_play_4': '4 PLAYERS',
            'partnership_2v2': '2v2 TEAM'
        };
        const modeLabel = modeNames[this.selectedMode] || 'VS AI';
        const badgeElem = document.getElementById('header-mode-badge');
        if (badgeElem) {
            badgeElem.innerText = `${this.boardSize}×${this.boardSize} ${modeLabel}`;
        }

        // Configure player count based on mode
        if (this.selectedMode === 'vs_ai') {
            this.playerCount = 2;
            this.humanCount = 1;
        } else if (this.selectedMode === 'pass_play_2') {
            this.playerCount = 2;
            this.humanCount = 2;
        } else if (this.selectedMode === 'pass_play_4' || this.selectedMode === 'partnership_2v2') {
            this.playerCount = 4;
            this.humanCount = 4;
        }

        const t = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
        const playerPrefix = t.playerPrefix || 'Player';

        for (let i = 0; i < this.playerCount; i++) {
            let isAI = i >= this.humanCount;
            let teamId = (this.selectedMode === 'partnership_2v2') ? (i % 2) : i;

            this.players.push({
                id: i,
                name: `${playerPrefix} ${i + 1}${isAI ? ' [AI]' : ''}`,
                color: this.playerColors[i] || DEFAULT_COLORS[i],
                isAI: isAI,
                teamId: teamId,
                hasCaptured: false,
                isFinished: false,
                rank: 0,
                tokens: [
                    { id: 0, pathIndex: 0 },
                    { id: 1, pathIndex: 0 },
                    { id: 2, pathIndex: 0 },
                    { id: 3, pathIndex: 0 }
                ]
            });
        }

        this.renderBoard();
        this.updateUI();
        this.logSystem(t.logStarted || 'Match Started! All pawns placed in starting home houses.');
    }

    renderBoard() {
        if (!this.domBoard) return;
        this.domBoard.innerHTML = '';
        this.domBoard.className = `board-grid board-${this.boardSize}x${this.boardSize}`;

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                if (this.isHomeSquare(r, c)) {
                    cell.classList.add('home-square');
                    cell.innerHTML = `
                        <div class="cell-motif-container">
                            <svg class="cell-home-svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="#140407" stroke="#ffd700" stroke-width="2"/>
                                <circle cx="50" cy="50" r="38" fill="rgba(212, 175, 55, 0.2)" stroke="#d4af37" stroke-width="1.5"/>
                                <g transform="translate(50,50)">
                                    <path d="M0 -34 C12 -22 12 -10 0 0 C-12 -10 -12 -22 0 -34" fill="#ffd700" opacity="0.95"/>
                                    <path d="M0 34 C12 22 12 10 0 0 C-12 10 -12 22 0 34" fill="#ffd700" opacity="0.95"/>
                                    <path d="M-34 0 C-22 12 -10 12 0 0 C-10 -12 -22 -12 -34 0" fill="#ffd700" opacity="0.95"/>
                                    <path d="M34 0 C22 12 10 12 0 0 C10 -12 22 -12 34 0" fill="#ffd700" opacity="0.95"/>
                                    <path d="M-24 -24 C-10 -14 -4 -4 0 0 C-4 -10 -14 -24 -24 -24" fill="#ff9900" opacity="0.85"/>
                                    <path d="M24 -24 C10 -14 4 -4 0 0 C4 -10 14 -24 24 -24" fill="#ff9900" opacity="0.85"/>
                                    <path d="M-24 24 C-10 14 -4 4 0 0 C-4 10 -14 24 -24 24" fill="#ff9900" opacity="0.85"/>
                                    <path d="M24 24 C10 14 4 4 0 0 C4 10 14 24 24 24" fill="#ff9900" opacity="0.85"/>
                                    <circle cx="0" cy="0" r="10" fill="#e65100" stroke="#ffd700" stroke-width="2"/>
                                </g>
                            </svg>
                        </div>
                    `;
                } else if (this.isSafeSquare(r, c)) {
                    cell.classList.add('safe-square');
                    cell.innerHTML = `
                        <div class="cell-motif-container">
                            <svg class="cell-safe-svg" viewBox="0 0 100 100">
                                <line x1="12" y1="12" x2="88" y2="88" stroke="#3d2110" stroke-width="3.5" stroke-linecap="round"/>
                                <line x1="88" y1="12" x2="12" y2="88" stroke="#3d2110" stroke-width="3.5" stroke-linecap="round"/>
                                <line x1="12" y1="12" x2="88" y2="88" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="4 3"/>
                                <line x1="88" y1="12" x2="12" y2="88" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="4 3"/>
                                <circle cx="50" cy="50" r="16" fill="#e6c58e" stroke="#4a2d18" stroke-width="2"/>
                                <circle cx="50" cy="50" r="7" fill="#d4af37"/>
                            </svg>
                        </div>
                    `;
                }

                // Check entry home square positions
                for (let pIdx = 0; pIdx < 4; pIdx++) {
                    const startPos = this.getGridPosition(pIdx, 0);
                    if (startPos && r === startPos[0] && c === startPos[1]) {
                        cell.classList.add(`entry-square-p${pIdx}`);
                        const entryDot = document.createElement('div');
                        entryDot.className = `entry-house-marker marker-${this.playerColors[pIdx] || DEFAULT_COLORS[pIdx]}`;
                        entryDot.title = `Player ${pIdx + 1} Home Entry`;
                        cell.appendChild(entryDot);
                    }
                }

                const container = document.createElement('div');
                container.className = 'tokens-container';
                cell.appendChild(container);

                this.domBoard.appendChild(cell);
            }
        }
        this.renderTokens();
    }

    isSafeSquare(r, c) {
        if (this.boardSize === 5) {
            return (r === 0 && c === 2) || (r === 2 && c === 0) || (r === 2 && c === 2) || (r === 2 && c === 4) || (r === 4 && c === 2);
        } else {
            return (r === 0 && c === 0) || (r === 0 && c === 6) || (r === 6 && c === 0) || (r === 6 && c === 6) ||
                (r === 0 && c === 3) || (r === 3 && c === 0) || (r === 6 && c === 3) || (r === 3 && c === 6) ||
                (r === 1 && c === 1) || (r === 1 && c === 5) || (r === 5 && c === 1) || (r === 5 && c === 5) || (r === 3 && c === 3);
        }
    }

    isHomeSquare(r, c) {
        const mid = Math.floor(this.boardSize / 2);
        return r === mid && c === mid;
    }

    getGridPosition(playerIndex, pathIndex) {
        const path = this.boardSize === 5 ? PATH_5X5 : PATH_7X7;
        if (pathIndex < 0 || pathIndex >= path.length) return null;

        const [baseR, baseC] = path[pathIndex];
        const mid = Math.floor(this.boardSize / 2);

        if (baseR === mid && baseC === mid) return [mid, mid];

        const N = this.boardSize;
        switch (playerIndex) {
            case 0: return [baseR, baseC];                        // Bottom player
            case 1: return [baseC, N - 1 - baseR];                // Left player
            case 2: return [N - 1 - baseR, N - 1 - baseC];        // Top player
            case 3: return [N - 1 - baseC, baseR];                // Right player
            default: return [baseR, baseC];
        }
    }

    renderTokens() {
        document.querySelectorAll('.tokens-container').forEach(c => c.innerHTML = '');
        const t = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
        const pawnPrefix = t.pawnPrefix || 'P';

        this.players.forEach(player => {
            player.tokens.forEach(token => {
                if (token.pathIndex >= 0) {
                    const pos = this.getGridPosition(player.id, token.pathIndex);
                    if (pos) {
                        const [r, c] = pos;
                        const cell = this.domBoard.querySelector(`[data-r="${r}"][data-c="${c}"] .tokens-container`);
                        if (cell) {
                            const elem = document.createElement('div');
                            elem.className = `token ${player.color}`;
                            elem.dataset.playerId = player.id;
                            elem.dataset.tokenId = token.id;

                            // Pawn ID Badge inside token
                            const badge = document.createElement('span');
                            badge.className = 'pawn-id-label';
                            badge.innerText = `${pawnPrefix}${token.id + 1}`;
                            elem.appendChild(badge);

                            if (this.gameState === GameState.MOVE_PENDING && player.id === this.activePlayerIndex) {
                                const legalMoves = this.getLegalMoves(player, this.currentRoll.steps);
                                if (legalMoves.includes(token.id)) {
                                    elem.classList.add('selectable');
                                    elem.title = `Click to move Pawn ${token.id + 1} by ${this.currentRoll.steps} steps!`;
                                    elem.addEventListener('click', () => this.onTokenClick(token.id));
                                }
                            }
                            cell.appendChild(elem);
                        }
                    }
                }
            });
        });
    }

    onRollClick() {
        if (this.gameState !== GameState.ROLL_PENDING) return;

        const activePlayer = this.players[this.activePlayerIndex];
        if (activePlayer.isFinished) {
            this.advanceTurn();
            return;
        }

        this.gameState = GameState.ANIMATING;
        if (this.btnRoll) this.btnRoll.disabled = true;

        const cowrieBox = document.getElementById('cowrie-box');
        if (cowrieBox) {
            cowrieBox.classList.remove('rattling');
            void cowrieBox.offsetWidth;
            cowrieBox.classList.add('rattling');
        }

        let ups = 0;
        const shells = document.querySelectorAll('.cowrie-shell');

        // 3D Tumble Bounce animation on shells
        shells.forEach((shell, idx) => {
            const isUp = Math.random() < 0.5;
            if (isUp) ups++;

            shell.classList.remove('mouth-up', 'mouth-down', 'tumbling');
            void shell.offsetWidth;

            shell.style.animationDelay = `${idx * 60}ms`;
            shell.classList.add('tumbling');

            setTimeout(() => this.sound.roll(), idx * 70);

            setTimeout(() => {
                const rotX = isUp ? 0 : 180;
                const rotZ = Math.floor(Math.random() * 40) - 20;
                shell.className = `cowrie-shell ${isUp ? 'mouth-up' : 'mouth-down'}`;
                shell.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;
            }, 450 + idx * 40);
        });

        let steps = ups;
        let isGrace = false;
        if (ups === 0) { steps = 8; isGrace = true; }
        else if (ups === 4) { steps = 4; isGrace = true; }

        this.currentRoll = { ups, steps, isGrace };

        setTimeout(() => {
            if (this.rollResultDisplay) {
                this.rollResultDisplay.innerText = steps;
                this.rollResultDisplay.classList.remove('pop-scale');
                void this.rollResultDisplay.offsetWidth;
                this.rollResultDisplay.classList.add('pop-scale');
            }

            this.logRoll(`${activePlayer.name} rolled ${ups} Mouth-Up → ${steps} Steps${isGrace ? ' (BONUS ROLL)' : ''}!`);

            const legalMoves = this.getLegalMoves(activePlayer, steps);

            if (legalMoves.length === 0) {
                this.turnStatusMsg.innerText = 'No legal moves available!';
                setTimeout(() => this.advanceTurn(), 1200);
            } else {
                this.gameState = GameState.MOVE_PENDING;
                this.updateUI();
                this.renderTokens();

                if (activePlayer.isAI) {
                    setTimeout(() => this.playAIMove(legalMoves), 1000);
                }
            }
        }, 650);
    }

    getLegalMoves(player, steps) {
        if (player.isFinished) return [];

        const path = this.boardSize === 5 ? PATH_5X5 : PATH_7X7;
        const maxIndex = path.length - 1;
        const outerMax = this.boardSize === 5 ? 15 : 23;
        const legal = [];

        player.tokens.forEach(token => {
            if (token.pathIndex === maxIndex) return;

            let targetIndex = token.pathIndex + steps;

            // CAPTURE GUARD RULE (Chauka Bara Tradition):
            // If player has NOT captured any opponent token yet, token on outer ring cannot turn into inner ring (> outerMax).
            if (!player.hasCaptured && token.pathIndex <= outerMax && targetIndex > outerMax) {
                targetIndex = (token.pathIndex + steps) % (outerMax + 1);
            }

            if (targetIndex <= maxIndex) {
                legal.push(token.id);
            }
        });

        return legal;
    }

    onTokenClick(tokenId) {
        if (this.gameState !== GameState.MOVE_PENDING) return;
        this.executeMove(tokenId);
    }

    playAIMove(legalMoves) {
        if (this.gameState !== GameState.MOVE_PENDING) return;

        const activePlayer = this.players[this.activePlayerIndex];
        let chosenTokenId = legalMoves[0];
        const path = this.boardSize === 5 ? PATH_5X5 : PATH_7X7;
        const maxIndex = path.length - 1;
        const outerMax = this.boardSize === 5 ? 15 : 23;

        if (this.aiDiff === 'easy') {
            if (Math.random() < 0.5 && legalMoves.length > 1) {
                chosenTokenId = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }
        } else if (this.aiDiff === 'medium') {
            let maxScore = -9999;
            legalMoves.forEach(tId => {
                const token = activePlayer.tokens.find(t => t.id === tId);
                let targetIndex = token.pathIndex + this.currentRoll.steps;
                if (!activePlayer.hasCaptured && token.pathIndex <= outerMax && targetIndex > outerMax) {
                    targetIndex = (token.pathIndex + this.currentRoll.steps) % (outerMax + 1);
                }
                const [tr, tc] = this.getGridPosition(activePlayer.id, targetIndex);
                let score = targetIndex * 2;

                if (!this.isSafeSquare(tr, tc)) {
                    this.players.forEach(op => {
                        if (op.id !== activePlayer.id && op.teamId !== activePlayer.teamId && !op.isFinished) {
                            op.tokens.forEach(opt => {
                                if (opt.pathIndex > 0 && opt.pathIndex < maxIndex) {
                                    const [opr, opc] = this.getGridPosition(op.id, opt.pathIndex);
                                    if (opr === tr && opc === tc) score += 120;
                                }
                            });
                        }
                    });
                } else {
                    score += 30;
                }
                if (score > maxScore) { maxScore = score; chosenTokenId = tId; }
            });
        } else if (this.aiDiff === 'hard') {
            // Hard tier: 1-PLY EXPECTIMINIMAX over cowrie roll outcomes + opponent threat lookahead!
            const cowrieDistribution = [
                { steps: 1, prob: 0.25 },
                { steps: 2, prob: 0.375 },
                { steps: 3, prob: 0.25 },
                { steps: 4, prob: 0.0625 },
                { steps: 8, prob: 0.0625 }
            ];

            let bestExpectiVal = -99999;

            legalMoves.forEach(tId => {
                const token = activePlayer.tokens.find(t => t.id === tId);
                let targetIndex = token.pathIndex + this.currentRoll.steps;
                if (!activePlayer.hasCaptured && token.pathIndex <= outerMax && targetIndex > outerMax) {
                    targetIndex = (token.pathIndex + this.currentRoll.steps) % (outerMax + 1);
                }

                const [tr, tc] = this.getGridPosition(activePlayer.id, targetIndex);
                let immediateScore = targetIndex * 3;

                if (!this.isSafeSquare(tr, tc)) {
                    this.players.forEach(op => {
                        if (op.id !== activePlayer.id && op.teamId !== activePlayer.teamId && !op.isFinished) {
                            op.tokens.forEach(opt => {
                                if (opt.pathIndex > 0 && opt.pathIndex < maxIndex) {
                                    const [opr, opc] = this.getGridPosition(op.id, opt.pathIndex);
                                    if (opr === tr && opc === tc) {
                                        immediateScore += 160;
                                    }
                                }
                            });
                        }
                    });
                } else {
                    immediateScore += 40;
                }

                if (targetIndex === maxIndex) immediateScore += 200;

                // 1-Ply Lookahead: Calculate expected risk of capture by opponents on their turn
                let expectedOpponentRisk = 0;

                if (!this.isSafeSquare(tr, tc)) {
                    this.players.forEach(op => {
                        if (op.id !== activePlayer.id && op.teamId !== activePlayer.teamId && !op.isFinished) {
                            op.tokens.forEach(opt => {
                                if (opt.pathIndex > 0 && opt.pathIndex < maxIndex) {
                                    cowrieDistribution.forEach(dist => {
                                        let opTarget = opt.pathIndex + dist.steps;
                                        if (!op.hasCaptured && opt.pathIndex <= outerMax && opTarget > outerMax) {
                                            opTarget = (opt.pathIndex + dist.steps) % (outerMax + 1);
                                        }
                                        if (opTarget <= maxIndex) {
                                            const opPos = this.getGridPosition(op.id, opTarget);
                                            if (opPos) {
                                                const [opr, opc] = opPos;
                                                if (opr === tr && opc === tc) {
                                                    expectedOpponentRisk += dist.prob * 140;
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                const totalVal = immediateScore - expectedOpponentRisk;
                if (totalVal > bestExpectiVal) {
                    bestExpectiVal = totalVal;
                    chosenTokenId = tId;
                }
            });
        }

        this.executeMove(chosenTokenId);
    }

    executeMove(tokenId) {
        this.gameState = GameState.ANIMATING;
        const activePlayer = this.players[this.activePlayerIndex];
        const token = activePlayer.tokens.find(t => t.id === tokenId);
        const maxIndex = (this.boardSize === 5 ? PATH_5X5 : PATH_7X7).length - 1;
        const outerMax = this.boardSize === 5 ? 15 : 23;

        // Animate token hop
        const currentPos = this.getGridPosition(activePlayer.id, token.pathIndex);
        if (currentPos && this.domBoard) {
            const [cr, cc] = currentPos;
            const tokenElem = this.domBoard.querySelector(`[data-r="${cr}"][data-c="${cc}"] [data-player-id="${activePlayer.id}"][data-token-id="${tokenId}"]`);
            if (tokenElem) {
                tokenElem.classList.add('hopping');
            }
        }

        let targetIndex = token.pathIndex + this.currentRoll.steps;

        if (!activePlayer.hasCaptured && token.pathIndex <= outerMax && targetIndex > outerMax) {
            targetIndex = (token.pathIndex + this.currentRoll.steps) % (outerMax + 1);
        }

        token.pathIndex = targetIndex;

        this.sound.move();
        const [tr, tc] = this.getGridPosition(activePlayer.id, targetIndex);

        this.logMove(`${activePlayer.name} moved Pawn ${tokenId + 1} to (${tr}, ${tc}).`);

        let captured = false;
        if (!this.isSafeSquare(tr, tc)) {
            this.players.forEach(op => {
                if (op.id !== activePlayer.id && op.teamId !== activePlayer.teamId && !op.isFinished) {
                    op.tokens.forEach(opt => {
                        if (opt.pathIndex > 0 && opt.pathIndex < maxIndex) {
                            const [opr, opc] = this.getGridPosition(op.id, opt.pathIndex);
                            if (opr === tr && opc === tc) {
                                opt.pathIndex = 0; // Captured back to start!
                                captured = true;
                                activePlayer.hasCaptured = true;
                                this.sound.capture();
                                this.logCapture(`💥 ${activePlayer.name} captured ${op.name}'s pawn! Inner ring unlocked!`);
                            }
                        }
                    });
                }
            });
        }

        setTimeout(() => {
            this.renderTokens();
            this.updateScores();

            if (!activePlayer.isFinished && activePlayer.tokens.every(t => t.pathIndex === maxIndex)) {
                activePlayer.isFinished = true;
                const rankNum = this.finishedPlayers.length + 1;
                activePlayer.rank = rankNum;
                this.finishedPlayers.push(activePlayer);
                this.sound.win();
                this.logSystem(`🏆 ${activePlayer.name} HAS FINISHED IN RANK #${rankNum}!`);

                const activeRemaining = this.players.filter(p => !p.isFinished);
                if (activeRemaining.length <= 1 || this.players.length === 2) {
                    this.gameState = GameState.GAME_OVER;
                    let resultMsg = `🎉 ${this.finishedPlayers[0].name} HAS WON 1ST PLACE! 🎉`;
                    if (this.finishedPlayers.length > 1) {
                        resultMsg += `<br><br>🏆 Final Ranks: ` + this.finishedPlayers.map(p => `#${p.rank}: ${p.name}`).join(' | ');
                    }
                    document.getElementById('victory-msg').innerHTML = resultMsg;
                    this.modalVictory.style.display = 'flex';
                    return;
                }
            }

            if (this.currentRoll.isGrace || captured) {
                this.gameState = GameState.ROLL_PENDING;
                this.turnStatusMsg.innerText = 'Bonus Roll Awarded!';
                this.updateUI();
                if (activePlayer.isAI && !activePlayer.isFinished) setTimeout(() => this.onRollClick(), 1000);
            } else {
                setTimeout(() => this.advanceTurn(), 500);
            }
        }, 280);
    }

    advanceTurn() {
        const activeRemaining = this.players.filter(p => !p.isFinished);
        if (activeRemaining.length <= 1 && this.finishedPlayers.length > 0) {
            this.gameState = GameState.GAME_OVER;
            return;
        }

        do {
            this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        } while (this.players[this.activePlayerIndex].isFinished && activeRemaining.length > 0);

        this.gameState = GameState.ROLL_PENDING;
        this.currentRoll = null;
        if (this.rollResultDisplay) this.rollResultDisplay.innerText = '-';
        this.updateUI();

        const activePlayer = this.players[this.activePlayerIndex];
        if (activePlayer && activePlayer.isAI && !activePlayer.isFinished) {
            setTimeout(() => this.onRollClick(), 1000);
        }
    }

    updateScores() {
        const maxIndex = (this.boardSize === 5 ? PATH_5X5 : PATH_7X7).length - 1;
        this.players.forEach((p, idx) => {
            const homeCount = p.tokens.filter(t => t.pathIndex === maxIndex).length;
            const scoreRow = document.getElementById(`score-p${idx}`);
            if (scoreRow) {
                scoreRow.style.display = 'flex';
                scoreRow.querySelector('.p-name').innerText = p.name;
                scoreRow.querySelector('.p-score').innerText = `${homeCount} / 4`;
                scoreRow.querySelector('.p-dot').className = `p-dot ${p.color}`;
            }
        });
        // Hide unused player score rows
        for (let idx = this.players.length; idx < 4; idx++) {
            const scoreRow = document.getElementById(`score-p${idx}`);
            if (scoreRow) scoreRow.style.display = 'none';
        }
    }

    updateUI() {
        const activePlayer = this.players[this.activePlayerIndex];
        if (!activePlayer) return;

        if (this.activePlayerName) {
            this.activePlayerName.innerText = activePlayer.name;
        }
        if (this.activePlayerDisplay) {
            this.activePlayerDisplay.className = `player-badge p${activePlayer.id}-badge`;
            const dot = this.activePlayerDisplay.querySelector('.avatar-dot');
            if (dot) {
                dot.style.background = activePlayer.color;
            }
        }

        if (this.turnStatusMsg) {
            if (this.gameState === GameState.PAUSED) {
                this.turnStatusMsg.innerText = 'Game Paused';
            } else if (this.gameState === GameState.ROLL_PENDING) {
                this.turnStatusMsg.innerText = activePlayer.isAI ? 'AI is thinking...' : 'Roll the Cowrie Shells! (Space)';
            } else if (this.gameState === GameState.MOVE_PENDING) {
                this.turnStatusMsg.innerText = activePlayer.isAI ? 'AI selecting token...' : 'Select glowing token! (Keys 1-4)';
            }
        }

        if (this.btnRoll) {
            if (this.gameState === GameState.ROLL_PENDING) {
                this.btnRoll.disabled = activePlayer.isAI;
            } else if (this.gameState === GameState.MOVE_PENDING || this.gameState === GameState.PAUSED) {
                this.btnRoll.disabled = true;
            }
        }
    }

    logSystem(msg) { this.addLog(msg, 'system'); }
    logRoll(msg) { this.addLog(msg, 'roll'); }
    logMove(msg) { this.addLog(msg, 'move'); }
    logCapture(msg) { this.addLog(msg, 'capture'); }

    addLog(msg, type) {
        if (!this.moveLog) return;
        const p = document.createElement('p');
        p.className = `log-entry ${type}`;
        p.innerHTML = msg;
        this.moveLog.appendChild(p);
        this.moveLog.scrollTop = this.moveLog.scrollHeight;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new ChaukaBaraApp();
});
