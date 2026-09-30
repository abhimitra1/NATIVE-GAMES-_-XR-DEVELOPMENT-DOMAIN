/**
 * KAUDI GAME APPLICATION LOGIC
 * Implements the digital ruleset, FSM, UI controller, and AI heuristic policy
 * from 18_Kaudi.docx & IKS Games Design Bible v1.0.
 */

// Multi-language dictionary (English, Hindi, Odia)
const I18N = {
  en: {
    title: 'Kaudi',
    subtitle: 'Traditional Cowrie Shell Scoring Game',
    target: 'Target',
    points: 'Points',
    turn: "'s Turn",
    tossBtn: 'Toss Cowries',
    bankBtn: 'Bank Points',
    rolling: 'Tossing cowries...',
    ashta: 'Ashta! (All Down - 8 Pts + Bonus Roll!)',
    chhaka: 'Chhaka! (All Up - 4 Pts + Bonus Roll!)',
    bustMsg: 'Bust! Lost unbanked points!',
    winMsg: 'Winner!',
    roundBank: 'Current Round Pot',
    bonusRoll: 'Bonus Roll Awarded!',
    aiThinking: 'AI is thinking...',
    modeClassic: 'Classic Kaudi',
    modePressLuck: 'Press-Your-Luck',
  },
  hi: {
    title: 'कौड़ी',
    subtitle: 'पारंपरिक भारतीय कौड़ी खेल',
    target: 'लक्ष्य',
    points: 'अंक',
    turn: ' की बारी',
    tossBtn: 'कौड़ियाँ फेंकें',
    bankBtn: 'अंक सुरक्षित करें',
    rolling: 'कौड़ियाँ फेंक रहे हैं...',
    ashta: 'अष्ट! (सभी बंद - 8 अंक + अतिरिक्त बारी!)',
    chhaka: 'छक्का! (सभी खुली - 4 अंक + अतिरिक्त बारी!)',
    bustMsg: 'बस्ट! इस राउंड के अंक समाप्त!',
    winMsg: 'विजेता!',
    roundBank: 'इस राउंड के अंक',
    bonusRoll: 'अतिरिक्त बारी मिली!',
    aiThinking: 'एआई सोच रहा है...',
    modeClassic: 'पारंपरिक कौड़ी',
    modePressLuck: 'प्रेस-योर-लक',
  },
  od: {
    title: 'କଉଡ଼ି ଖେଳ',
    subtitle: 'ପାରମ୍ପରିକ ଭାରତୀୟ କଉଡ଼ି ଖେଳ',
    target: 'ଲକ୍ଷ୍ୟ',
    points: 'ପଏଣ୍ଟ',
    turn: 'ଙ୍କ ପାଳି',
    tossBtn: 'କଉଡ଼ି ଫିଙ୍ଗନ୍ତୁ',
    bankBtn: 'ପଏଣ୍ଟ ରଖନ୍ତୁ',
    rolling: 'କଉଡ଼ି ଫିଙ୍ଗା ଚାଲିଛି...',
    ashta: 'ଅଷ୍ଟ! (ସବୁ ତଳମୁହାଁ - ୮ ପଏଣ୍ଟ + ବୋନସ!)',
    chhaka: 'ଛକା! (ସବୁ ଉପରମୁହାଁ - ୪ ପଏଣ୍ଟ + ବୋନସ!)',
    bustMsg: 'ବଷ୍ଟ! ଏହି ରାଉଣ୍ଡ ପଏଣ୍ଟ ନଷ୍ଟ!',
    winMsg: 'ବିଜେତା!',
    roundBank: 'ଏହି ରାଉଣ୍ଡ ପଏଣ୍ଟ',
    bonusRoll: 'ଆଉ ଏକ ସୁଯୋଗ ମିଳିଲା!',
    aiThinking: 'ଏଆଇ ଭାବୁଛି...',
    modeClassic: 'ପାରମ୍ପରିକ କଉଡ଼ି',
    modePressLuck: 'ପ୍ରେସ-ୟୋର-ଲକ୍',
  }
};

class KaudiGame {
  constructor() {
    this.dice = new CowrieDice({ shellCount: 4 });
    this.audio = window.kaudiAudio;

    // Configurable Game Settings
    this.settings = {
      shellCount: 4,
      targetScore: 50,
      gameMode: 'classic', // 'classic' | 'press_your_luck'
      aiDifficulty: 'medium', // 'easy' | 'medium' | 'hard'
      theme: 'teak', // 'teak' | 'indigo' | 'terracotta'
      lang: 'en'
    };

    // Players list
    this.players = [
      { id: 1, name: 'Player 1', isAI: false, glyph: '☀️', colorClass: 'p1-badge', score: 0 },
      { id: 2, name: 'Kaudi AI', isAI: true, glyph: '🪶', colorClass: 'p2-badge', score: 0 }
    ];

    // State Variables
    this.currentPlayerIndex = 0;
    this.roundBank = 0;
    this.bonusStreak = 0;
    this.isTossing = false;
    this.gameOver = false;
    this.lastRoll = null;

    this.initDOM();
    this.initEvents();
    this.loadSettings();
    this.resetGame();
  }

