// popup page

const enabledBox = document.getElementById("enabled");
const statusEl = document.getElementById("status");

const showEnabled = (enabled) => {
  enabledBox.checked = enabled;
  statusEl.textContent = enabled ? "Active on VTOP pages" : "Paused";
  statusEl.classList.toggle("off", !enabled);
};

const timeAgo = (t) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.round(s / 60) + " min ago";
  if (s < 86400) return Math.round(s / 3600) + " h ago";
  return Math.round(s / 86400) + " d ago";
};

const showStats = ({ solves = 0, lastAnswer, lastSolvedAt }) => {
  document.getElementById("solves").textContent = solves.toLocaleString();
  if (lastAnswer) {
    document.getElementById("last").textContent = lastAnswer;
    document.getElementById("last-label").textContent = "Solved " + timeAgo(lastSolvedAt);
  }
};

chrome.storage.sync.get({ enabled: true }).then(({ enabled }) => showEnabled(enabled));
chrome.storage.local.get(["solves", "lastAnswer", "lastSolvedAt"]).then(showStats);

enabledBox.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledBox.checked });
  showEnabled(enabledBox.checked);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    chrome.storage.local.get(["solves", "lastAnswer", "lastSolvedAt"]).then(showStats);
  }
});

document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
