(function(){
  "use strict";

  // ---- Sound engine (all synthesized, no external audio files) ----
  var Sound = (function(){
    var ctx = null, on = true;
    function ensure(){
      if(!ctx){ ctx = new (window.AudioContext||window.webkitAudioContext)(); }
      if(ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, duration, type, gainVal, delay, glideTo){
      if(!on) return;
      try{
        var ac = ensure();
        var t0 = ac.currentTime + (delay||0);
        var osc = ac.createOscillator(), gain = ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if(glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0+duration);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(gainVal||0.18, t0+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0+duration);
        osc.connect(gain); gain.connect(ac.destination);
        osc.start(t0); osc.stop(t0+duration+0.03);
      }catch(e){}
    }
    function noise(duration, gainVal, delay, freq){
      if(!on) return;
      try{
        var ac = ensure();
        var t0 = ac.currentTime + (delay||0);
        var size = Math.max(1, Math.floor(ac.sampleRate*duration));
        var buf = ac.createBuffer(1, size, ac.sampleRate);
        var d = buf.getChannelData(0);
        for(var i=0;i<size;i++){ d[i] = (Math.random()*2-1) * (1 - i/size); }
        var src = ac.createBufferSource(); src.buffer = buf;
        var filt = ac.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value = freq||2200;
        var gain = ac.createGain();
        gain.gain.setValueAtTime(gainVal||0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0+duration);
        src.connect(filt); filt.connect(gain); gain.connect(ac.destination);
        src.start(t0); src.stop(t0+duration+0.02);
      }catch(e){}
    }
    return {
      setEnabled: function(v){ on = v; },
      diceTick: function(){ tone(180+Math.random()*260, 0.045, 'square', 0.08); },
      diceSettle: function(roll){ tone(340+roll*24, 0.14, 'triangle', 0.16); },
      move: function(){ tone(520, 0.08, 'sine', 0.1); },
      ladder: function(){ [0,0.09,0.18,0.27].forEach(function(dt,i){ tone(440+i*140, 0.16, 'triangle', 0.14, dt); }); },
      snake: function(){ noise(0.35, 0.12, 0, 1800); tone(500, 0.4, 'sawtooth', 0.1, 0, 130); },
      bounce: function(){ tone(300, 0.12, 'square', 0.12); tone(220, 0.14, 'square', 0.1, 0.1); },
      blocked: function(){ tone(160, 0.15, 'square', 0.12); },
      turn: function(){ tone(660, 0.06, 'sine', 0.09); },
      buzz: function(){ tone(110, 0.3, 'sawtooth', 0.14); },
      fanfare: function(){ [523,659,784,1047].forEach(function(f,i){ tone(f, 0.24, 'triangle', 0.15, i*0.12); }); }
    };
  })();

  // ---- Board topology (boustrophedon 1..100, row 0 = bottom) ----
  function cellRC(n){ // n:1..100 -> {row(0=bottom),col(0=left)}
    var idx = n-1, row = Math.floor(idx/10), col = idx%10;
    if(row % 2 === 1) col = 9-col;
    return {row: row, col: col};
  }

  // Ladders (foot -> head) and Snakes (head -> tail), inspired by the reference board.
  var LADDERS = {4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91};
  var SNAKES  = {17:7, 54:34, 62:19, 64:60, 87:24, 93:73, 95:75, 98:79};

  function resolveLanding(square){
    // chained links resolved in one step
    var seen = {};
    while(true){
      if(LADDERS[square] !== undefined){ if(seen[square]) break; seen[square]=1; square = LADDERS[square]; continue; }
      if(SNAKES[square] !== undefined){ if(seen[square]) break; seen[square]=1; square = SNAKES[square]; continue; }
      break;
    }
    return square;
  }

  var PLAYER_COLORS = ['#C0392B', '#2E6E45', '#2C5C8A', '#8A5A2C'];
  var PLAYER_NAMES  = ['Traveller 1','Traveller 2','Traveller 3','Traveller 4'];

  var state = {
    players: [],
    current: 0,
    consecutiveSixes: 0,
    finished: [],
    rules: { exactFinish: true, sixAgain: true },
    rolling: false,
    over: false
  };

  // ---- Build board DOM ----
  var boardEl = document.getElementById('board');
  var cellEls = {};
  (function buildBoard(){
    // place cells row-major visually (top row = 100..91) but keyed by number
    var grid = [];
    for(var vr=0; vr<10; vr++){ grid.push(new Array(10)); }
    for(var n=1;n<=100;n++){
      var rc = cellRC(n);
      var visualRow = 9 - rc.row; // top of screen = highest row
      grid[visualRow][rc.col] = n;
    }
    var tone = ['a','b','c'];
    var toneIdx = 0;
    for(var r=0;r<10;r++){
      for(var c=0;c<10;c++){
        var n = grid[r][c];
        var div = document.createElement('div');
        div.className = 'cell ' + tone[(r+c)%3];
        if(n===1) div.className += ' start';
        if(n===100) div.className += ' finish';
        var num = document.createElement('span');
        num.className='num'; num.textContent = n;
        div.appendChild(num);
        if(LADDERS[n]){
          var t1=document.createElement('span'); t1.className='tag ladder-tag'; t1.textContent='↑'+LADDERS[n];
          div.appendChild(t1);
        }
        if(SNAKES[n]){
          var t2=document.createElement('span'); t2.className='tag snake-tag'; t2.textContent='↓'+SNAKES[n];
          div.appendChild(t2);
        }
        boardEl.appendChild(div);
        cellEls[n] = div;
      }
    }
    // SVG overlay for snake/ladder lines
    var svgns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgns,'svg');
    svg.setAttribute('class','overlay');
    svg.setAttribute('viewBox','0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio','none');
    function center(n){
      var rc = cellRC(n); var visualRow = 9-rc.row;
      return { x: rc.col*100+50, y: visualRow*100+50 };
    }
    function makeEl(tag, attrs){
      var el = document.createElementNS(svgns, tag);
      for(var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    }

    // Smooth a polyline of points into a cubic-bezier path (Catmull-Rom).
    function smoothPath(pts){
      var d = "M"+pts[0].x.toFixed(1)+","+pts[0].y.toFixed(1)+" ";
      for(var i=0;i<pts.length-1;i++){
        var p0 = pts[i-1] || pts[i];
        var p1 = pts[i];
        var p2 = pts[i+1];
        var p3 = pts[i+2] || p2;
        var c1x = p1.x + (p2.x-p0.x)/6, c1y = p1.y + (p2.y-p0.y)/6;
        var c2x = p2.x - (p3.x-p1.x)/6, c2y = p2.y - (p3.y-p1.y)/6;
        d += "C"+c1x.toFixed(1)+","+c1y.toFixed(1)+" "+c2x.toFixed(1)+","+c2y.toFixed(1)+" "+p2.x.toFixed(1)+","+p2.y.toFixed(1)+" ";
      }
      return d;
    }

    // Draws a wavy, tapered snake from head (higher square) to tail (lower square).
    function drawSnake(headSq, tailSq){
      var h = center(headSq), t = center(tailSq);
      var dx=t.x-h.x, dy=t.y-h.y;
      var len = Math.sqrt(dx*dx+dy*dy) || 1;
      var ux=dx/len, uy=dy/len, px=-uy, py=ux;
      var segments = 16, cycles = 2.4, amp = 26;
      var pts = [];
      for(var i=0;i<=segments;i++){
        var tt = i/segments;
        var baseX = h.x+dx*tt, baseY = h.y+dy*tt;
        var envelope = Math.sin(Math.min(tt*1.15,1)*Math.PI*0.5) * (1 - tt*0.15);
        var wave = Math.sin(tt*Math.PI*cycles);
        var off = amp*envelope*wave;
        pts.push({x: baseX+px*off, y: baseY+py*off});
      }
      var g = makeEl('g', {opacity:'0.92'});
      var color = getCss('--snake');
      // tapered body: successive overlapping segments, thick at head, thin at tail
      for(var s=0;s<segments;s++){
        var w = 13*(1-s/segments) + 2.5*(s/segments);
        var seg = makeEl('path', {
          d: smoothPath([pts[Math.max(s-1,0)], pts[s], pts[s+1]]),
          stroke: color, 'stroke-width': w.toFixed(1), fill:'none', 'stroke-linecap':'round'
        });
        g.appendChild(seg);
      }
      // pale belly stripe along the same curve
      var belly = makeEl('path', { d: smoothPath(pts), stroke:'#F1E4C3', 'stroke-width':'2', fill:'none',
        'stroke-linecap':'round', opacity:'0.5' });
      g.appendChild(belly);
      // diamond scale pattern (small marks along the body)
      for(var m=2;m<segments-1;m+=3){
        var mk = makeEl('circle', {cx:pts[m].x.toFixed(1), cy:pts[m].y.toFixed(1), r:'1.6', fill:'#F1E4C3', opacity:'0.35'});
        g.appendChild(mk);
      }
      // head: rounded wedge with eyes and a forked tongue, oriented toward first curve segment
      var dirx = pts[1].x-pts[0].x, diry = pts[1].y-pts[0].y;
      var dlen = Math.sqrt(dirx*dirx+diry*diry) || 1;
      dirx/=dlen; diry/=dlen;
      var hx=pts[0].x, hy=pts[0].y;
      var perpx=-diry, perpy=dirx;
      var headR = 9;
      var headPath = "M"+(hx-perpx*headR).toFixed(1)+","+(hy-perpy*headR).toFixed(1)+
        " Q"+(hx+dirx*headR*1.3).toFixed(1)+","+(hy+diry*headR*1.3).toFixed(1)+" "+
        (hx+perpx*headR).toFixed(1)+","+(hy+perpy*headR).toFixed(1)+
        " Q"+hx.toFixed(1)+","+hy.toFixed(1)+" "+(hx-perpx*headR).toFixed(1)+","+(hy-perpy*headR).toFixed(1)+" Z";
      g.appendChild(makeEl('path', {d:headPath, fill:color}));
      var eyeOff = 4.5;
      [-1,1].forEach(function(sign){
        var ex = hx - dirx*1.5 + perpx*eyeOff*sign, ey = hy - diry*1.5 + perpy*eyeOff*sign;
        g.appendChild(makeEl('circle', {cx:ex.toFixed(1), cy:ey.toFixed(1), r:'1.7', fill:'#F1E4C3'}));
        g.appendChild(makeEl('circle', {cx:ex.toFixed(1), cy:ey.toFixed(1), r:'0.8', fill:'#1a0d08'}));
      });
      var tx = hx - dirx*headR, ty = hy - diry*headR;
      var tipx = tx - dirx*7, tipy = ty - diry*7;
      var forkSpread = 2.6;
      g.appendChild(makeEl('path', {
        d:"M"+tx.toFixed(1)+","+ty.toFixed(1)+" L"+tipx.toFixed(1)+","+tipy.toFixed(1)+
          " M"+tipx.toFixed(1)+","+tipy.toFixed(1)+" L"+(tipx-diry*forkSpread-dirx*1.5).toFixed(1)+","+(tipy+dirx*forkSpread-diry*1.5).toFixed(1)+
          " M"+tipx.toFixed(1)+","+tipy.toFixed(1)+" L"+(tipx+diry*forkSpread-dirx*1.5).toFixed(1)+","+(tipy-dirx*forkSpread-diry*1.5).toFixed(1),
        stroke:'#B8342A', 'stroke-width':'1.2', fill:'none', 'stroke-linecap':'round'
      }));
      svg.appendChild(g);
    }

    // Draws a two-rail wooden ladder with evenly spaced rungs from foot to head.
    function drawLadder(foot, head){
      var a = center(foot), b = center(head);
      var dx=b.x-a.x, dy=b.y-a.y;
      var len = Math.sqrt(dx*dx+dy*dy) || 1;
      var ux=dx/len, uy=dy/len, px=-uy, py=ux;
      var railGap = 10;
      var color = getCss('--ladder');
      var g = makeEl('g', {opacity:'0.95'});
      [-1,1].forEach(function(side){
        g.appendChild(makeEl('line', {
          x1:(a.x+px*railGap*side).toFixed(1), y1:(a.y+py*railGap*side).toFixed(1),
          x2:(b.x+px*railGap*side).toFixed(1), y2:(b.y+py*railGap*side).toFixed(1),
          stroke:color, 'stroke-width':'4.5', 'stroke-linecap':'round'
        }));
      });
      var rungs = Math.max(3, Math.round(len/34));
      for(var i=1;i<rungs;i++){
        var t = i/rungs;
        var cx = a.x+dx*t, cy = a.y+dy*t;
        g.appendChild(makeEl('line', {
          x1:(cx-px*railGap).toFixed(1), y1:(cy-py*railGap).toFixed(1),
          x2:(cx+px*railGap).toFixed(1), y2:(cy+py*railGap).toFixed(1),
          stroke:color, 'stroke-width':'3.2', 'stroke-linecap':'round'
        }));
      }
      svg.appendChild(g);
    }

    Object.keys(LADDERS).forEach(function(k){ drawLadder(+k, LADDERS[k]); });
    Object.keys(SNAKES).forEach(function(k){ drawSnake(+k, SNAKES[k]); });
    boardEl.appendChild(svg);
  })();

  function getCss(varName){
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#7A2A20';
  }

  // ---- Tokens ----
  var tokenEls = [];
  function placeToken(i, square){
    var el = tokenEls[i];
    var rc = cellRC(square === 0 ? 1 : square);
    var visualRow = 9-rc.row;
    var offsets = [ [0.9,0.9],[5.0,0.9],[0.9,5.0],[5.0,5.0] ];
    var off = offsets[i];
    el.style.left = (rc.col*10 + off[0]) + '%';
    el.style.top  = (visualRow*10 + off[1]) + '%';
  }

  // ---- Setup controls ----
  var exactToggle = document.getElementById('exactFinish');
  var sixToggle = document.getElementById('sixAgain');
  function wireToggle(el, key){
    function flip(){
      var on = !el.classList.contains('on');
      el.classList.toggle('on', on);
      el.setAttribute('aria-checked', on);
      state.rules[key] = on;
    }
    el.addEventListener('click', flip);
    el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); } });
  }
  wireToggle(exactToggle,'exactFinish');
  wireToggle(sixToggle,'sixAgain');

  var startBtn = document.getElementById('startBtn');
  var setupCard = document.getElementById('setupCard');
  var playCard = document.getElementById('playCard');
  var restartCard = document.getElementById('restartCard');
  var playersListEl = document.getElementById('playersList');
  var banner = document.getElementById('banner');
  var rollBtn = document.getElementById('rollBtn');
  var muteBtn = document.getElementById('muteBtn');
  var soundOn = true;
  muteBtn.addEventListener('click', function(){
    soundOn = !soundOn;
    Sound.setEnabled(soundOn);
    muteBtn.textContent = soundOn ? '🔊' : '🔇';
  });
  var dieEl = document.getElementById('die');
  var logEl = document.getElementById('log');

  function log(msg){
    var p = document.createElement('p');
    p.textContent = msg;
    logEl.insertBefore(p, logEl.firstChild);
  }

  startBtn.addEventListener('click', function(){
    var n = parseInt(document.getElementById('numPlayers').value, 10);
    state.players = [];
    for(var i=0;i<n;i++){
      state.players.push({ name: PLAYER_NAMES[i], color: PLAYER_COLORS[i], square: 0 });
      var t = document.createElement('div');
      t.className='token'; t.style.background = PLAYER_COLORS[i];
      t.textContent = (i+1);
      boardEl.appendChild(t);
      tokenEls.push(t);
      placeToken(i, 1);
    }
    state.current = 0; state.consecutiveSixes = 0; state.finished = []; state.over=false;
    renderPlayers();
    setupCard.style.display='none';
    playCard.style.display='block';
    restartCard.style.display='none';
    logEl.innerHTML='';
    log('The journey begins. ' + state.players[0].name + ' rolls first.');
    banner.textContent = state.players[0].name + "'s turn — roll the die.";
  });

  document.getElementById('restartBtn').addEventListener('click', function(){
    tokenEls.forEach(function(t){ t.remove(); });
    tokenEls = [];
    setupCard.style.display='block';
    playCard.style.display='none';
    restartCard.style.display='none';
  });

  function renderPlayers(){
    playersListEl.innerHTML='';
    state.players.forEach(function(p, i){
      var row=document.createElement('div');
      row.className='player-row' + (i===state.current && !state.over ? ' active':'');
      var sw=document.createElement('span'); sw.className='swatch'; sw.style.background=p.color;
      row.appendChild(sw);
      var rank = state.finished.indexOf(i);
      var label = p.name + (rank>=0 ? ' — finished #'+(rank+1) : '');
      var nameSpan=document.createElement('span'); nameSpan.textContent = label;
      row.appendChild(nameSpan);
      var pos=document.createElement('span'); pos.className='pos'; pos.textContent = 'sq ' + p.square;
      row.appendChild(pos);
      playersListEl.appendChild(row);
    });
  }

  function setDiePips(n){
    var patterns = {
      1:[0,0,0,0,1,0,0,0,0],
      2:[1,0,0,0,0,0,0,0,1],
      3:[1,0,0,0,1,0,0,0,1],
      4:[1,0,1,0,0,0,1,0,1],
      5:[1,0,1,0,1,0,1,0,1],
      6:[1,0,1,1,0,1,1,0,1]
    };
    var pat = patterns[n] || patterns[1];
    for(var i=1;i<=9;i++){
      document.getElementById('p'+i).style.opacity = pat[i-1] ? '1':'0';
    }
  }
  setDiePips(1);

  function nextActivePlayer(){
    if(state.finished.length >= state.players.length - (state.players.length>1?1:0) && state.players.length>1){
      // continue anyway to rank remaining players if >2 unfinished remain; handled by isOver check
    }
    var n = state.players.length;
    for(var step=1; step<=n; step++){
      var idx = (state.current + step) % n;
      if(state.finished.indexOf(idx) === -1) return idx;
    }
    return state.current;
  }

  function checkGameOver(){
    var remaining = state.players.length - state.finished.length;
    return remaining <= (state.players.length===2 ? 0 : 1);
  }

  rollBtn.addEventListener('click', function(){
    if(state.rolling || state.over) return;
    state.rolling = true;
    rollBtn.disabled = true;
    dieEl.classList.add('rolling');
    var frames = 8, frame = 0;
    var interval = setInterval(function(){
      setDiePips(1 + Math.floor(Math.random()*6));
      Sound.diceTick();
      frame++;
      if(frame >= frames){
        clearInterval(interval);
        dieEl.classList.remove('rolling');
        var roll = 1 + Math.floor(Math.random()*6);
        setDiePips(roll);
        Sound.diceSettle(roll);
        handleRoll(roll);
      }
    }, 70);
  });

  function handleRoll(roll){
    var i = state.current;
    var p = state.players[i];
    var wasSix = (roll === 6);

    if(wasSix){ state.consecutiveSixes++; } else { state.consecutiveSixes = 0; }

    var cappedSix = wasSix && state.consecutiveSixes >= 3;
    if(cappedSix){
      log(p.name + ' rolled a third six in a row — turn forfeited.');
      state.consecutiveSixes = 0;
      Sound.buzz();
      finishTurn(true);
      return;
    }

    var target = p.square + roll;
    var moveMsg;
    if(target > 100){
      if(state.rules.exactFinish){
        moveMsg = p.name + ' rolled ' + roll + ' but needs an exact count — stays on ' + p.square + '.';
        log(moveMsg);
        Sound.blocked();
      } else {
        target = 100 - (target - 100);
        p.square = target;
        moveMsg = p.name + ' rolled ' + roll + ', overshoots and bounces back to ' + target + '.';
        log(moveMsg);
        Sound.bounce();
        settle(p, i);
      }
    } else {
      var landed = target;
      var final = resolveLanding(landed);
      p.square = final;
      if(final === landed){
        log(p.name + ' rolled ' + roll + ' and moves to ' + final + '.');
        Sound.move();
      } else if(LADDERS[landed] !== undefined || final > landed){
        log(p.name + ' rolled ' + roll + ', lands on ' + landed + ' — a ladder of good deeds lifts them to ' + final + '.');
        Sound.ladder();
      } else {
        log(p.name + ' rolled ' + roll + ', lands on ' + landed + ' — a snake drags them down to ' + final + '.');
        Sound.snake();
      }
      settle(p, i);
    }

    renderPlayers();
    placeToken(i, p.square || 1);

    if(p.square === 100 && state.finished.indexOf(i) === -1){
      state.finished.push(i);
      log(p.name + ' reaches square 100 and attains moksha! Finish #' + state.finished.length + '.');
      Sound.fanfare();
    }

    if(checkGameOver()){
      endGame();
      return;
    }

    var grantsExtra = wasSix && state.rules.sixAgain && state.finished.indexOf(i)===-1;
    finishTurn(!grantsExtra);
  }

  function settle(){ /* placeholder for symmetry / future effects */ }

  function finishTurn(advance){
    state.rolling = false;
    rollBtn.disabled = false;
    if(advance){
      state.current = nextActivePlayer();
      if(!state.over) Sound.turn();
    }
    renderPlayers();
    if(!state.over){
      banner.textContent = state.players[state.current].name + "'s turn — roll the die.";
    }
  }

  function endGame(){
    state.over = true;
    rollBtn.disabled = true;
    // rank any unfinished players by current square, descending
    var unfinished = state.players.map(function(_,idx){return idx;}).filter(function(idx){ return state.finished.indexOf(idx)===-1; });
    unfinished.sort(function(a,b){ return state.players[b].square - state.players[a].square; });
    unfinished.forEach(function(idx){ state.finished.push(idx); });
    renderPlayers();
    var order = state.finished.map(function(idx,rank){ return (rank+1)+'. '+state.players[idx].name; }).join('  ·  ');
    banner.textContent = 'Journey complete — ' + order;
    log('Final order: ' + order);
    restartCard.style.display='block';
  }

})();
