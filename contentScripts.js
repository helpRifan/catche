function softmax(a){
  var n = [...a];
  let s = 0;
  n.forEach((f) => {
    s += Math.exp(f);
  });
  for (let i = 0; i < a.length; i++) {
    n[i] = Math.exp(a[i]) / s;
  }
  return n;
};

function matrixMultiplication(a, b){
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) {
    throw new Error("arguments should be in 2-dimensional array format");
  }
  let x = a.length,
    z = a[0].length,
    y = b[0].length;
  if (b.length !== z) {
    // XxZ & ZxY => XxY
    throw new Error("matrix dimensions do not match");
  }
  let productRow = Array.apply(null, new Array(y)).map(
    Number.prototype.valueOf,
    0
  );
  let product = new Array(x);
  for (let p = 0; p < x; p++) {
    product[p] = productRow.slice();
  }
  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < z; k++) {
        product[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return product;
};

function matrixAddition(a, b){
  let x = a.length;
  let c = new Array(x);
  for (let i = 0; i < x; i++) {
    c[i] = a[i] + b[i];
  }
  return c;
};

function saturation(d){
  let sat = new Array(d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    let min = Math.min(d[i], d[i + 1], d[i + 2]);
    let max = Math.max(d[i], d[i + 1], d[i + 2]);
    sat[i / 4] = max ? Math.round(((max - min) * 255) / max) : 0;
  }
  return sat;
};

function flatten(ar){
  var ne = new Array(ar.length * ar[0].length);
  for (let i = 0; i < ar.length; i += 1) {
    for (let j = 0; j < ar[0].length; j += 1) {
      ne[i * ar[0].length + j] = ar[i][j];
    }
  }
  return ne;
};

function deflatten(ar, shape){
  var img = new Array(shape[0]);
  for (let i = 0; i < shape[0]; i += 1) {
    img[i] = new Array(shape[1]);
    for (let j = 0; j < shape[1]; j += 1) {
      img[i][j] = ar[i * shape[1] + j];
    }
  }
  return img;
};

function vellorePreProcess(im){
  let avg = 0;
  im.forEach((e) => e.forEach((f) => (avg += f)));
  avg /= 24 * 22;
  var ne = new Array(im.length);
  for (let i = 0; i < im.length; i += 1) {
    ne[i] = new Array(im[0].length);
    for (let j = 0; j < im[0].length; j += 1) {
      if (im[i][j] > avg) {
        ne[i][j] = 1;
      } else {
        ne[i][j] = 0;
      }
    }
  }
  return ne;
};

function chennaiPreProcess(im){
  // binarized with cleanEdges and invertedColors
  for (let i=0; i<im.length; i+=1){
    for (let j=0; j<im[0].length; j+=1){
      if (i==0 || j==0 || i==im.length-1 || j==im[0].length-1){
        im[i][j] = 0;
      } else {
        if (im[i][j]/255 > 0.3){
          im[i][j] = 0;
        } else {
          im[i][j] = 1;
        }
      }
    }
  }
  // denoising step of the original pipeline was a no-op (im[i,j] indexing),
  // and the model was trained that way, so the binarized image is returned as is
  return im.map(elem=>elem.slice());
}

function VelloreBlocks(im){
  let blocksList = new Array(6);
  for (let a = 0; a < 6; a += 1) {
    let x1 = (a + 1) * 25 + 2;
    let y1 = 7 + 5 * (a % 2) + 1;
    let x2 = (a + 2) * 25 + 1;
    let y2 = 35 - 5 * ((a + 1) % 2);
    blocksList[a] = im.slice(y1, y2).map((i) => i.slice(x1, x2));
  }
  return blocksList;
};

function chennaiBlocks(im){
  let blocksList = new Array(6);
  for (let a=0; a<6; a+=1){
    let x1 = (a)*30
    let y1 = 10
    let x2 = (a)*30+25
    let y2 = 45
    blocksList[a] = im.slice(y1,y2).map(i => i.slice(x1,x2));
  }
  return blocksList;
}

// ---------- models ----------

const MODELS = {
  // 200x40 coloured captcha: VTOP Vellore, VTOP Chennai, VTOP registration, ...
  vellore: {
    file: "velloreWeights.json",
    width: 200,
    height: 40,
    labels: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    blocks: (pd) => VelloreBlocks(deflatten(saturation(pd.data), [40, 200])),
    preProcess: vellorePreProcess,
  },
  // older 180x45 grey captcha (VIT-AP / Bhopal / old Chennai)
  chennai: {
    file: "chennaiWeights.json",
    width: 180,
    height: 45,
    labels: "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789",
    blocks: (pd) => {
      let dat = new Array(pd.data.length/4);
      for (let a=0; a<pd.data.length; a+=4){
        dat[a/4] = pd.data[a];
      }
      return chennaiBlocks(deflatten(dat, [45, 180]));
    },
    preProcess: chennaiPreProcess,
  },
};

const weightsCache = {};
const loadWeights = (model) => {
  if (!weightsCache[model.file]) {
    weightsCache[model.file] = fetch(chrome.runtime.getURL(model.file))
      .then((response) => response.json());
  }
  return weightsCache[model.file];
};

const pickModel = (img) => {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (Math.abs(w - 180) <= 5 && Math.abs(h - 45) <= 5) return MODELS.chennai;
  return MODELS.vellore;
};

const solveImage = async (img) => {
  const model = pickModel(img);
  const data = await loadWeights(model);

  const canvas = document.createElement("canvas");
  canvas.width = model.width;
  canvas.height = model.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, model.width, model.height);
  const pd = ctx.getImageData(0, 0, model.width, model.height);

  let out = "";
  for (let block of model.blocks(pd)) {
    block = model.preProcess(block);
    block = [flatten(block)];
    block = matrixMultiplication(block, data.weights);
    block = matrixAddition(...block, data.biases);
    block = softmax(block);
    block = block.indexOf(Math.max(...block));
    out += model.labels[block];
  }
  return out;
};

