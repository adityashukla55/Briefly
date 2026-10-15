# Briefly

**Official letters, explained.** Take a photo of an official letter from **Germany, Austria, Switzerland, France, Spain, Portugal, Italy, the Netherlands, Belgium, Poland, Sweden, Denmark, the United Kingdom, Ireland, the United States or Canada** and understand it in plain English: who sent it, what they want, the deadline, the amount, and what to do next.

**Try it: [brieflyapp.pages.dev](https://brieflyapp.pages.dev)** — no sign-up, nothing to install.

Everything runs in your browser. The letter is never uploaded — not to a server, not to an AI company. It works offline and can be installed like an app.

## What it does

- **Reads the letter** from a photo, a scanned PDF, a normal PDF or pasted text — in German, French, Spanish, Portuguese, Italian, Dutch, Polish, Swedish, Danish or English.
- **Knows each country:** the offices (Finanzamt, AMS, Betreibungsamt, CAF, Agencia Tributaria, Agenzia delle Entrate, Belastingdienst, FOD Financiën / SPF Finances, Finanças, Urząd Skarbowy, Skatteverket, Skattestyrelsen, HMRC, Revenue, IRS, CRA…), the kinds of letters, how deadlines are counted, money formats and reference numbers.
- **Detects the country by itself** from the language, IBAN and office names — and switches if you picked the wrong one.
- **Finds the important dates**: payment deadlines, appointments, and the last day to object — including deadlines like “within one month after delivery” or “within 10 working days”, estimated with each country’s delivery rule.
- **Finds the money**: what you must pay, or what you get back, plus IBAN and payment reference with copy buttons. Euros and Swiss francs.
- **Tells you what to do** as a checklist, and explains the office words in the letter.
- **Adds a calendar reminder** (.ics file) for any deadline.
- **Writes the reply for you**: ready-made letters in the letter’s language to object, ask for more time, pay in instalments, or move an appointment. Print them or save them as a PDF.
- **Cancels a contract**: enter when a phone, internet, gym, streaming or insurance contract started, its minimum term and its notice period. Briefly shows the last day to cancel, when the contract ends and what happens if it renews, and writes the cancellation letter in the country’s language. It also gives short tips on local consumer law for each country, like Germany’s 2022 law for fair consumer contracts.
- **Translates the whole letter** to English on the device, with amounts and dates protected from translation mistakes.
- **Hides private details before you share**: want a friend or an advice centre to look at a letter? Briefly shows each page with black boxes already over the name and address, IBANs and bank accounts, reference and customer numbers, tax and ID numbers, birth dates, phone numbers and email addresses. Tap a box to remove it, drag to add one, then save the pages as images, share them, or print them as a PDF. An optional AI name finder also finds names the rules miss, like a child’s name in the middle of the letter.
- **Copy or save the text** it read — a private, offline document-to-text scanner.
- **Keeps letters, only if you want**: press *Keep this letter* to save it in *My letters*, a private folder on the device, locked with your password. It shows all open deadlines with the next one on top, lets you search, add a short note, mark a letter as done, delete one letter or everything, and download an encrypted backup. It locks by itself after 5 minutes without use and when the page closes.

## Privacy by design

| | |
|---|---|
| No server sees your letter | A static site. The only backend is a tiny feedback function that receives what a visitor types into “Report a problem” — never a letter. |
| Locked down | The Content Security Policy only allows connections to the site itself (`connect-src 'self'`), so the page *cannot* send your letter anywhere. |
| Saved only if you choose | Nothing is saved unless you press **Keep this letter**. Kept letters are encrypted with your password (AES-256-GCM, key from PBKDF2-SHA-256 with 600,000 rounds and a random salt) and stay in the browser’s IndexedDB on this device. The password and the key are never stored. |
| Offline | A service worker keeps the app, the text reader and the translator on the device after first use. |

## Works with your phone and computer

- **Save as an app** with one tap where the browser allows it, with step-by-step help for iPhone, Android, Chrome, Edge, Safari and Firefox.
- **Share to Briefly** from the phone’s gallery or a PDF viewer (Android share target).
- **Open PDFs with Briefly** from the file manager on desktop (file handler).
- **Take a photo** straight from the camera.
- **Add to calendar** opens the phone’s or computer’s calendar.

## How it works

```
photo / PDF ──► text reader (Tesseract, WebAssembly) ──► country rules ──► dates, money, steps, replies
                pdf.js for text PDFs                          │
                                                              └──► translator (Bergamot, WebAssembly) ──► English
```

- **Text reading:** [Tesseract.js](https://github.com/naptha/tesseract.js) with German, French, Spanish, Portuguese, Italian, Dutch, Polish, Swedish, Danish and English models, and [pdf.js](https://github.com/mozilla/pdf.js) for PDFs that already contain text.
- **Understanding:** hand-written rules. Each **language** ([`web/src/languages/`](web/src/languages/)) knows dates, deadline phrases, amounts and reply letters. Each **country** ([`web/src/countries/`](web/src/countries/)) knows its offices, letter types, legal delivery rules, office words and example letters. The engine is [`web/src/analyze.js`](web/src/analyze.js). Rules are predictable and testable, which matters when the result is a legal deadline.
- **Hiding private details:** the text reader also keeps where each word is on the page (Tesseract word boxes, or pdf.js text positions for PDFs with text). [`web/src/redact.js`](web/src/redact.js) groups the words into lines and blocks by their position, so a second column next to the address stays apart, and then finds what to hide with rules: the address block (a title like “Herrn” or “Mr”, or a name over a street and a postcode line in the format of each country), names after greetings, IBANs checked with their checksum, the country’s own reference number labels, ID formats like the Swiss AHV number or the Italian codice fiscale, birth dates, phone numbers and emails. A name found once is hidden on every page. The black boxes are drawn into the pixels of a canvas and the pages are saved from that canvas, so the hidden text is really gone and no photo data (like location) is kept.
- **AI name finder:** an optional, multilingual named-entity model ([DistilBERT, quantized to 8 bits](https://huggingface.co/Xenova/distilbert-base-multilingual-cased-ner-hrl)) that runs in a web worker with [Transformers.js](https://github.com/huggingface/transformers.js) and ONNX Runtime (WebAssembly). Each word the text reader found is tokenized on its own, so every label maps straight back to a word box on the page; [`web/src/redact.js`](web/src/redact.js) then joins the words tagged as people into boxes and hides the same names on every page. The model (129 MB) is served from Briefly’s own site, split into parts under Cloudflare’s 25 MiB file limit and put back together in the browser ([`web/src/names-worker.js`](web/src/names-worker.js)), so the page lock (`connect-src 'self'`) stays as it is. It downloads only when you ask for it and then works offline.
- **Translation:** [Bergamot](https://browser.mt/) models (the engine behind Firefox Translations) for German, French, Spanish, Portuguese, Italian, Dutch, Polish, Swedish and Danish → English, 20–26 MB each, downloaded only when used. Letters from the UK, Ireland, the United States and Canada are already in English, so they need no translator. Belgian letters can be in Dutch or French; Briefly picks the right language by itself.
- **My letters:** [`web/src/vault.js`](web/src/vault.js) encrypts with the browser’s Web Crypto, [`web/src/folder.js`](web/src/folder.js) stores the encrypted letters in IndexedDB, and [`web/src/letters.js`](web/src/letters.js) is the screen. The key lives only in memory while the folder is open. The tests run the same code in Node with a small in-memory stand-in for IndexedDB.
- **No framework, no build step.** Plain HTML, CSS and JavaScript modules.

## Search pages

[`scripts/pages.mjs`](scripts/pages.mjs) generates static, search-friendly pages from the same country files the app uses, so they always match:

- a page per country, e.g. [/germany/](https://brieflyapp.pages.dev/germany/)
- a page per office, e.g. [/germany/finanzamt/](https://brieflyapp.pages.dev/germany/finanzamt/)
- a page per office word, e.g. [/germany/words/bescheid/](https://brieflyapp.pages.dev/germany/words/bescheid/)
- reply templates, e.g. [/germany/templates/objection/](https://brieflyapp.pages.dev/germany/templates/objection/)
- tool pages: scan to text offline, translate letters, deadline calculator, cancel a contract, hide private details
- `sitemap.xml`, `robots.txt`, structured data (breadcrumbs, FAQ, web app)

After changing a country or language file, run `npm run pages` and commit the result. It also rebuilds `web/src/countries/meta.js`, the small country list the app loads first (each full country file is loaded only when needed). A test fails if anything is out of date.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:8150. `npm install` also copies the libraries into `web/vendor` and downloads the translation models (checked with SHA-256).

Run the tests:

```bash
npm test
```

## Deploy to Cloudflare Pages

**With Git (recommended):** connect the GitHub repository to a Cloudflare Pages project (Workers & Pages → Create → “Looking to deploy Pages? Get started”, or **Settings → Build → Connect** on an existing project) and use these build settings. Every push to `main` then deploys by itself, up to 20,000 files, including the feedback function in [`functions/`](functions/):

| Setting | Value |
|---|---|
| Build command | `npm run vendor` |
| Build output directory | `web` |
| Root directory | *(empty)* |
| Environment variable | `NODE_VERSION` = `22` |

Uploading the `web` folder by hand in the dashboard is limited to 1,000 files and can’t run the feedback function, so use Git or Wrangler instead.

**From your computer:**

```bash
npx wrangler pages deploy web --project-name brieflyapp
```

Security headers come from [`web/_headers`](web/_headers).

## Feedback (“Report a problem”)

Every page has a **Report a problem** button. Under a result there is also a **Report it** link, which adds what Briefly found (kind of letter, office, country), never the letter itself. The form posts to [`functions/api/feedback.js`](functions/api/feedback.js), a Cloudflare Pages Function on the same site, so the page’s lock (`connect-src 'self'`) stays as it is. The function emails the report to you through [Resend](https://resend.com/). Your address is kept as a secret in Cloudflare and never appears on the site.

Set it up once:

1. Create a free account at [resend.com](https://resend.com/). Without your own domain, Resend can send only to the email address you signed up with, which is all this needs.
2. In Resend, go to **API Keys** → **Create API key** (permission: *Sending access*) and copy the key.
3. In Cloudflare, open the **brieflyapp** Pages project → **Settings** → **Variables and Secrets** → **Add** (for Production), and add two secrets:
   - `RESEND_API_KEY` = the key from step 2
   - `FEEDBACK_EMAIL` = the email you used for Resend
4. Deploy again (push a commit or use **Retry deployment**). Secrets are only picked up by a new deployment.

Spam protection: a hidden field that only bots fill in, a minimum time before sending, size limits, and — once you add a KV namespace — at most 5 reports per sender per hour and 50 per day in total. To turn the limit on: in Cloudflare go to **Storage & Databases → KV → Create** (any name, for example `briefly-feedback`), then in the **brieflyapp** project open **Settings → Bindings → Add → KV namespace**, name the binding `FEEDBACK_LIMITS`, pick the namespace, save and deploy again. Only a hashed IP address is stored, for about an hour. When you run it locally without `RESEND_API_KEY`, reports are printed in the terminal instead of being sent.

## Browser support

Works in the latest Chrome, Edge, Firefox and Safari on phones and computers. Tested with Chrome 155 and WebKit 18 (the engine inside Safari) using photos, normal PDFs, scanned PDFs and the translators.

If something goes wrong, Briefly shows a plain explanation and what to try next. Technical details are hidden under “Technical details” for bug reports.

## Limits

- Handwritten letters and password-protected PDFs can’t be read.
- Switzerland: German-language letters only, for now.
- Briefly is **not legal advice**. It helps you understand a letter; always check the original.
- Photo reading can make mistakes. The text it read is shown and can be corrected.
- Deadlines like “one month after delivery” are estimates and are marked as such.
- Machine translation can be wrong. Dates and amounts in the summary come from the original text, not the translation.

## Credits

Tesseract.js (Apache-2.0), pdf.js (Apache-2.0), Bergamot translator and models (MPL-2.0), Transformers.js (Apache-2.0), ONNX Runtime (MIT), and the name finder model by David Adelani ([Davlan/distilbert-base-multilingual-cased-ner-hrl](https://huggingface.co/Davlan/distilbert-base-multilingual-cased-ner-hrl), AFL-3.0), converted to ONNX by Xenova. Example letters are made up.

## Support

Briefly is free and has no ads. If it helped you, you can [buy me a coffee](https://buymeacoffee.com/adi.shukla41).

## License

MIT
