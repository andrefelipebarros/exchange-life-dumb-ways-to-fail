const PASSWORD = "0616B";
const YOUTUBE_GAME_URL = ""; // Add the YouTube link here when the video is ready.

const COMMAND_TIME_MS = 700;
const RESULT_TIME_MS = 1200;
const LIFE_LOST_TIME_MS = 1300;
const BASE_ROUND_TIME_MS = 5000;
const MIN_ROUND_TIME_MS = 2600;

const RESULT_VIDEOS = {
  success: "",
  fail: ""
};

const screens = {
  menu: document.getElementById("menuScreen"),
  command: document.getElementById("commandScreen"),
  game: document.getElementById("gameScreen"),
  result: document.getElementById("resultScreen"),
  lifeLost: document.getElementById("lifeLostScreen"),
  gameOver: document.getElementById("gameOverScreen")
};

const ui = {
  playButton: document.getElementById("playButton"),
  restartButton: document.getElementById("restartButton"),
  audioButton: document.getElementById("audioButton"),
  youtubeButton: document.getElementById("youtubeButton"),
  characterButton: document.getElementById("characterButton"),
  scoreboardButton: document.getElementById("scoreboardButton"),
  characterScreen: document.getElementById("characterScreen"),
  closeCharacterButton: document.getElementById("closeCharacterButton"),
  characterForm: document.getElementById("characterForm"),
  playerNameInput: document.getElementById("playerNameInput"),
  playerClassInput: document.getElementById("playerClassInput"),
  avatarPreview: document.getElementById("avatarPreview"),
  saveCharacterButton: document.getElementById("saveCharacterButton"),
  scoreboardScreen: document.getElementById("scoreboardScreen"),
  closeScoreboardButton: document.getElementById("closeScoreboardButton"),
  currentPlayerCard: document.getElementById("currentPlayerCard"),
  scoreboardList: document.getElementById("scoreboardList"),
  clearScoreboardButton: document.getElementById("clearScoreboardButton"),
  audioSettings: document.getElementById("audioSettings"),
  closeAudioButton: document.getElementById("closeAudioButton"),
  soundToggleButton: document.getElementById("soundToggleButton"),
  volumeSlider: document.getElementById("volumeSlider"),
  commandText: document.getElementById("commandText"),
  timerFill: document.getElementById("timerFill"),
  typedDisplay: document.getElementById("typedDisplay"),
  keys: document.getElementById("keys"),
  redLight: document.getElementById("redLight"),
  greenLight: document.getElementById("greenLight"),
  resultCard: document.getElementById("resultCard"),
  resultTitle: document.getElementById("resultTitle"),
  resultMessage: document.getElementById("resultMessage"),
  resultVideo: document.getElementById("resultVideo"),
  videoPlaceholder: document.getElementById("videoPlaceholder"),
  livesMessage: document.getElementById("livesMessage"),
  lifeMarkers: document.getElementById("lifeMarkers"),
  orientationWarning: document.getElementById("orientationWarning")
};