// ---------- finding the captcha on any page ----------

const CAPTCHA_RE = /captcha/i;

const mentionsCaptcha = (el) =>
  !!el && CAPTCHA_RE.test([el.id, el.name, el.className, el.alt, el.title, el.getAttribute("aria-label")].join(" "));

const looksLikeCaptchaSize = (img) => {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) return false;
  const ratio = w / h;
  return w >= 100 && w <= 400 && ratio >= 3 && ratio <= 6;
};

const captchaImageScore = (img) => {
  if (!looksLikeCaptchaSize(img)) return 0;
  let score = 1;
  if (mentionsCaptcha(img)) score += 4;
  if (CAPTCHA_RE.test(img.getAttribute("src") || "")) score += 3;
  if ((img.getAttribute("src") || "").startsWith("data:image")) score += 2;
  // e.g. <div id="captchaBlock"><img ...></div>
  for (let p = img.parentElement, depth = 0; p && depth < 4; p = p.parentElement, depth++) {
    if (mentionsCaptcha(p)) { score += 3; break; }
  }
  if (findCaptchaInput(img)) score += 2;
  return score;
};

const findCaptchaImage = () => {
  let best = null, bestScore = 1; // a plain wide image with no captcha hints is not enough
  for (const img of document.querySelectorAll("img")) {
    const s = captchaImageScore(img);
    if (s > bestScore) { best = img; bestScore = s; }
  }
  return best;
};

const isTextInput = (el) =>
  el.tagName === "INPUT" &&
  ["text", "search", "tel", ""].includes((el.getAttribute("type") || "").toLowerCase()) &&
  !el.disabled && !el.readOnly;

const findCaptchaInput = (img) => {
  const scope = img.closest("form") || document;
  const inputs = [...scope.querySelectorAll("input")].filter(isTextInput);

  // 1. an input that says it is for the captcha (id, name, placeholder, label)
  const named = inputs.find((el) =>
    mentionsCaptcha(el) || CAPTCHA_RE.test(el.placeholder || "") ||
    [...(el.labels || [])].some((l) => CAPTCHA_RE.test(l.textContent))
  );
  if (named) return named;

  // 2. otherwise the first text input that comes after the image
  return inputs.find((el) =>
    img.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
  ) || null;
};

const setInputValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

// brief violet→teal glow so you can see the box was filled
const flashInput = (input) => {
  const prev = { boxShadow: input.style.boxShadow, transition: input.style.transition };
  input.style.transition = "box-shadow 0.25s ease";
  input.style.boxShadow = "0 0 0 3px rgba(45, 212, 191, 0.55), 0 0 14px rgba(124, 92, 255, 0.45)";
  setTimeout(() => {
    input.style.boxShadow = prev.boxShadow;
    setTimeout(() => (input.style.transition = prev.transition), 300);
  }, 900);
};

const recordSolve = (answer) => {
  chrome.storage.local.get({ solves: 0 }).then(({ solves }) =>
    chrome.storage.local.set({ solves: solves + 1, lastAnswer: answer, lastSolvedAt: Date.now() })
  );
};

// ---------- main loop ----------

let enabled = true;
let lastSolvedSrc = null;
let solving = false;

const trySolve = async () => {
  if (!enabled || solving) return;
  const img = findCaptchaImage();
  if (!img) return;
  const src = img.currentSrc || img.src;
  if (src === lastSolvedSrc) return;

  const input = findCaptchaInput(img);
  if (!input) return;

  solving = true;
  try {
    const answer = await solveImage(img);
    console.log("Catche:", answer);
    setInputValue(input, answer);
    flashInput(input);
    recordSolve(answer);
    lastSolvedSrc = src;
  } catch (e) {
    console.log("Catche failed:", e);
  } finally {
    solving = false;
  }
  // the captcha may have been refreshed while we were solving
  const now = findCaptchaImage();
  if (now && (now.currentSrc || now.src) !== lastSolvedSrc) scheduleSolve();
};

let timer = null;
const scheduleSolve = () => {
  clearTimeout(timer);
  timer = setTimeout(trySolve, 100);
};

// images that are still loading have naturalWidth 0, so retry once they load
document.addEventListener("load", (e) => {
  if (e.target.tagName === "IMG") scheduleSolve();
}, true);

new MutationObserver(scheduleSolve).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src"],
});

chrome.storage.sync.get({ enabled: true }).then((res) => {
  enabled = res.enabled;
  scheduleSolve();
});

// the popup's on/off switch applies straight away, no reload needed
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) {
    enabled = changes.enabled.newValue;
    if (enabled) scheduleSolve();
  }
});
