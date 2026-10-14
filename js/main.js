// Main UI flow + input + bootstrap

(function () {
  const $ = id => document.getElementById(id);

  // Screens
  const loading = $('loading-screen');
  const menu = $('main-menu');
  const lobby = $('lobby-screen');
  const hud = $('game-hud');
  const gameOver = $('game-over');
  const settingsModal = $('settings-modal');

  function show(el) {
    [loading, menu, lobby, hud, gameOver, $('howto-screen')].filter(Boolean).forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
  }

  // Init audio on first interaction
  function unlockAudio() {
    Audio.init();
    Audio.resume();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  }
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);

  // Loading
  setTimeout(() => {
    loading.classList.add('hidden');
    show($('howto-screen') || menu);
    game.initRenderer();
  }, 1400);

  // Magic grid
  function buildMagicGrid() {
    const grid = $('magic-grid');
    grid.innerHTML = '';
    MAGIC_LIST.forEach(m => {
      const card = document.createElement('div');
      card.className = 'magic-card';
      card.dataset.id = m.id;
      card.innerHTML = `<div class="icon">${m.icon}</div><div>${m.name}</div>`;
      card.title = m.description;
      card.addEventListener('click', () => {
        document.querySelectorAll('.magic-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        Audio.click();
      });
      grid.appendChild(card);
    });
  }

  // Menu buttons
  $('btn-host').addEventListener('click', () => {
    Audio.click();
    const code = Net.host();
    $('room-code').textContent = code;
    $('host-status').textContent = 'You are Host. Share the SHORT code above with friends on same Wi-Fi';
    $('btn-start').classList.remove('hidden');
    if (!$('btn-add-ai')) {
      const b = document.createElement('button');
      b.id = 'btn-add-ai';
      b.className = 'btn secondary';
      b.textContent = 'ADD AI TEAMMATE';
      b.style.marginTop = '0.5rem';
      $('btn-start').parentNode.appendChild(b);
      b.addEventListener('click', () => {
        const free = MAGIC_LIST.find(m => !Net.players.some(p => p.magic === m.id));
        if (!free) { alert('All magics taken'); return; }
        Net.addDummyPlayer('Ally-' + free.name, free.id);
        Audio.click();
        updatePlayerList();
      });
    }
    $('join-panel').classList.add('hidden');
    buildMagicGrid();
    show(lobby);
    updatePlayerList();
  });

  $('btn-join').addEventListener('click', () => {
    Audio.click();
    Net.isHost = false;
    $('room-code').textContent = '-----';
    $('host-status').textContent = 'Enter host room code';
    $('btn-start').classList.add('hidden');
    $('join-panel').classList.remove('hidden');
    buildMagicGrid();
    show(lobby);
  });

  $('btn-join-confirm').addEventListener('click', () => {
    const code = $('join-code').value.trim().toUpperCase();
    if (code.length < 4) return;
    Net.join(code);
    $('room-code').textContent = code;
    $('host-status').textContent = 'Joined (prototype – same device / future P2P)';
    Audio.click();
    updatePlayerList();
  });

  $('btn-solo').addEventListener('click', () => {
    Audio.click();
    Net.host();
    $('room-code').textContent = 'SOLO';
    $('host-status').textContent = 'Solo practice – kill enemies to level up & get stronger';
    $('btn-start').classList.remove('hidden');
    if (!$('btn-add-ai')) {
      const b = document.createElement('button');
      b.id = 'btn-add-ai';
      b.className = 'btn secondary';
      b.textContent = 'ADD AI TEAMMATE';
      b.style.marginTop = '0.5rem';
      $('btn-start').parentNode.appendChild(b);
      b.addEventListener('click', () => {
        const free = MAGIC_LIST.find(m => !Net.players.some(p => p.magic === m.id));
        if (!free) { alert('All magics taken'); return; }
        Net.addDummyPlayer('Ally-' + free.name, free.id);
        Audio.click();
        updatePlayerList();
      });
    }
    $('join-panel').classList.add('hidden');
    buildMagicGrid();
    show(lobby);
    updatePlayerList();
  });

  $('btn-settings').addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  $('btn-close-settings').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    const master = parseFloat($('vol-master').value);
    const sfx = parseFloat($('vol-sfx').value);
    const voice = parseFloat($('vol-voice').value);
    Audio.setVolumes(master, sfx, voice);
    const pref = $('pref-cam').value;
    game.setCameraMode(pref);
  });

  $('btn-leave').addEventListener('click', () => {
    show(menu);
  });

  $('btn-ready').addEventListener('click', () => {
    const selected = document.querySelector('.magic-card.selected');
    if (!selected) {
      alert('Choose a magic attribute first');
      return;
    }
    const magicId = selected.dataset.id;
    const name = $('player-name').value.trim() || 'Knight';
    const isHealer = $('is-healer').checked;
    Net.setLocalInfo(name, magicId, isHealer);
    Net.setReady(true);
    Audio.click();
    updatePlayerList();
  });

  $('btn-start').addEventListener('click', () => {
    if (!Net.allReady()) {
      // For prototype allow start if host is ready
      const local = Net.players.find(p => p.id === Net.localId);
      if (!local || !local.magic) {
        alert('Select magic and press READY');
        return;
      }
    }
    Audio.fanfare();
    const playersData = Net.players.filter(p => p.magic).map(p => ({
      id: p.id,
      name: p.name,
      magic: p.magic,
      isHealer: p.isHealer
    }));
    if (playersData.length === 0) return;

    show(hud);
    lobby.classList.add('hidden');
    game.start(playersData, 1);
  });

  function updatePlayerList() {
    const list = $('player-list');
    list.innerHTML = '';
    Net.players.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'player-chip' + (p.id === Net.localId ? ' host' : '') + (p.ready ? ' ready' : '');
      chip.textContent = `${p.name}${p.magic ? ' • ' + getMagic(p.magic).name : ''}${p.isHealer ? ' 💉' : ''}`;
      list.appendChild(chip);
    });
  }

  Net.onPlayerUpdate = updatePlayerList;

  // Camera toggle – 3 modes
  $('btn-cam-iso').addEventListener('click', () => {
    game.setCameraMode('iso');
    Audio.click();
  });
  $('btn-cam-third').addEventListener('click', () => {
    game.setCameraMode('third');
    Audio.click();
  });
  document.getElementById('btn-cam-fp')?.addEventListener('click', () => {
    game.setCameraMode('fp');
    Audio.click();
  });

  // Freedom: Descend + Shop
  $('btn-descend').addEventListener('click', () => {
    if (game.world && game.world.descend()) {
      Audio.fanfare();
      $('btn-descend').style.display = 'none';
    }
  });
  $('btn-shop').addEventListener('click', () => {
    const panel = $('shop-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden') && game.world) {
      $('shop-gold').textContent = game.world.teamGold;
    }
    Audio.click();
  });
  $('btn-close-shop').addEventListener('click', () => {
    $('shop-panel').classList.add('hidden');
  });
  document.querySelectorAll('.shop-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.item;
      if (game.world && game.world.buy(item)) {
        Audio.fanfare();
        $('shop-gold').textContent = game.world.teamGold;
      } else {
        Audio.hit();
      }
    });
  });

  // Game over
  $('btn-retry').addEventListener('click', () => {
    gameOver.classList.add('hidden');
    show(lobby);
  });
  $('btn-menu').addEventListener('click', () => {
    gameOver.classList.add('hidden');
    show(menu);
  });

  // Keyboard input
  const keyMap = {
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
  };
  window.addEventListener('keydown', e => {
    if (keyMap[e.code]) {
      game.input[keyMap[e.code]] = true;
      e.preventDefault();
    }
    // Abilities 1-4
    if (e.code === 'Digit1' || e.code === 'Numpad1') tryAbility(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') tryAbility(1);
    if (e.code === 'Digit3' || e.code === 'Numpad3') tryAbility(2);
    if (e.code === 'Digit4' || e.code === 'Numpad4') tryAbility(3);
    if (e.code === 'Space') tryAbility(0);
    if (e.code === 'KeyE') tryAbility(1);
    if (e.code === 'KeyQ') tryAbility(2);
    if (e.code === 'KeyR') tryAbility(3);
    if (e.code === 'Space') { game.input.jump = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    if (keyMap[e.code]) game.input[keyMap[e.code]] = false;
    if (e.code === 'Space') game.input.jump = false;
  });

  function tryAbility(slot) {
    const local = game.world?.getLocalPlayer();
    if (local && local.alive) local.tryAbility(slot, game.world);
  }

  // Skill buttons mobile
  document.querySelectorAll('.skill-btn').forEach(btn => {
    const handler = (e) => {
      e.preventDefault();
      if (btn.dataset.skill === 'jump') {
        game.input.jump = true;
        setTimeout(() => game.input.jump = false, 120);
      } else {
        tryAbility(parseInt(btn.dataset.skill));
      }
    };
    btn.addEventListener('touchstart', handler, {passive:false});
    btn.addEventListener('click', handler);
  });

  // ========== FREE FIRE STYLE CONTROLS ==========
  // Left half of screen  = Movement joystick (dynamic)
  // Right half of screen = Look / Aim (drag to turn camera 360°)
  // Fire buttons remain on the right

  game.input.lookDx = 0;
  game.input.lookDy = 0;
  game.input.cameraYaw = 0;
  game.input.cameraPitch = 0.25;
  game.input.sensitivity = 0.0045;

  let leftTouchId = null;
  let rightTouchId = null;
  let leftStart = { x: 0, y: 0 };
  let rightLast = { x: 0, y: 0 };
  const joyMax = 55;

  function getTouchById(touches, id) {
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === id) return touches[i];
    }
    return null;
  }

  function onTouchStart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const isLeft = t.clientX < window.innerWidth * 0.48;

      if (isLeft && leftTouchId === null) {
        leftTouchId = t.identifier;
        leftStart.x = t.clientX;
        leftStart.y = t.clientY;
        // Show dynamic joystick visual
        const joy = document.getElementById('joystick-left');
        if (joy) {
          joy.style.left = (t.clientX - 40) + 'px';
          joy.style.top = (t.clientY - 40) + 'px';
          joy.style.opacity = '0.85';
        }
      } else if (!isLeft && rightTouchId === null) {
        rightTouchId = t.identifier;
        rightLast.x = t.clientX;
        rightLast.y = t.clientY;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    // Left = move
    if (leftTouchId !== null) {
      const t = getTouchById(e.touches, leftTouchId);
      if (t) {
        let dx = t.clientX - leftStart.x;
        let dy = t.clientY - leftStart.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > joyMax) {
          dx = (dx / len) * joyMax;
          dy = (dy / len) * joyMax;
        }
        game.input.joyX = dx / joyMax;
        game.input.joyY = dy / joyMax;
      }
    }
    // Right = look / aim
    if (rightTouchId !== null) {
      const t = getTouchById(e.touches, rightTouchId);
      if (t) {
        const dx = t.clientX - rightLast.x;
        const dy = t.clientY - rightLast.y;
        game.input.cameraYaw -= dx * game.input.sensitivity;
        game.input.cameraPitch = Math.max(-0.9, Math.min(0.9, game.input.cameraPitch + dy * game.input.sensitivity));
        rightLast.x = t.clientX;
        rightLast.y = t.clientY;
      }
    }
  }

  function onTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === leftTouchId) {
        leftTouchId = null;
        game.input.joyX = 0;
        game.input.joyY = 0;
        const joy = document.getElementById('joystick-left');
        if (joy) joy.style.opacity = '0.35';
      }
      if (t.identifier === rightTouchId) {
        rightTouchId = null;
      }
    }
  }

  // Desktop mouse look support (right half or right-click drag)
  let mouseLooking = false;
  window.addEventListener('mousedown', e => {
    if (e.button === 2 || e.clientX > window.innerWidth * 0.5) {
      mouseLooking = true;
      rightLast.x = e.clientX;
      rightLast.y = e.clientY;
    }
  });
  window.addEventListener('mousemove', e => {
    if (!mouseLooking) return;
    const dx = e.clientX - rightLast.x;
    const dy = e.clientY - rightLast.y;
    game.input.cameraYaw -= dx * game.input.sensitivity;
    game.input.cameraPitch = Math.max(-0.9, Math.min(0.9, game.input.cameraPitch + dy * game.input.sensitivity));
    rightLast.x = e.clientX;
    rightLast.y = e.clientY;
  });
  window.addEventListener('mouseup', () => { mouseLooking = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());

  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
  document.addEventListener('touchcancel', onTouchEnd);

  // Keep old joystick elements for visual only
  const leftJoy = $('joystick-left');
  if (leftJoy) {
    leftJoy.style.opacity = '0.35';
    leftJoy.style.pointerEvents = 'none';
  }
  const rightJoy = $('joystick-right');
  if (rightJoy) rightJoy.style.display = 'none';

  // PWA install prompt handling (optional)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // Service worker
  
  // ===== Real multi-device WebRTC connect =====
  async function prepareHostOffer() {
    const offer = await Net.createOfferForClient();
    if (offer) {
      const panel = document.getElementById('host-offer-panel');
      if (panel) panel.classList.remove('hidden');
      const out = document.getElementById('offer-output');
      if (out) out.value = offer;
    }
  }

  document.getElementById('btn-copy-offer')?.addEventListener('click', () => {
    const out = document.getElementById('offer-output');
    if (out) {
      out.select();
      navigator.clipboard.writeText(out.value).then(() => alert('Offer copied! Send to friend.'));
    }
  });

  document.getElementById('btn-accept-answer')?.addEventListener('click', async () => {
    const ans = document.getElementById('answer-input')?.value.trim();
    if (!ans) return;
    const id = await Net.acceptAnswer(ans);
    if (id) {
      Audio.click();
      alert('Friend connected!');
      updatePlayerList();
    } else {
      alert('Failed to accept answer. Try again.');
    }
  });

  // Short simple join (preferred)
  document.getElementById('btn-short-join')?.addEventListener('click', () => {
    const code = (document.getElementById('short-join-code')?.value || '').trim().toUpperCase();
    if (code.length < 4) {
      alert('Enter the 4-5 letter Room Code the Host shared');
      return;
    }
    Net.isHost = false;
    Net.join(code);
    document.getElementById('room-code').textContent = code;
    document.getElementById('host-status').textContent = 'Joined with short code – same Wi-Fi required';
    document.getElementById('webrtc-status').textContent = 'Connected via short code. Choose magic & Ready!';
    Audio.click();
    updatePlayerList();
  });

  document.getElementById('btn-join-confirm')?.addEventListener('click', async () => {
    const offer = document.getElementById('offer-input')?.value.trim();
    if (!offer) {
      // fallback old room code
      const code = document.getElementById('join-code')?.value.trim().toUpperCase();
      if (code) {
        Net.join(code);
        document.getElementById('room-code').textContent = code;
        document.getElementById('host-status').textContent = 'Joined (local/test mode)';
        Audio.click();
        updatePlayerList();
      }
      return;
    }
    const answer = await Net.joinWithOffer(offer);
    if (answer) {
      const box = document.getElementById('answer-box');
      if (box) box.classList.remove('hidden');
      const out = document.getElementById('answer-output');
      if (out) out.value = answer;
      Audio.click();
      alert('Answer created! Copy it and send back to the Host.');
    } else {
      alert('Invalid offer. Ask host to create a new one.');
    }
  });

  document.getElementById('btn-copy-answer')?.addEventListener('click', () => {
    const out = document.getElementById('answer-output');
    if (out) {
      out.select();
      navigator.clipboard.writeText(out.value).then(() => alert('Answer copied! Send to host.'));
    }
  });

  // When hosting, also prepare an offer
  const origHost = document.getElementById('btn-host');
  if (origHost) {
    origHost.addEventListener('click', () => {
      setTimeout(prepareHostOffer, 300);
    });
  }

  
  // How to Play
  document.getElementById('btn-howto-ok')?.addEventListener('click', () => {
    Audio.click();
    show(menu);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