const state = {
  lives: 3,
  roundsWon: 0,
  input: "",
  canPlay: false,
  resolving: false,
  currentRoundTime: BASE_ROUND_TIME_MS,
  roundStartedAt: 0,
  animationFrame: 0,
  timeoutId: 0,
  audioContext: null,
  soundEnabled: localStorage.getItem("exchangeLifeSoundEnabled") !== "false",
  volume: Number(localStorage.getItem("exchangeLifeVolume") || 70) / 100,
  player: loadPlayer(),
  avatarDraft: {
    hair: 1,
    shirt: 1,
    skin: 1
  }
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function ensureAudio() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.07, delay = 0) {
  if (!state.soundEnabled) return;
  if (!state.audioContext) return;

  volume *= state.volume;

  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  const start = state.audioContext.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function sfxClick() {
  playTone(420, 0.055, "square", 0.035);
}

function sfxSuccess() {
  playTone(630, 0.11, "sine", 0.08);
  playTone(860, 0.12, "sine", 0.08, 0.09);
  playTone(1130, 0.18, "sine", 0.07, 0.19);
}

function sfxFail() {
  playTone(170, 0.18, "sawtooth", 0.09);
  playTone(95, 0.27, "sawtooth", 0.08, 0.10);
}

function updateOrientationWarning() {
  const isPortrait = window.innerHeight > window.innerWidth;
  ui.orientationWarning.classList.toggle("is-active", isPortrait);
}

function resetRoundVisuals() {
  state.input = "";
  state.resolving = false;
  state.canPlay = false;

  ui.typedDisplay.textContent = "-----";
  ui.typedDisplay.classList.remove("error");
  ui.redLight.classList.remove("is-on");
  ui.greenLight.classList.remove("is-on");
  ui.timerFill.style.transform = "scaleX(0)";
}

function roundDuration() {
  const speedUps = Math.floor(state.roundsWon / 5);
  return Math.max(MIN_ROUND_TIME_MS, BASE_ROUND_TIME_MS - speedUps * 380);
}

function startGame() {
  ensureAudio();
  clearTimeout(state.timeoutId);
  cancelAnimationFrame(state.animationFrame);

  state.lives = 3;
  state.roundsWon = 0;
  startNextRound();
}

function startNextRound() {
  clearTimeout(state.timeoutId);
  cancelAnimationFrame(state.animationFrame);
  resetRoundVisuals();

  ui.commandText.textContent = "TYPE!";
  showScreen("command");

  state.timeoutId = window.setTimeout(() => {
    showScreen("game");
    state.canPlay = true;
    state.currentRoundTime = roundDuration();
    state.roundStartedAt = performance.now();
    ui.timerFill.style.transform = "scaleX(1)";
    tickTimer();
  }, COMMAND_TIME_MS);
}

function tickTimer() {
  if (!state.canPlay || state.resolving) return;

  const elapsed = performance.now() - state.roundStartedAt;
  const remaining = Math.max(0, 1 - elapsed / state.currentRoundTime);
  ui.timerFill.style.transform = `scaleX(${remaining})`;

  if (remaining <= 0) {
    finishRound(false, "FAIL!", "Time is up.");
    return;
  }

  state.animationFrame = requestAnimationFrame(tickTimer);
}

function setTypedDisplay() {
  ui.typedDisplay.textContent = state.input.padEnd(PASSWORD.length, "-");
}

function pressKey(key) {
  if (!state.canPlay || state.resolving) return;
  ensureAudio();
  sfxClick();

  if (key === "C") {
    state.input = "";
    setTypedDisplay();
    return;
  }

  if (!/^[0-9B]$/.test(key)) return;
  if (state.input.length >= PASSWORD.length) return;

  state.input += key;
  setTypedDisplay();

  if (state.input.length === PASSWORD.length) {
    if (state.input === PASSWORD) {
      finishRound(true, "OK!", "Next minigame...");
    } else {
      finishRound(false, "FAIL!", "Wrong password.");
    }
  }
}

function prepareResultVideo(success) {
  const videoSource = success ? RESULT_VIDEOS.success : RESULT_VIDEOS.fail;

  ui.resultVideo.pause();
  ui.resultVideo.removeAttribute("src");
  ui.resultVideo.classList.remove("has-video");

  ui.videoPlaceholder.classList.remove("success", "fail");
  ui.videoPlaceholder.classList.add(success ? "success" : "fail");
  ui.videoPlaceholder.textContent = success ? "SUCCESS VIDEO" : "FAIL VIDEO";

  if (!videoSource) return;

  ui.resultVideo.src = videoSource;
  ui.resultVideo.classList.add("has-video");
  ui.resultVideo.currentTime = 0;
  ui.resultVideo.play().catch(() => {});
}

function finishRound(success, title, message) {
  if (state.resolving) return;

  state.resolving = true;
  state.canPlay = false;
  clearTimeout(state.timeoutId);
  cancelAnimationFrame(state.animationFrame);

  ui.resultCard.classList.remove("success", "fail");
  ui.resultCard.classList.add(success ? "success" : "fail");
  ui.resultTitle.textContent = title;
  ui.resultMessage.textContent = message;
  prepareResultVideo(success);

  if (success) {
    state.roundsWon += 1;
    ui.greenLight.classList.add("is-on");
    sfxSuccess();
  } else {
    state.lives = Math.max(0, state.lives - 1);
    ui.redLight.classList.add("is-on");
    ui.typedDisplay.classList.add("error");
    sfxFail();
  }

  window.setTimeout(() => {
    showScreen("result");

    window.setTimeout(() => {
      if (success) {
        startNextRound();
        return;
      }

      if (state.lives <= 0) {
        endGame();
        return;
      }

      showLifeLostScreen();

      window.setTimeout(() => {
        startNextRound();
      }, LIFE_LOST_TIME_MS);
    }, RESULT_TIME_MS);
  }, 300);
}

function showLifeLostScreen() {
  ui.livesMessage.textContent = `${state.lives} ${state.lives === 1 ? "life" : "lives"} left.`;
  ui.lifeMarkers.innerHTML = "";

  for (let i = 0; i < 3; i += 1) {
    const marker = document.createElement("span");
    marker.className = "life-marker";

    if (i >= state.lives) {
      marker.classList.add("empty");
    }

    if (i === state.lives) {
      marker.classList.add("just-lost");
    }

    ui.lifeMarkers.appendChild(marker);
  }

  showScreen("lifeLost");
}

function endGame() {
  registerScore();
  ui.timerFill.style.transform = "scaleX(0)";
  showScreen("gameOver");
}

function updateAudioUi() {
  ui.soundToggleButton.textContent = state.soundEnabled ? "ON" : "OFF";
  ui.soundToggleButton.classList.toggle("is-on", state.soundEnabled);
  ui.volumeSlider.value = Math.round(state.volume * 100);
}

function openAudioSettings() {
  ui.audioSettings.classList.add("is-active");
  ui.audioSettings.setAttribute("aria-hidden", "false");
  updateAudioUi();
}

function closeAudioSettings() {
  ui.audioSettings.classList.remove("is-active");
  ui.audioSettings.setAttribute("aria-hidden", "true");
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem("exchangeLifeSoundEnabled", String(state.soundEnabled));
  updateAudioUi();

  if (state.soundEnabled) {
    ensureAudio();
    sfxClick();
  }
}

function setVolume(value) {
  state.volume = Number(value) / 100;
  localStorage.setItem("exchangeLifeVolume", String(value));
}

function openYoutubeVideo() {
  if (!YOUTUBE_GAME_URL) {
    alert("The YouTube video is not set yet. Add the link in src/game.js later.");
    return;
  }

  window.open(YOUTUBE_GAME_URL, "_blank", "noopener,noreferrer");
}

function loadPlayer() {
  try {
    return JSON.parse(localStorage.getItem("exchangeLifePlayer")) || null;
  } catch {
    return null;
  }
}

function savePlayer(player) {
  localStorage.setItem("exchangeLifePlayer", JSON.stringify(player));
  state.player = player;
}

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem("exchangeLifeScoreboard")) || [];
  } catch {
    return [];
  }
}