  initDOM() {
    this.dom = {
      shellsStage: document.getElementById('shellsStage'),
      playersContainer: document.getElementById('playersContainer'),
      turnBanner: document.getElementById('turnBanner'),
      readoutCard: document.getElementById('readoutCard'),
      readoutTitle: document.getElementById('readoutTitle'),
      readoutDetail: document.getElementById('readoutDetail'),
      roundBankDisplay: document.getElementById('roundBankDisplay'),
      btnToss: document.getElementById('btnToss'),
      btnBank: document.getElementById('btnBank'),
      logContainer: document.getElementById('logContainer'),
      scoringTableBody: document.getElementById('scoringTableBody'),
      targetBadge: document.getElementById('targetBadge'),
      
      // Modals
      rulesModal: document.getElementById('rulesModal'),
      loreModal: document.getElementById('loreModal'),
      settingsModal: document.getElementById('settingsModal'),
      victoryModal: document.getElementById('victoryModal'),
      
      // Buttons in Header
      btnRules: document.getElementById('btnRules'),
      btnLore: document.getElementById('btnLore'),
      btnSettings: document.getElementById('btnSettings'),
      btnSound: document.getElementById('btnSound'),
      btnRestart: document.getElementById('btnRestart'),

      // Settings toggles
      btnThemeTeak: document.getElementById('btnThemeTeak'),
      btnThemeIndigo: document.getElementById('btnThemeIndigo'),
      btnThemeClay: document.getElementById('btnThemeClay'),
      btnShell4: document.getElementById('btnShell4'),
      btnShell6: document.getElementById('btnShell6'),
      btnShell7: document.getElementById('btnShell7'),
      btnTarget25: document.getElementById('btnTarget25'),
      btnTarget50: document.getElementById('btnTarget50'),
      btnTarget100: document.getElementById('btnTarget100'),
      btnModeClassic: document.getElementById('btnModeClassic'),
      btnModeLuck: document.getElementById('btnModeLuck'),
      btnAIDiffEasy: document.getElementById('btnAIDiffEasy'),
      btnAIDiffMed: document.getElementById('btnAIDiffMed'),
      btnAIDiffHard: document.getElementById('btnAIDiffHard'),
      btnLangEn: document.getElementById('btnLangEn'),
      btnLangHi: document.getElementById('btnLangHi'),
      btnLangOd: document.getElementById('btnLangOd'),
      btnPlayerCount2: document.getElementById('btnPlayerCount2'),
      btnPlayerCount3: document.getElementById('btnPlayerCount3'),
      btnPlayerCount4: document.getElementById('btnPlayerCount4'),
      btnPassPlay: document.getElementById('btnPassPlay'),
      btnVsAI: document.getElementById('btnVsAI'),
      
      // Victory elements
      winnerName: document.getElementById('winnerName'),
      winnerScore: document.getElementById('winnerScore'),
      btnPlayAgain: document.getElementById('btnPlayAgain')
    };
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('kaudi_game_settings');
      if (saved) {
        this.settings = Object.assign(this.settings, JSON.parse(saved));
      }
    } catch (e) {}

