(() => {
  const C = window.CASINO_CONFIG;
  const GAMES = C.games;
  const KEY = "helen-casino-v1";
  const $ = (sel) => document.querySelector(sel);
  const byId = (id) => GAMES.find((g) => g.id === id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- State ----------
  if (new URLSearchParams(location.search).has("reset")) {
    localStorage.removeItem(KEY);
    history.replaceState(null, "", location.pathname);
  }

  // order: games landed on, in spin order. results: { gameId: "won" | "lost" }.
  // current: landed but not yet decided. last: most recently decided.
  const state = Object.assign(
    { screen: "intro", order: [], results: {}, current: null, last: null },
    JSON.parse(localStorage.getItem(KEY) || "null")
  );
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const spinsLeft = () => C.spins - state.order.length;

  // ---------- Helpers ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Hint images, falling back to emoji (+ label for small tiles) when images are missing.
  function hintEl(game, size) {
    const wrap = el("div", `hint hint-${size}`);
    const images = game.hint.images || [];
    const fallback = () => {
      wrap.innerHTML = "";
      wrap.classList.add("hint-fallback");
      wrap.append(el("span", "hint-emoji", game.hint.emoji));
      if (size === "sm") wrap.append(el("span", "hint-label", game.hint.label));
    };
    if (!images.length) fallback();
    let failed = 0;
    images.forEach((src) => {
      const img = new Image();
      img.alt = game.hint.label;
      img.draggable = false;
      img.onerror = () => {
        img.remove();
        if (++failed === images.length) fallback();
      };
      img.src = src;
      wrap.append(img);
    });
    return wrap;
  }

  // Gift photo if one is set, otherwise (or if it fails to load) the gift emoji.
  function giftEl(gift, cls) {
    const emoji = el("div", cls, gift.emoji);
    if (!gift.image) return emoji;
    const img = new Image();
    img.className = `${cls} gift-img`;
    img.alt = gift.title;
    img.onerror = () => img.replaceWith(emoji);
    img.src = gift.image;
    return img;
  }

  function celebrate(big) {
    if (!window.confetti) return;
    const colors = ["#f5c542", "#ff4fa3", "#ffffff", "#c4142f", "#7cf5b0"];
    confetti({ particleCount: big ? 220 : 140, spread: 100, origin: { y: 0.6 }, colors });
    if (!big) return;
    const end = Date.now() + 2500;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // ---------- Screens ----------
  const renderers = {};

  function show(name) {
    state.screen = name;
    save();
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(`#screen-${name}`).classList.add("active");
    renderers[name] && renderers[name]();
  }

  document.querySelectorAll(".js-name").forEach((e) => (e.textContent = C.playerName));
  document.querySelectorAll(".js-age").forEach((e) => (e.textContent = C.age));
  document.querySelectorAll(".js-date").forEach((e) => (e.textContent = C.birthday));

  $('[data-action="enter"]').onclick = () => show("lobby");

  // ---------- Lobby ----------
  renderers.lobby = () => {
    const chips = $("#spin-chips");
    chips.innerHTML = "";
    for (let i = 0; i < C.spins; i++) {
      chips.append(el("div", "chip" + (i < state.order.length ? " used" : "")));
    }

    document.querySelectorAll(".table-card").forEach((b) => (b.disabled = spinsLeft() <= 0));

    const grid = $("#game-grid");
    grid.innerHTML = "";
    GAMES.forEach((g) => {
      const result = state.results[g.id];
      const card = el("div", "mini-card" + (result ? ` ${result}` : ""));
      card.append(hintEl(g, "md"), el("p", "hint-caption", g.hint.label));
      const badge =
        result === "won" ? `🏆 Won: ${g.gift.title}` :
        result === "lost" ? "🔒 Locked... for now" :
        "🎁 Mystery gift";
      card.append(el("span", "badge", badge));
      grid.append(card);
    });
  };

  document.querySelectorAll(".table-card").forEach((b) => {
    b.onclick = () => openTable(b.dataset.table);
  });

  // ---------- Tables ----------
  const TABLES = {
    wheel: { title: "Roulette Wheel", button: "Spin the wheel", build: buildWheel },
    slots: { title: "Slot Machine", button: "Pull the lever", build: buildSlots },
    revolver: { title: "Russian Roulette", button: "Spin the cylinder", build: buildRevolver },
  };

  let spinning = false;

  function openTable(type) {
    const t = TABLES[type];
    spinning = false;
    show("table");
    $("#table-title").textContent = t.title;
    $("#table-status").textContent = `${spinsLeft()} spin${spinsLeft() === 1 ? "" : "s"} left`;
    $("#table-back").style.visibility = "visible";
    const stage = $("#stage");
    stage.innerHTML = "";
    const table = t.build(stage);
    const btn = $("#spin-btn");
    btn.textContent = t.button;
    btn.disabled = false;
    btn.style.display = "";
    btn.onclick = async () => {
      if (spinning) return;
      spinning = true;
      btn.disabled = true;
      $("#table-back").style.visibility = "hidden";
      $("#table-status").textContent = "Good luck...";
      const game = pickGame();
      await table.spin(game, btn);
      $("#table-status").textContent = `🎯 ${game.hint.label}!`;
      await wait(1600);
      show("game");
    };
  }

  $("#table-back").onclick = () => !spinning && show("lobby");

  // Picks a random unplayed game and commits it, so a refresh mid-spin can't re-roll.
  function pickGame() {
    const pool = GAMES.filter((g) => !state.order.includes(g.id));
    const game = pool[Math.floor(Math.random() * pool.length)];
    state.order.push(game.id);
    state.current = game.id;
    save();
    return game;
  }

  // Positions a child around the center of a circular parent at `angle` degrees (0 = top).
  function placeOnRing(node, angle, push) {
    node.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${push}%)`;
  }

  function buildWheel(stage) {
    const n = GAMES.length;
    const seg = 360 / n;
    const wrap = el("div", "wheel-wrap");
    const wheel = el("div", "wheel");
    const colors = GAMES.map((_, i) => (i % 2 ? "#141414" : "#b3122e"));
    wheel.style.background = `conic-gradient(${colors
      .map((c, i) => `${c} ${i * seg}deg ${(i + 1) * seg}deg`)
      .join(", ")})`;
    GAMES.forEach((g, i) => {
      const s = el("div", "wheel-seg" + (state.order.includes(g.id) ? " played" : ""));
      s.append(hintEl(g, "sm"));
      placeOnRing(s, i * seg + seg / 2, 105);
      wheel.append(s);
    });
    wrap.append(wheel, el("div", "wheel-pointer"), el("div", "wheel-hub", C.age));
    stage.append(wrap);

    return {
      async spin(game) {
        const i = GAMES.indexOf(game);
        const jitter = (Math.random() - 0.5) * seg * 0.6;
        const rot = 360 * 6 + (360 - (i * seg + seg / 2)) + jitter;
        wheel.style.transform = `rotate(${rot}deg)`;
        await wait(5600);
      },
    };
  }

  function buildSlots(stage) {
    const machine = el("div", "slot-machine");
    machine.append(el("div", "slot-top", "★ JACKPOT ★"));
    const reels = el("div", "reels");
    const strips = [];
    for (let r = 0; r < 3; r++) {
      const reel = el("div", "reel");
      const strip = el("div", "reel-strip");
      strip.append(symbol(GAMES[(r * 2) % GAMES.length]));
      reel.append(strip);
      reels.append(reel);
      strips.push(strip);
    }
    reels.append(el("div", "slot-line"));
    machine.append(reels);
    stage.append(machine);

    function symbol(g) {
      const s = el("div", "reel-symbol");
      s.append(hintEl(g, "sm"));
      return s;
    }
    const randomGame = () => GAMES[Math.floor(Math.random() * GAMES.length)];

    return {
      async spin(game) {
        const durations = [2.4, 3.2, 4.0];
        strips.forEach((strip, r) => {
          const filler = 18 + r * 6;
          strip.innerHTML = "";
          strip.append(symbol(GAMES[(r * 2) % GAMES.length]));
          for (let k = 0; k < filler; k++) strip.append(symbol(randomGame()));
          strip.append(symbol(game), symbol(randomGame()));
          strip.style.transition = "none";
          strip.style.transform = "translateY(0)";
          void strip.offsetHeight;
          const h = strip.parentElement.clientHeight;
          strip.style.transition = `transform ${durations[r]}s cubic-bezier(0.12, 0.75, 0.25, 1.04)`;
          strip.style.transform = `translateY(-${(filler + 1) * h}px)`;
        });
        await wait(durations[2] * 1000 + 150);
        reels.classList.add("win");
      },
    };
  }

  function buildRevolver(stage) {
    const n = GAMES.length;
    const step = 360 / n;
    const wrap = el("div", "revolver-wrap");
    const cyl = el("div", "cylinder");
    const chambers = GAMES.map((g, i) => {
      const c = el("div", "chamber" + (state.order.includes(g.id) ? " played" : ""));
      c.append(hintEl(g, "sm"));
      placeOnRing(c, i * step, 115);
      cyl.append(c);
      return c;
    });
    cyl.append(el("div", "cylinder-pin"));
    wrap.append(cyl, el("div", "fire-marker", "▼ FIRE ▼"));
    stage.append(wrap);

    return {
      async spin(game, btn) {
        const i = GAMES.indexOf(game);
        cyl.style.transform = `rotate(${360 * 5 + ((360 - i * step) % 360)}deg)`;
        await wait(4600);
        chambers[i].classList.add("loaded");
        $("#table-status").textContent = "Feeling lucky?";
        btn.textContent = "Pull the trigger";
        btn.disabled = false;
        await new Promise((resolve) => (btn.onclick = resolve));
        btn.disabled = true;
        $("#table-status").textContent = "click...";
        await wait(900);
        wrap.classList.add("recoil");
        const bang = $("#bang");
        bang.hidden = false;
        celebrate(false);
        await wait(1400);
        bang.hidden = true;
      },
    };
  }

  // ---------- Landed game ----------
  renderers.game = () => {
    const g = byId(state.current);
    const hint = $("#game-hint");
    hint.innerHTML = "";
    hint.append(hintEl(g, "lg"));
    $("#game-hint-label").textContent = g.hint.label;
    $("#game-title").textContent = g.title;
    $("#game-desc").textContent = g.description;
    $("#game-rule").textContent = g.winRule;
    // Restart the card entrance animation.
    const card = $(".game-card");
    card.style.animation = "none";
    void card.offsetHeight;
    card.style.animation = "";
  };

  // ---------- Host PIN + result ----------
  const modal = $("#host-modal");
  let pin = "";

  function renderPin() {
    const dots = $("#pin-dots");
    dots.innerHTML = "";
    for (let i = 0; i < C.hostPin.length; i++) {
      dots.append(el("span", i < pin.length ? "filled" : ""));
    }
  }

  function openModal() {
    pin = "";
    renderPin();
    $("#pin-step").hidden = false;
    $("#result-step").hidden = true;
    modal.hidden = false;
  }
  const closeModal = () => (modal.hidden = true);

  function pressKey(k) {
    if (k === "C") pin = "";
    else if (k === "⌫") pin = pin.slice(0, -1);
    else if (pin.length < C.hostPin.length) pin += k;
    renderPin();
    if (pin.length === C.hostPin.length) {
      if (pin === C.hostPin) {
        $("#pin-step").hidden = true;
        $("#result-step").hidden = false;
      } else {
        const dots = $("#pin-dots");
        dots.classList.remove("shake");
        void dots.offsetWidth;
        dots.classList.add("shake");
        setTimeout(() => { pin = ""; renderPin(); }, 400);
      }
    }
  }

  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].forEach((k) => {
    const b = el("button", "", k);
    b.onclick = () => pressKey(k);
    $("#keypad").append(b);
  });

  document.addEventListener("keydown", (e) => {
    if (modal.hidden || $("#pin-step").hidden) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Escape") closeModal();
  });

  $('[data-action="host"]').onclick = openModal;
  document.querySelectorAll('[data-action="close-modal"]').forEach((b) => (b.onclick = closeModal));

  document.querySelectorAll("[data-result]").forEach((b) => {
    b.onclick = () => {
      state.results[state.current] = b.dataset.result;
      state.last = state.current;
      state.current = null;
      closeModal();
      show("reveal");
    };
  });

  // ---------- Reveal ----------
  renderers.reveal = () => {
    const g = byId(state.last);
    const won = state.results[g.id] === "won";
    const box = $("#reveal-content");
    box.className = "reveal" + (won ? "" : " lost");
    box.innerHTML = "";
    if (won) {
      box.append(
        el("p", "eyebrow", `${C.playerName} wins!`),
        giftEl(g.gift, "reveal-emoji"),
        el("h2", "reveal-gift", g.gift.title),
        el("p", "reveal-detail", g.gift.detail)
      );
      setTimeout(() => celebrate(true), 300);
    } else {
      box.append(
        el("p", "eyebrow", g.title),
        el("div", "reveal-emoji", "🔒"),
        el("h2", "reveal-gift", "Locked... for now"),
        el("p", "reveal-detail", "The house wins this round. But the night is young.")
      );
    }
    const next = $("#reveal-next");
    const left = spinsLeft();
    next.textContent = left > 0 ? `Back to the tables (${left} spin${left === 1 ? "" : "s"} left)` : "Enter the Bonus Round ✨";
    next.onclick = () => show(left > 0 ? "lobby" : "finale");
  };

  // ---------- Finale ----------
  renderers.finale = async () => {
    $("#finale-title").textContent = C.finale.title;
    $("#finale-subtitle").textContent = C.finale.subtitle;
    const msg = $("#finale-message");
    msg.textContent = C.finale.message;
    msg.classList.remove("show");
    const grid = $("#finale-grid");
    grid.innerHTML = "";
    const cards = GAMES.map((g) => {
      const flip = el("div", "flip");
      const inner = el("div", "flip-inner");
      const front = el("div", "flip-face flip-front");
      const frontHint = hintEl(g, "sm");
      frontHint.style.height = "70%";
      frontHint.style.fontSize = "clamp(9px, 1.4vh, 14px)";
      front.append(frontHint);
      const back = el("div", "flip-face flip-back");
      back.append(
        giftEl(g.gift, "flip-emoji"),
        el("div", "flip-title", g.gift.title),
        el("div", "flip-detail", g.gift.detail),
        state.results[g.id] === "won" ? el("span", "badge won", "🏆 Won") : el("span", "badge", "🎁 Bonus"),
      );
      inner.append(front, back);
      flip.append(inner);
      grid.append(flip);
      return flip;
    });
    await wait(1000);
    for (const card of cards) {
      card.classList.add("flipped");
      await wait(700);
    }
    msg.classList.add("show");
    celebrate(true);
  };

  // ---------- Resume ----------
  if (state.current) show("game");
  else if (state.screen === "reveal" && state.last) show("reveal");
  else if (spinsLeft() <= 0) show("finale");
  else show(state.screen === "intro" ? "intro" : "lobby");
})();
