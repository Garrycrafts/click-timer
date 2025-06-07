const keys = [
  "KeyQ",
  "KeyE",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyT",
  "Backspace",
  "Space",
  "LeftClick",
  "RightClick",
  "KeyF",
];
let mode = "manual";
let keyToHold = "";
let durationTarget = 0.7;
let windowMin = 1;
const bufferSeconds = 3; // fixed 3 second buffer
let reactionWindow = bufferSeconds;
let isHolding = false;
let holdStart = null;
let animationFrame = null;
let reactionTimeout = null;
let drillActive = false;
let progressStartTime = null;

function startTrainer() {
  clearTimeout(reactionTimeout);
  cancelAnimationFrame(animationFrame);
  document.getElementById("feedback").innerHTML = "";
  isHolding = false;
  drillActive = false;
  mode = document.getElementById("mode").value;
  durationTarget = parseFloat(document.getElementById("duration").value);
  windowMin = parseFloat(document.getElementById("window-min").value);

  if (mode === "manual") {
    keyToHold = document.getElementById("key").value;
    const label = formatKeyLabel(keyToHold);
    document.getElementById(
      "instruction"
    ).innerHTML = `Hold <b>${label}</b> for ${durationTarget} seconds.`;
    updateProgressBar(0);
  } else {
    pickNewDrillTarget();
  }
}

function pickNewDrillTarget() {
  drillActive = true;
  // reactionWindow is random between windowMin and windowMin + bufferSeconds
  const min = windowMin;
  const max = windowMin + bufferSeconds;
  reactionWindow = Math.random() * (max - min) + min;

  keyToHold = keys[Math.floor(Math.random() * keys.length)];
  const label = formatKeyLabel(keyToHold);
  document.getElementById(
    "instruction"
  ).innerHTML = `Hold <b>${label}</b> within ${reactionWindow.toFixed(2)}s`;

  isHolding = false;
  updateProgressBar(100);
  progressStartTime = performance.now();
  animationFrame = requestAnimationFrame(step);

  reactionTimeout = setTimeout(() => {
    if (!isHolding) fail("⏱️ Too slow!");
  }, reactionWindow * 1000);
}

function step() {
  const now = performance.now();
  const elapsed = now - progressStartTime;
  let percent = 0;

  if (mode === "drill" && drillActive) {
    percent = Math.max(0, 100 - (elapsed / (reactionWindow * 1000)) * 100);
    animationFrame = requestAnimationFrame(step);
  } else if (mode === "manual" && isHolding) {
    percent = Math.min(100, (elapsed / (durationTarget * 1000)) * 100);
    animationFrame = requestAnimationFrame(step);
  } else {
    return;
  }

  updateProgressBar(percent);
}

function updateProgressBar(percent) {
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = `${percent}%`;
}

function formatKeyLabel(code) {
  return code === "LeftClick"
    ? "Left Click"
    : code === "RightClick"
    ? "Right Click"
    : code === "Backspace"
    ? "Backspace"
    : code === "Space"
    ? "Spacebar"
    : code.replace("Key", "");
}

function success(duration) {
  drillActive = false;
  clearTimeout(reactionTimeout);
  cancelAnimationFrame(animationFrame);
  document.getElementById(
    "feedback"
  ).innerHTML = `<span class="success">✅ Success! Held for ${duration.toFixed(
    2
  )}s</span>`;
  updateProgressBar(0);
  if (mode === "drill") setTimeout(startTrainer, 1000);
}

function fail(reason) {
  drillActive = false;
  // D;
  clearTimeout(reactionTimeout);
  cancelAnimationFrame(animationFrame);
  document.getElementById(
    "feedback"
  ).innerHTML = `<span class="fail">❌ ${reason}</span>`;
  updateProgressBar(0);
  if (mode === "drill") setTimeout(startTrainer, 1500);
}

document.addEventListener("keydown", (e) => {
  if (mode === "manual" && !isHolding) {
    if (e.code !== keyToHold) return fail("Wrong key!");
    holdStart = performance.now();
    isHolding = true;
    progressStartTime = holdStart;
    animationFrame = requestAnimationFrame(step);
  }
});

document.addEventListener("keyup", (e) => {
  if (mode === "manual" && isHolding) {
    if (e.code !== keyToHold) return;
    const duration = (performance.now() - holdStart) / 1000;
    if (duration >= durationTarget) success(duration);
    else fail("Held too short!");
    isHolding = false;
  }
});

document.addEventListener("mousedown", (e) => {
  if ((keyToHold === "RightClick" || keyToHold === "LeftClick") && !isHolding) {
    const expected = keyToHold === "RightClick" ? 2 : 0;
    if (e.button !== expected) return fail("Wrong button!");
    holdStart = performance.now();
    isHolding = true;
    progressStartTime = holdStart;
    animationFrame = requestAnimationFrame(step);
  }
});

document.addEventListener("mouseup", (e) => {
  if ((keyToHold === "RightClick" || keyToHold === "LeftClick") && isHolding) {
    const expected = keyToHold === "RightClick" ? 2 : 0;
    if (e.button !== expected) return;
    const duration = (performance.now() - holdStart) / 1000;
    if (duration >= durationTarget) success(duration);
    else fail("Held too short!");
    isHolding = false;
  }
});

// Prevent context menu on right click
window.addEventListener("contextmenu", (e) => e.preventDefault());

console.log("Jindex.js connected!");