function saveScores(scores) {
  localStorage.setItem("exchangeLifeScoreboard", JSON.stringify(scores));
}

function updateAvatarPreview() {
  ui.avatarPreview.className = `avatar-preview avatar-hair-${state.avatarDraft.hair} avatar-shirt-${state.avatarDraft.shirt} avatar-skin-${state.avatarDraft.skin}`;
}

function openCharacterScreen() {
  const player = state.player;

  if (player) {
    ui.playerNameInput.value = player.name;
    ui.playerClassInput.value = player.className || "";
    state.avatarDraft = {
      hair: Number(player.avatar?.hair || 1),
      shirt: Number(player.avatar?.shirt || 1),
      skin: Number(player.avatar?.skin || 1)
    };
  }

  updateAvatarPreview();
  updateOptionButtons();
  ui.characterScreen.classList.add("is-active");
  ui.characterScreen.setAttribute("aria-hidden", "false");
  ui.playerNameInput.focus();
}

function closeCharacterScreen() {
  ui.characterScreen.classList.remove("is-active");
  ui.characterScreen.setAttribute("aria-hidden", "true");
}

function updateOptionButtons() {
  document.querySelectorAll(".option-buttons").forEach(group => {
    const option = group.dataset.option;

    group.querySelectorAll("button").forEach(button => {
      button.classList.toggle("is-selected", Number(button.dataset.value) === Number(state.avatarDraft[option]));
    });
  });
}

function handleCharacterOptionClick(event) {
  const button = event.target.closest("button[data-value]");
  if (!button) return;

  const group = button.closest(".option-buttons");
  const option = group.dataset.option;

  state.avatarDraft[option] = Number(button.dataset.value);
  updateAvatarPreview();
  updateOptionButtons();
  ensureAudio();
  sfxClick();
}

function handleCharacterSubmit(event) {
  event.preventDefault();

  const name = ui.playerNameInput.value.trim() || "Student";
  const className = ui.playerClassInput.value.trim();

  savePlayer({
    name,
    className,
    avatar: { ...state.avatarDraft }
  });

  closeCharacterScreen();
  renderScoreboard();
  alert("Character saved!");
}

function openScoreboardScreen() {
  renderScoreboard();
  ui.scoreboardScreen.classList.add("is-active");
  ui.scoreboardScreen.setAttribute("aria-hidden", "false");
}

