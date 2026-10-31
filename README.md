<p align="center">
  <img src="docs/banner.png" alt="Catche — VTOP captchas, solved instantly" width="100%" />
</p>

<p align="center">
  <b>A Chrome extension that reads the VTOP captcha and types it in for you.</b><br/>
  Runs fully offline in your browser — no servers, no tracking.
</p>

---

## ✨ Features

- **Instant autofill** — the captcha box is filled the moment the image loads, and again every time you hit refresh.
- **Works on every VTOP page** — it finds the captcha image and its input box by itself, so it keeps working when VIT changes the page layout.
- **On-device model** — a tiny neural network runs right inside the page. Nothing is sent anywhere.
- **One-click pause** — switch auto-solve off from the popup without uninstalling.
- **Solve counter** — see how many captchas Catche has typed for you and the last answer.

## 🌐 Supported sites

| Site | URL |
| --- | --- |
| VTOP Chennai | `vtopcc.vit.ac.in/vtop/login` |
| Course Registration (Chennai) | `vtopregcc.vit.ac.in/LiveRegistration/` |
| VTOP Vellore | `vtop.vit.ac.in` |
| VIT-AP / VIT Bhopal | `*.vitap.ac.in`, `*.vitbhopal.ac.in` |

> If VTOP shows Google's "I'm not a robot" reCAPTCHA instead of the image captcha, you'll have to tick that one yourself.

## 📦 Install

Catche isn't on the Chrome Web Store, so you load it as an unpacked extension. Takes about a minute.

1. **Download** — click the green **Code** button above → **Download ZIP**, and unzip it.
   Or with git:
   ```bash
   git clone https://github.com/helpRifan/catche.git
   ```
2. Open **`chrome://extensions`** in Chrome (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `catche` folder (the one containing `manifest.json`).
5. Pin it: click the 🧩 puzzle icon in the toolbar → pin **Catche**.
6. Open [VTOP](https://vtopcc.vit.ac.in/vtop/login) — the captcha box fills itself and glows briefly. ✅

> **Have the old "Vtop Captcha Solver" installed?** Disable it, otherwise both will try to fill the box.

### Updating

```bash
cd catche && git pull
```
Then press the ↻ reload button on Catche's card in `chrome://extensions`. (If you used the ZIP, download it again and replace the folder.)

## 🛠 Troubleshooting

| Problem | Fix |
| --- | --- |
| Box isn't filled | Make sure the switch in the popup is **on**, then refresh the page. |
| Wrong answer | Click VTOP's refresh button next to the captcha — Catche solves the new one automatically. |
| "Cannot load extension with file or directory name _metadata" | Delete the `_metadata` folder inside `catche` and load again. |
| Still stuck | Press <kbd>F12</kbd> → **Console** and look for lines starting with `Catche`. Open an [issue](https://github.com/helpRifan/catche/issues) with what you see. |

## 🧠 How it works

1. Scans the page for an image that looks like a captcha (wide and short, with "captcha" in its id, class, source or parent) and the text box next to it.
2. Draws the image onto a canvas, splits it into the six character slots and binarises each one.
3. Runs each slot through a small dense neural network (`velloreWeights.json` for the current 200×40 captchas, `chennaiWeights.json` for the older 180×45 ones).
4. Types the six-character answer into the box and fires `input`/`change` events so the page notices.

A `MutationObserver` watches for the captcha being refreshed or swapped in later, so the box is always up to date.

## 🔒 Privacy

Catche needs only the `storage` permission (for the on/off switch and the solve counter). It makes **no network requests** — the model files are bundled with the extension, and nothing about you or your login ever leaves your browser.

## 🙏 Credits

Built on the captcha models from the original **Vtop Captcha Solver** extension. Catche fixes it for the current VTOP pages, adds automatic captcha detection, removes the tracking, and gives it a fresh look.

---

<p align="center"><sub>Not affiliated with VIT. Use responsibly.</sub></p>