    this.applyTheme(this.settings.theme);
    this.dice.setShellCount(this.settings.shellCount);
    this.updateSettingsUI();
  }

  saveSettings() {
    try {
      localStorage.setItem('kaudi_game_settings', JSON.stringify(this.settings));
    } catch (e) {}
  }

  applyTheme(theme) {
    this.settings.theme = theme;
    if (theme === 'teak') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', theme);
    }
    this.saveSettings();
  }

  initEvents() {
    this.dom.btnToss.addEventListener('click', () => {
      this.audio.ensureContext();
      this.handlePlayerToss();
    });

    this.dom.btnBank.addEventListener('click', () => {
      this.audio.ensureContext();
      this.handlePlayerBank();
    });

    this.dom.btnRestart.addEventListener('click', () => {
      this.audio.playClick();
      if (confirm('Start a new game match?')) {
        this.resetGame();
      }
    });

    // Sound toggle
    this.dom.btnSound.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      this.updateSoundButtonUI(isMuted);
    });

    // Modals
    this.dom.btnRules.addEventListener('click', () => this.openModal(this.dom.rulesModal));
    this.dom.btnLore.addEventListener('click', () => this.openModal(this.dom.loreModal));
    this.dom.btnSettings.addEventListener('click', () => this.openModal(this.dom.settingsModal));
    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.closeModal(this.dom.victoryModal);
      this.resetGame();
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audio.playClick();
        const modal = e.target.closest('.modal-overlay');
        if (modal) this.closeModal(modal);
      });
    });

    // Settings listeners
    this.setupSettingsListeners();
  }

  updateSoundButtonUI(isMuted) {
    this.dom.btnSound.innerHTML = isMuted 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
  }

  openModal(modal) {
    this.audio.playClick();
    modal.classList.add('active');
  }

  closeModal(modal) {
    modal.classList.remove('active');
  }

  setupSettingsListeners() {
    // Theme options
    this.dom.btnThemeTeak.addEventListener('click', () => { this.applyTheme('teak'); this.updateSettingsUI(); });
    this.dom.btnThemeIndigo.addEventListener('click', () => { this.applyTheme('indigo'); this.updateSettingsUI(); });
    this.dom.btnThemeClay.addEventListener('click', () => { this.applyTheme('terracotta'); this.updateSettingsUI(); });

    // Shell Count
    const setShells = (count) => {
      this.settings.shellCount = count;
      this.dice.setShellCount(count);
      this.saveSettings();
      this.updateSettingsUI();
      this.resetGame();
    };
    this.dom.btnShell4.addEventListener('click', () => setShells(4));
    this.dom.btnShell6.addEventListener('click', () => setShells(6));
    this.dom.btnShell7.addEventListener('click', () => setShells(7));

    // Target Score
    const setTarget = (t) => {
      this.settings.targetScore = t;
      this.saveSettings();
      this.updateSettingsUI();
      this.resetGame();
    };
    this.dom.btnTarget25.addEventListener('click', () => setTarget(25));
    this.dom.btnTarget50.addEventListener('click', () => setTarget(50));
    this.dom.btnTarget100.addEventListener('click', () => setTarget(100));

    // Game Mode
    this.dom.btnModeClassic.addEventListener('click', () => {
      this.settings.gameMode = 'classic';
      this.saveSettings();
      this.updateSettingsUI();
      this.resetGame();
    });
    this.dom.btnModeLuck.addEventListener('click', () => {
      this.settings.gameMode = 'press_your_luck';
      this.saveSettings();
      this.updateSettingsUI();
      this.resetGame();
    });

    // AI Difficulty
    this.dom.btnAIDiffEasy.addEventListener('click', () => { this.settings.aiDifficulty = 'easy'; this.saveSettings(); this.updateSettingsUI(); });
    this.dom.btnAIDiffMed.addEventListener('click', () => { this.settings.aiDifficulty = 'medium'; this.saveSettings(); this.updateSettingsUI(); });
    this.dom.btnAIDiffHard.addEventListener('click', () => { this.settings.aiDifficulty = 'hard'; this.saveSettings(); this.updateSettingsUI(); });

    // Language
    this.dom.btnLangEn.addEventListener('click', () => { this.settings.lang = 'en'; this.saveSettings(); this.updateSettingsUI(); this.updateLocalizedText(); });
    this.dom.btnLangHi.addEventListener('click', () => { this.settings.lang = 'hi'; this.saveSettings(); this.updateSettingsUI(); this.updateLocalizedText(); });
    this.dom.btnLangOd.addEventListener('click', () => { this.settings.lang = 'od'; this.saveSettings(); this.updateSettingsUI(); this.updateLocalizedText(); });

    // Player Configuration (Vs AI vs Pass & Play)
    this.dom.btnVsAI.addEventListener('click', () => {
      this.setPlayerMode(false);
      this.updateSettingsUI();
      this.resetGame();
    });
    this.dom.btnPassPlay.addEventListener('click', () => {
      this.setPlayerMode(true);
      this.updateSettingsUI();
      this.resetGame();
    });

    // Player Count
    this.dom.btnPlayerCount2.addEventListener('click', () => { this.changePlayerCount(2); this.updateSettingsUI(); this.resetGame(); });
    this.dom.btnPlayerCount3.addEventListener('click', () => { this.changePlayerCount(3); this.updateSettingsUI(); this.resetGame(); });
    this.dom.btnPlayerCount4.addEventListener('click', () => { this.changePlayerCount(4); this.updateSettingsUI(); this.resetGame(); });
  }

  setPlayerMode(isPassAndPlay) {
    if (isPassAndPlay) {
      this.players.forEach((p, idx) => {
        p.isAI = false;
        p.name = `Player ${idx + 1}`;
      });
    } else {
      this.players[0].isAI = false;
      this.players[0].name = 'Player 1';
      for (let i = 1; i < this.players.length; i++) {
        this.players[i].isAI = true;
        this.players[i].name = `AI Bot ${i}`;
      }
    }
  }

  changePlayerCount(count) {
    const glyphs = ['☀️', '🪶', '🏵️', '🐚'];
    const badgeClasses = ['p1-badge', 'p2-badge', 'p3-badge', 'p4-badge'];
    const isCurrentlyVsAI = this.players[1] ? this.players[1].isAI : false;

    this.players = [];
    for (let i = 0; i < count; i++) {
      const isAI = isCurrentlyVsAI && i > 0;
      this.players.push({
        id: i + 1,
        name: isAI ? `AI Bot ${i}` : `Player ${i + 1}`,
        isAI: isAI,
        glyph: glyphs[i],
        colorClass: badgeClasses[i],
        score: 0
      });
    }
  }

  updateSettingsUI() {
    const s = this.settings;
    
    // Theme
    [this.dom.btnThemeTeak, this.dom.btnThemeIndigo, this.dom.btnThemeClay].forEach(b => b.classList.remove('active'));
    if (s.theme === 'teak') this.dom.btnThemeTeak.classList.add('active');
    if (s.theme === 'indigo') this.dom.btnThemeIndigo.classList.add('active');
    if (s.theme === 'terracotta') this.dom.btnThemeClay.classList.add('active');

    // Shells
    [this.dom.btnShell4, this.dom.btnShell6, this.dom.btnShell7].forEach(b => b.classList.remove('active'));
    if (s.shellCount === 4) this.dom.btnShell4.classList.add('active');
    if (s.shellCount === 6) this.dom.btnShell6.classList.add('active');
    if (s.shellCount === 7) this.dom.btnShell7.classList.add('active');

    // Target
    [this.dom.btnTarget25, this.dom.btnTarget50, this.dom.btnTarget100].forEach(b => b.classList.remove('active'));
    if (s.targetScore === 25) this.dom.btnTarget25.classList.add('active');
    if (s.targetScore === 50) this.dom.btnTarget50.classList.add('active');
    if (s.targetScore === 100) this.dom.btnTarget100.classList.add('active');

    // Mode
    [this.dom.btnModeClassic, this.dom.btnModeLuck].forEach(b => b.classList.remove('active'));
    if (s.gameMode === 'classic') this.dom.btnModeClassic.classList.add('active');
    if (s.gameMode === 'press_your_luck') this.dom.btnModeLuck.classList.add('active');

    // AI Difficulty
    [this.dom.btnAIDiffEasy, this.dom.btnAIDiffMed, this.dom.btnAIDiffHard].forEach(b => b.classList.remove('active'));
    if (s.aiDifficulty === 'easy') this.dom.btnAIDiffEasy.classList.add('active');
    if (s.aiDifficulty === 'medium') this.dom.btnAIDiffMed.classList.add('active');
    if (s.aiDifficulty === 'hard') this.dom.btnAIDiffHard.classList.add('active');

    // Language
    [this.dom.btnLangEn, this.dom.btnLangHi, this.dom.btnLangOd].forEach(b => b.classList.remove('active'));
    if (s.lang === 'en') this.dom.btnLangEn.classList.add('active');
    if (s.lang === 'hi') this.dom.btnLangHi.classList.add('active');
    if (s.lang === 'od') this.dom.btnLangOd.classList.add('active');

    // Player Count
    [this.dom.btnPlayerCount2, this.dom.btnPlayerCount3, this.dom.btnPlayerCount4].forEach(b => b.classList.remove('active'));
    if (this.players.length === 2) this.dom.btnPlayerCount2.classList.add('active');
    if (this.players.length === 3) this.dom.btnPlayerCount3.classList.add('active');
    if (this.players.length === 4) this.dom.btnPlayerCount4.classList.add('active');

    // Vs AI vs Pass & Play
    const hasAI = this.players.some(p => p.isAI);
    [this.dom.btnVsAI, this.dom.btnPassPlay].forEach(b => b.classList.remove('active'));
    if (hasAI) this.dom.btnVsAI.classList.add('active');
    else this.dom.btnPassPlay.classList.add('active');

    this.updateScoringTable();
    this.updateSoundButtonUI(this.audio.isMuted);
  }

  updateLocalizedText() {
    const t = I18N[this.settings.lang] || I18N.en;
    this.dom.targetBadge.textContent = `${t.target}: ${this.settings.targetScore}`;
    this.dom.btnToss.textContent = t.tossBtn;
    this.dom.btnBank.textContent = t.bankBtn;
    this.updateTurnUI();
  }

  resetGame() {
    this.players.forEach(p => p.score = 0);
    this.currentPlayerIndex = 0;
    this.roundBank = 0;
    this.bonusStreak = 0;
    this.isTossing = false;
    this.gameOver = false;
    this.lastRoll = null;

    this.dom.logContainer.innerHTML = '';
    this.dom.readoutCard.className = 'toss-readout-card';
    this.dom.readoutTitle.textContent = 'Welcome to Kaudi';
    this.dom.readoutDetail.textContent = 'Tap "Toss Cowries" to make your first roll!';
    this.dom.roundBankDisplay.style.display = 'none';

    this.createShellElements();
    this.renderPlayers();
    this.updateTurnUI();
    this.updateScoringTable();
    this.updateLocalizedText();

    // Check if player 1 is AI
    this.checkAITurn();
  }

  createShellElements() {
    this.dom.shellsStage.innerHTML = '';
    const count = this.settings.shellCount;

    for (let i = 0; i < count; i++) {
      const shellEl = document.createElement('div');
      shellEl.className = 'cowrie-shell';
      shellEl.id = `shell-${i}`;

      // Default circular spread
      const angle = (i / count) * Math.PI * 2;
      const radius = 60;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      shellEl.style.transform = `translate(${x}px, ${y}px) rotate(${i * 45}deg)`;
      shellEl.innerHTML = this.getShellSVG(true); // mouth up initially
      this.dom.shellsStage.appendChild(shellEl);
    }
  }

  renderPlayers() {
    this.dom.playersContainer.innerHTML = '';
    this.players.forEach((player, idx) => {
      const isActive = idx === this.currentPlayerIndex;
      const card = document.createElement('div');
      card.className = `player-card ${isActive ? 'active' : ''}`;
      card.id = `player-card-${idx}`;

      const progressPct = Math.min(100, Math.round((player.score / this.settings.targetScore) * 100));

      card.innerHTML = `
        <div class="player-info">
          <div class="side-glyph-badge ${player.colorClass}">
            ${player.glyph}
          </div>
          <div class="player-names">
            <span class="player-name">${player.name}</span>
            <span class="player-type">${player.isAI ? 'AI Opponent' : 'Human Player'}</span>
          </div>
        </div>
        <div class="player-score-box">
          <div class="player-score">${player.score}</div>
          <div class="player-score-label">${progressPct}% to win</div>
        </div>
        <div class="score-progress" style="position: absolute; bottom: 0; left: 0; right: 0;">
          <div class="score-progress-fill" style="width: ${progressPct}%"></div>
        </div>
      `;
      this.dom.playersContainer.appendChild(card);
    });
  }

  updateTurnUI() {
    const t = I18N[this.settings.lang] || I18N.en;
    const curPlayer = this.players[this.currentPlayerIndex];
    
    this.dom.turnBanner.innerHTML = `
      <span class="side-glyph-badge ${curPlayer.colorClass}" style="width: 22px; height: 22px; font-size: 11px;">
        ${curPlayer.glyph}
      </span>
      <span>${curPlayer.name}${t.turn}</span>
    `;

    // Highlight active card
    document.querySelectorAll('.player-card').forEach((c, idx) => {
      if (idx === this.currentPlayerIndex) c.classList.add('active');
      else c.classList.remove('active');
    });

    // Control buttons state
    if (this.gameOver || this.isTossing || curPlayer.isAI) {
      this.dom.btnToss.disabled = true;
      this.dom.btnBank.disabled = true;
    } else {
      this.dom.btnToss.disabled = false;
      // In Press-Your-Luck, Bank is available if roundBank > 0
      if (this.settings.gameMode === 'press_your_luck') {
        this.dom.btnBank.disabled = this.roundBank <= 0;
        this.dom.btnBank.style.display = 'flex';
      } else {
        this.dom.btnBank.style.display = 'none';
      }
    }
  }

  /**
   * Executes a Cowrie Roll
   */
  async executeRoll() {
    if (this.isTossing || this.gameOver) return;
    this.isTossing = true;
    this.updateTurnUI();

    const t = I18N[this.settings.lang] || I18N.en;
    this.dom.readoutTitle.textContent = t.rolling;
    this.dom.readoutDetail.textContent = 'Watching how the cowrie shells land...';
    this.dom.readoutCard.className = 'toss-readout-card';

    // Play synthesized clatter sound
    this.audio.playToss();

    // Roll logic
    const bustThreshold = (this.settings.gameMode === 'press_your_luck') ? 2 : 0;
    const result = this.dice.roll(this.settings.gameMode, bustThreshold);
    this.lastRoll = result;

    // Animate Shells in DOM
    const shells = document.querySelectorAll('.cowrie-shell');
    shells.forEach((shellEl, i) => {
      const data = result.shells[i];
      shellEl.classList.remove('tossing');
      void shellEl.offsetWidth; // trigger reflow

      shellEl.style.setProperty('--tx', `${data.scatterX}px`);
      shellEl.style.setProperty('--ty', `${data.scatterY}px`);
      shellEl.style.setProperty('--rot', `${data.angle}deg`);
      shellEl.style.setProperty('--rx', `${data.pitch}deg`);
      shellEl.style.setProperty('--ry', `${data.roll}deg`);

      shellEl.classList.add('tossing');

      // Swap graphic half-way through the toss tumble
      setTimeout(() => {
        shellEl.innerHTML = this.getShellSVG(data.up);
        this.audio.playBounce(0.35 + Math.random() * 0.3);
      }, 420);
    });

    // Wait for toss animation to conclude
    await new Promise(res => setTimeout(res, 850));

    this.resolveRoll(result);
  }

  resolveRoll(result) {
    this.isTossing = false;
    const t = I18N[this.settings.lang] || I18N.en;
    const curPlayer = this.players[this.currentPlayerIndex];

    this.highlightScoringTableRow(result.upCount);

    if (this.settings.gameMode === 'classic') {
      // CLASSIC ANTHOLOGY RULES
      curPlayer.score += result.points;
      this.renderPlayers();

      if (result.isBonus) {
        this.bonusStreak++;
        this.audio.playBonus();
        this.dom.readoutCard.className = 'toss-readout-card bonus';
        this.dom.readoutTitle.textContent = result.upCount === 0 ? t.ashta : t.chhaka;
        this.dom.readoutDetail.textContent = `Scored +${result.points} pts! ${t.bonusRoll}`;
        this.logThrow(curPlayer, result, `+${result.points} pts (Bonus Roll!)`, 'bonus-log');

        // Check Win
        if (curPlayer.score >= this.settings.targetScore) {
          this.triggerVictory(curPlayer);
          return;
        }

        // Cap consecutive bonus throws to 3 to prevent infinite runs
        if (this.bonusStreak >= 3) {
          this.dom.readoutDetail.textContent = `Scored +${result.points} pts. (Max bonus roll limit reached)`;
          this.bonusStreak = 0;
          setTimeout(() => this.nextPlayer(), 1200);
        } else {
          // Same player throws again!
          this.updateTurnUI();
          this.checkAITurn();
        }
      } else {
        this.bonusStreak = 0;
        this.dom.readoutTitle.textContent = `${result.upCount} Mouth Up, ${result.downCount} Down`;
        this.dom.readoutDetail.textContent = `Scored +${result.points} points.`;
        this.logThrow(curPlayer, result, `+${result.points} pts`);

        if (curPlayer.score >= this.settings.targetScore) {
          this.triggerVictory(curPlayer);
          return;
        }

        // Pass to next player
        setTimeout(() => this.nextPlayer(), 1300);
      }
    } else {
      // PRESS-YOUR-LUCK RULES
      if (result.isBust) {
        this.audio.playBust();
        this.dom.readoutCard.className = 'toss-readout-card bust';
        this.dom.readoutTitle.textContent = t.bustMsg;
        this.dom.readoutDetail.textContent = `Lost ${this.roundBank} unbanked round points.`;
        this.logThrow(curPlayer, result, `Bust! Lost ${this.roundBank} pts`, 'bust-log');

        this.roundBank = 0;
        this.dom.roundBankDisplay.style.display = 'none';
        this.bonusStreak = 0;

        setTimeout(() => this.nextPlayer(), 1500);
      } else {
        this.roundBank += result.points;
        this.dom.roundBankDisplay.style.display = 'inline-block';
        this.dom.roundBankDisplay.textContent = `${t.roundBank}: ${this.roundBank} pts`;

        if (result.isBonus) {
          this.audio.playBonus();
          this.dom.readoutCard.className = 'toss-readout-card bonus';
          this.dom.readoutTitle.textContent = result.upCount === 0 ? t.ashta : t.chhaka;
          this.dom.readoutDetail.textContent = `+${result.points} pts to pot! Bank or keep rolling?`;
        } else {
          this.dom.readoutTitle.textContent = `${result.upCount} Mouth Up (+${result.points} pts)`;
          this.dom.readoutDetail.textContent = `Round Pot: ${this.roundBank} pts. Bank safely or roll again?`;
        }

        this.logThrow(curPlayer, result, `Pot: ${this.roundBank} pts`);

        // Check if current banked + roundBank >= target
        if (curPlayer.score + this.roundBank >= this.settings.targetScore) {
          // Auto bank and win!
          this.bankCurrentPoints();
          return;
        }

        this.updateTurnUI();
        this.checkAITurn();
      }
    }
  }

  handlePlayerToss() {
    const curPlayer = this.players[this.currentPlayerIndex];
    if (curPlayer.isAI || this.isTossing || this.gameOver) return;
    this.executeRoll();
  }

  handlePlayerBank() {
    const curPlayer = this.players[this.currentPlayerIndex];
    if (curPlayer.isAI || this.isTossing || this.gameOver) return;
    this.bankCurrentPoints();
  }

  bankCurrentPoints() {
    const curPlayer = this.players[this.currentPlayerIndex];
    if (this.roundBank <= 0) return;

    curPlayer.score += this.roundBank;
    this.audio.playBank();

    this.logThrow(curPlayer, null, `Banked ${this.roundBank} pts (Total: ${curPlayer.score})`);
    this.roundBank = 0;
    this.bonusStreak = 0;
    this.dom.roundBankDisplay.style.display = 'none';
    this.renderPlayers();

    if (curPlayer.score >= this.settings.targetScore) {
      this.triggerVictory(curPlayer);
    } else {
      this.nextPlayer();
    }
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.roundBank = 0;
    this.bonusStreak = 0;
    this.dom.roundBankDisplay.style.display = 'none';
    this.updateTurnUI();
    this.checkAITurn();
  }

  /**
   * AI Heuristic Decision Policy (§5 of 18_Kaudi.docx)
   */
  checkAITurn() {
    if (this.gameOver) return;
    const curPlayer = this.players[this.currentPlayerIndex];
    if (!curPlayer.isAI) return;

    const t = I18N[this.settings.lang] || I18N.en;
    this.dom.readoutTitle.textContent = `${curPlayer.name}`;
    this.dom.readoutDetail.textContent = t.aiThinking;

    setTimeout(() => {
      if (this.settings.gameMode === 'classic') {
        // In classic mode, AI always rolls on its turn
        this.executeRoll();
      } else {
        // Press-Your-Luck Decision Algorithm:
        // Compare EV gain vs bust probability
        if (this.roundBank === 0) {
          this.executeRoll();
        } else {
          const shouldRoll = this.evaluateAIDecision(curPlayer);
          if (shouldRoll) {
            this.executeRoll();
          } else {
            this.bankCurrentPoints();
          }
        }
      }
    }, 900);
  }

  evaluateAIDecision(aiPlayer) {
    const diff = this.settings.aiDifficulty;
    const bank = this.roundBank;
    const currentScore = aiPlayer.score;
    const target = this.settings.targetScore;

    // If banking wins the game, always bank!
    if (currentScore + bank >= target) return false;

    // Leader score
    const highestOpponentScore = Math.max(...this.players.filter(p => p !== aiPlayer).map(p => p.score));
    const isTrailing = currentScore < highestOpponentScore - 12;

    if (diff === 'easy') {
      // Loose & cautious: banks if bank >= 4, 30% random error
      if (Math.random() < 0.25) return Math.random() < 0.5;
      return bank < 4;
    } else if (diff === 'medium') {
      // Reasonable expected-value threshold
      const threshold = 6;
      return bank < threshold;
    } else {
      // Hard: EV threshold + race context
      let threshold = 7;
      if (isTrailing) threshold = 11; // Push harder when trailing
      if (currentScore + bank >= target - 5) return false; // Lock in near finish
      return bank < threshold;
    }
  }

  triggerVictory(winner) {
    this.gameOver = true;
    this.audio.playVictory();
    this.updateTurnUI();

    this.dom.winnerName.textContent = winner.name;
    this.dom.winnerScore.textContent = `Score: ${winner.score} / ${this.settings.targetScore}`;
    this.openModal(this.dom.victoryModal);
    this.launchConfetti();
  }

  logThrow(player, result, note, extraClass = '') {
    const item = document.createElement('div');
    item.className = `log-item ${extraClass}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    item.innerHTML = `
      <span><strong>${player.name}:</strong> ${note}</span>
      <span style="opacity: 0.6; font-size: 0.7rem;">${time}</span>
    `;
    this.dom.logContainer.prepend(item);
  }

  updateScoringTable() {
    const table = this.dice.getProbabilities(this.settings.shellCount);
    this.dom.scoringTableBody.innerHTML = '';

    table.probs.forEach(row => {
      const tr = document.createElement('tr');
      tr.id = `score-row-${row.upCount}`;
      const pct = Math.round(row.probability * 100);

      tr.innerHTML = `
        <td>${row.upCount} Up, ${this.settings.shellCount - row.upCount} Down</td>
        <td>
          <strong>${row.points} pts</strong>
          ${row.isBonus ? '<span class="badge-bonus">+Bonus</span>' : ''}
        </td>
        <td>${pct}%</td>
      `;
      this.dom.scoringTableBody.appendChild(tr);
    });
  }

  highlightScoringTableRow(upCount) {
    document.querySelectorAll('.table-scoring tr').forEach(r => r.classList.remove('active-row'));
    const targetRow = document.getElementById(`score-row-${upCount}`);
    if (targetRow) {
      targetRow.classList.add('active-row');
    }
  }

  /**
   * High-Fidelity Authentic Cowrie Shell SVGs
   * Realistically represents Cypraea moneta (Money Cowrie)
   * With dorsal golden ring, aperture slit, and teeth ridges
   */
  getShellSVG(isUp) {
    if (isUp) {
      // MOUTH UP (Ventral side: aperture slit with serrated teeth & porcelain luster)
      return `
        <svg class="shell-graphic" viewBox="0 0 74 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="shellMouthBody" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fffef6"/>
              <stop offset="70%" stop-color="#f5e9d2"/>
              <stop offset="100%" stop-color="#d6b88d"/>
            </radialGradient>
            <linearGradient id="apertureShadow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4a301d"/>
              <stop offset="50%" stop-color="#211309"/>
              <stop offset="100%" stop-color="#4a301d"/>
            </linearGradient>
            <filter id="innerGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2a180a" flood-opacity="0.3"/>
            </filter>
          </defs>

          <!-- Outer Porcelain Shell Body -->
          <path d="M37 4 C56 4, 70 24, 70 54 C70 84, 56 104, 37 104 C18 104, 4 84, 4 54 C4 24, 18 4, 37 4 Z" 
                fill="url(#shellMouthBody)" stroke="#9c7546" stroke-width="1.2" />

          <!-- Golden Dorsal Ring Halo (Cypraea moneta mark) -->
          <ellipse cx="37" cy="54" rx="27" ry="43" fill="none" stroke="#e8a317" stroke-width="1.4" opacity="0.35" stroke-dasharray="4 2"/>

          <!-- Lateral Ridges / Grooves -->
          <path d="M12 40 Q22 45 30 45" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>
          <path d="M12 54 Q22 56 30 55" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>
          <path d="M12 68 Q22 66 30 65" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>
          <path d="M62 40 Q52 45 44 45" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>
          <path d="M62 54 Q52 56 44 55" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>
          <path d="M62 68 Q52 66 44 65" stroke="#ba9768" stroke-width="1" opacity="0.6" fill="none"/>

          <!-- Central Longitudinal Aperture (The Slit) -->
          <path d="M37 14 C35 25, 33 45, 33 54 C33 65, 35 83, 37 94 C39 83, 41 65, 41 54 C41 45, 39 25, 37 14 Z" 
                fill="url(#apertureShadow)" filter="url(#innerGlow)"/>

          <!-- Serrated Shell Teeth on Both Lips -->
          <!-- Left Lip Teeth -->
          <line x1="30" y1="28" x2="35" y2="28" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="35" x2="34" y2="35" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="42" x2="34" y2="42" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="49" x2="34" y2="49" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="56" x2="34" y2="56" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="63" x2="34" y2="63" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="28" y1="70" x2="34" y2="70" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="30" y1="77" x2="35" y2="77" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>

          <!-- Right Lip Teeth -->
          <line x1="44" y1="28" x2="39" y2="28" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="35" x2="40" y2="35" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="42" x2="40" y2="42" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="49" x2="40" y2="49" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="56" x2="40" y2="56" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="63" x2="40" y2="63" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="46" y1="70" x2="40" y2="70" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="44" y1="77" x2="39" y2="77" stroke="#fbf4e8" stroke-width="1.8" stroke-linecap="round"/>

          <!-- Glossy Specular Sheen -->
          <path d="M18 20 C24 12, 34 8, 44 8" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>
      `;
    } else {
      // MOUTH DOWN (Dorsal side: smooth egg dome with golden ring and natural speckles)
      return `
        <svg class="shell-graphic" viewBox="0 0 74 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="shellDomeGrad" cx="42%" cy="38%" r="62%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="35%" stop-color="#fdf4e2"/>
              <stop offset="70%" stop-color="#edd5ad"/>
              <stop offset="100%" stop-color="#ad844e"/>
            </radialGradient>
            <radialGradient id="dorsalRing" cx="50%" cy="50%" r="50%">
              <stop offset="75%" stop-color="transparent"/>
              <stop offset="90%" stop-color="#cf8f1e"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>

          <!-- Smooth Convex Dome -->
          <path d="M37 4 C56 4, 70 24, 70 54 C70 84, 56 104, 37 104 C18 104, 4 84, 4 54 C4 24, 18 4, 37 4 Z" 
                fill="url(#shellDomeGrad)" stroke="#8c6436" stroke-width="1.2" />

          <!-- Golden Crown Ring (Money Cowrie natural emblem) -->
          <ellipse cx="37" cy="52" rx="22" ry="34" fill="url(#dorsalRing)" opacity="0.8"/>
          <ellipse cx="37" cy="52" rx="22" ry="34" fill="none" stroke="#e8a317" stroke-width="1.2" opacity="0.6"/>

          <!-- Natural Speckles and Mottled Texture -->
          <circle cx="28" cy="42" r="1.2" fill="#7a4f22" opacity="0.4"/>
          <circle cx="34" cy="36" r="1" fill="#7a4f22" opacity="0.5"/>
          <circle cx="44" cy="45" r="1.4" fill="#7a4f22" opacity="0.4"/>
          <circle cx="38" cy="62" r="1.5" fill="#7a4f22" opacity="0.45"/>
          <circle cx="46" cy="60" r="1" fill="#7a4f22" opacity="0.35"/>
          <circle cx="28" cy="66" r="1.2" fill="#7a4f22" opacity="0.4"/>
          <circle cx="34" cy="72" r="1" fill="#7a4f22" opacity="0.3"/>

          <!-- Crisp Specular 3D Reflection Highlight -->
          <ellipse cx="30" cy="28" rx="14" ry="7" transform="rotate(-25 30 28)" fill="#ffffff" opacity="0.55"/>
          <ellipse cx="27" cy="26" rx="6" ry="2.5" transform="rotate(-25 27 26)" fill="#ffffff" opacity="0.85"/>
        </svg>
      `;
    }
  }

  /**
   * Confetti celebration burst using Canvas
   */
  launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#E8A317', '#F2BC4B', '#C8402F', '#10727F', '#2F4B7C', '#FBF4E8'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        alpha: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rotation += p.vr;
        p.alpha -= 0.008;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      if (frame < 140) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    animate();
  }
}

// Instantiate game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.kaudiGameApp = new KaudiGame();
});