function closeScoreboardScreen() {
  ui.scoreboardScreen.classList.remove("is-active");
  ui.scoreboardScreen.setAttribute("aria-hidden", "true");
}

function renderScoreboard() {
  const player = state.player;

  ui.currentPlayerCard.innerHTML = player
    ? `Current player: <strong>${escapeHtml(player.name)}</strong>${player.className ? ` · ${escapeHtml(player.className)}` : ""}`
    : `No character created yet. Click <strong>👤</strong> to create one.`;

  const scores = loadScores()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (!scores.length) {
    ui.scoreboardList.innerHTML = `<li><span class="rank-avatar">!</span><span class="rank-info"><strong>No scores yet</strong><small>Play a match to appear here.</small></span><span class="rank-score">0</span></li>`;
    return;
  }

  ui.scoreboardList.innerHTML = scores.map((entry, index) => `
    <li>
      <span class="rank-avatar">${index + 1}</span>
      <span class="rank-info">
        <strong>${escapeHtml(entry.name)}</strong>
        <small>${escapeHtml(entry.className || "No class")} · ${new Date(entry.date).toLocaleDateString("en-US")}</small>
      </span>
      <span class="rank-score">${entry.score}</span>
    </li>
  `).join("");
}

function registerScore() {
  const player = state.player || {
    name: "Student",
    className: "",
    avatar: { hair: 1, shirt: 1, skin: 1 }
  };

  const scores = loadScores();

  scores.push({
    name: player.name,
    className: player.className || "",
    avatar: player.avatar,
    score: state.roundsWon,
    date: new Date().toISOString()
  });

  saveScores(scores.sort((a, b) => b.score - a.score).slice(0, 30));
}

function clearScoreboard() {
  if (!confirm("Clear the leaderboard saved in this browser?")) return;

  localStorage.removeItem("exchangeLifeScoreboard");
  renderScoreboard();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

ui.playButton.addEventListener("click", startGame);
ui.restartButton.addEventListener("click", startGame);
ui.audioButton.addEventListener("click", openAudioSettings);
ui.youtubeButton.addEventListener("click", openYoutubeVideo);
ui.characterButton.addEventListener("click", openCharacterScreen);
ui.scoreboardButton.addEventListener("click", openScoreboardScreen);
ui.closeCharacterButton.addEventListener("click", closeCharacterScreen);
ui.closeScoreboardButton.addEventListener("click", closeScoreboardScreen);
ui.characterForm.addEventListener("submit", handleCharacterSubmit);
ui.clearScoreboardButton.addEventListener("click", clearScoreboard);
document.querySelectorAll(".option-buttons").forEach(group => group.addEventListener("click", handleCharacterOptionClick));
ui.closeAudioButton.addEventListener("click", closeAudioSettings);
ui.soundToggleButton.addEventListener("click", toggleSound);
ui.volumeSlider.addEventListener("input", event => setVolume(event.target.value));

ui.audioSettings.addEventListener("click", event => {
  if (event.target === ui.audioSettings) {
    closeAudioSettings();
  }
});

ui.characterScreen.addEventListener("click", event => {
  if (event.target === ui.characterScreen) {
    closeCharacterScreen();
  }
});

ui.scoreboardScreen.addEventListener("click", event => {
  if (event.target === ui.scoreboardScreen) {
    closeScoreboardScreen();
  }
});

ui.keys.addEventListener("click", event => {
  const button = event.target.closest("button[data-key]");
  if (!button) return;

  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 100);
  pressKey(button.dataset.key);
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (ui.audioSettings.classList.contains("is-active")) closeAudioSettings();
    if (ui.characterScreen.classList.contains("is-active")) closeCharacterScreen();
    if (ui.scoreboardScreen.classList.contains("is-active")) closeScoreboardScreen();
    return;
  }

  const key = event.key.toUpperCase();

  if (key === "ENTER") {
    if (screens.menu.classList.contains("is-active") || screens.gameOver.classList.contains("is-active")) {
      startGame();
    }

    return;
  }

  if (key === "BACKSPACE" || key === "DELETE") {
    pressKey("C");
    return;
  }

  if (/^[0-9B]$/.test(key)) {
    const button = ui.keys.querySelector(`[data-key="${key}"]`);

    if (button) {
      button.classList.add("is-pressed");
      window.setTimeout(() => button.classList.remove("is-pressed"), 100);
    }

    pressKey(key);
  }
});

window.addEventListener("resize", updateOrientationWarning);
window.addEventListener("orientationchange", updateOrientationWarning);

updateOrientationWarning();
updateAudioUi();
