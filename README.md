# Kirana Khata: a ledger that listens

**Problem statement 01 (Small Shops & Retail):** How might we let a shop owner record credit and payments by typing or speaking one normal sentence, and have AI turn it into clean ledger entries?

A single-page web app for small kirana shop owners. One input box, Hindi/English/Hinglish, no forms.

## Features (mapped to the brief)

| Requirement | How it is built |
|---|---|
| Single input box, AI picks out name, amount, credit vs payment | One text box plus a 🎤 Speak button (Web Speech API, `hi-IN` or `en-IN`). A Hinglish parser extracts customer, amount and type. |
| Confirmation step before saving | The app shows what it understood in editable fields. It warns about unknown or similar customer names, missing or multiple amounts, unclear type, large amounts and overpayments. |
| Running balance and top debtors | Every customer's balance is credit minus payments. The "Who owes the most" list is sorted by amount owed and shows advances separately. |
| Reminder messages in the customer's language | Hindi, English or Hinglish templates that stay editable. Send by WhatsApp or SMS deep link, or copy. |
| Weekly visual summary | A 7-day bar chart of credit given vs payments received, with totals. |

## How to run (2 minutes, nothing to install)

**Option A: open the file**
1. Download or clone the repo: `git clone <your-repo-url>`
2. Open the folder and double-click `index.html` (Chrome or Edge recommended).
3. Click **Load demo data** in the page footer to see the debtors list and weekly chart filled in.
4. Type or speak a sentence such as `Ramesh took 200 rupees of goods today` and press **Understand**.

**Option B: local server (recommended for voice input)**
```
cd kirana-khata
python3 -m http.server 8000
```
Then open http://localhost:8000. Voice input (🎤) needs Chrome or Edge and works on `localhost` or `https`.

No build step, no `npm install`, no API keys, no backend.

**Live demo:** `<add your GitHub Pages URL here>`

## Project structure

```
index.html   page layout
style.css    styling (ruled-notebook look)
app.js       Hinglish parser, ledger maths, confirmation step, reminders, chart, voice
README.md    this file
```

## Deploy on GitHub Pages

1. Push the files to a public repo.
2. Settings → Pages → Deploy from branch → `main` / root.
3. The app is live at `https://<username>.github.io/<repo>/`.

## Sentences to test

- `Ramesh took 200 rupees of goods today` → Ramesh, ₹200, credit
- `Suresh ne 500 rupaye diye` → Suresh, ₹500, payment
- `Sunita ko 350 ka saman diya` → Sunita, ₹350, credit
- `Ramesh ji ne 1500 jama kiye` → Ramesh, ₹1500, payment
- `Mohan udhaar 2 sau, Geeta ne 100 diye` → two entries
- `dhai sau ka atta Mohan ne liya` → Mohan, ₹250, credit
- `रमेश ने 200 रुपये का सामान लिया` → Devanagari (voice output) works too
- `Ramesh ne saman liya` → amount missing, app asks for it
- Type `Ramsh` after `Ramesh` exists → app matches it to the existing customer and warns

Use **Load demo data** in the footer to fill the app with sample entries.

## How it works

1. Devanagari input is transliterated to Latin, so the same rules cover typed Hinglish and Hindi speech recognition.
2. Amounts are read from digits (`₹1,200`, `2k`) and words (`2 sau`, `dhai sau`, `hazaar`).
3. Credit vs payment is scored from cue words (`liya`, `udhaar`, `took` vs `diye`, `jama`, `paid`). Grammar such as `ko … diya` (shop gave goods) vs `ne … diye` (customer paid) is handled.
4. Names are taken from around `ne`/`ko`/`se`, then fuzzy-matched (edit distance) to existing customers.
5. Nothing is saved until the owner confirms. Saves can be undone for 5 seconds.

Data is stored in the browser's `localStorage`. There is no server and no API key.

## Limitations and next steps

- The parser is rule-based, which keeps it instant, offline and predictable. An LLM call (for example Claude) could replace `understand()` for free-form sentences with items, dates or partial payments.
- Multiple entries in one sentence work when joined by `aur`, `and` or commas.
- Phone numbers are optional and stored per customer on the device only.
- Next: export to CSV, multiple shops, backup to cloud.

## Built with

Solo entry. Built during the event using Claude as an AI coding assistant, as allowed by the event rules. All code was reviewed and tested by the author.
