# Briefly

**German letters, explained.** Take a photo of an official German letter and understand it in plain English: who sent it, what they want, the deadline, the amount, and what to do next.

**Try it: [brieflyapp.pages.dev](https://brieflyapp.pages.dev)** — no sign-up, nothing to install.

Everything runs in your browser. The letter is never uploaded — not to a server, not to an AI company. It works offline and can be installed like an app.

## What it does

- **Reads the letter** from a photo, a scanned PDF, a normal PDF or pasted text.
- **Recognises the sender** (Finanzamt, Jobcenter, Ausländerbehörde, Rundfunkbeitrag, health insurance, landlord, court and more) and the **kind of letter** (payment reminder, tax assessment, appointment, request for documents, enforcement…).
- **Finds the important dates**: payment deadlines, appointments, and the last day to object — including deadlines written as “within one month after delivery”, estimated with the German 4-day delivery rule.
- **Finds the money**: what you must pay, or what you get back, plus IBAN and payment reference with copy buttons.
- **Tells you what to do** as a checklist, and explains the German office words in the letter.
- **Adds a calendar reminder** (.ics file) for any deadline.
- **Writes the reply for you**: ready-made German letters to object (Widerspruch / Einspruch), ask for more time, pay in instalments, or move an appointment.
- **Translates the whole letter** to English on the device, with amounts and dates protected from translation mistakes.

## Privacy by design

| | |
|---|---|
| No server | A static site. There is no backend to send anything to. |
| Locked down | The Content Security Policy only allows connections to the site itself (`connect-src 'self'`), so the page *cannot* send your letter anywhere. |
| No storage | Nothing is saved. Close the tab and the letter is gone. |
| Offline | A service worker keeps the app, the text reader and the translator on the device after first use. |

## Works with your phone and computer

- **Save as an app** with one tap where the browser allows it, with step-by-step help for iPhone, Android, Chrome, Edge, Safari and Firefox.
- **Share to Briefly** from the phone’s gallery or a PDF viewer (Android share target).
- **Open PDFs with Briefly** from the file manager on desktop (file handler).
- **Take a photo** straight from the camera.
- **Add to calendar** opens the phone’s or computer’s calendar.

## How it works

```
photo / PDF ──► text reader (Tesseract, WebAssembly) ──► rules ──► dates, money, steps, replies
                pdf.js for text PDFs                     │
                                                         └──► translator (Bergamot, WebAssembly) ──► English
```

- **Text reading:** [Tesseract.js](https://github.com/naptha/tesseract.js) with the German model, and [pdf.js](https://github.com/mozilla/pdf.js) for PDFs that already contain text.
- **Understanding:** hand-written rules in [`web/src/analyze.js`](web/src/analyze.js) and [`web/src/knowledge.js`](web/src/knowledge.js). Rules are predictable and testable, which matters when the result is a legal deadline.
- **Translation:** the [Bergamot](https://browser.mt/) German→English model (the same engine as Firefox Translations), about 23 MB, downloaded once.
- **No framework, no build step.** Plain HTML, CSS and JavaScript modules.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:8150. `npm install` also copies the libraries into `web/vendor` and downloads the translation model (checked with SHA-256).

Run the tests:

```bash
npm test
```

## Deploy to Cloudflare Pages

**With Git (recommended):** in the Cloudflare dashboard go to Workers & Pages → Create → “Looking to deploy Pages? Get started”, connect the GitHub repository and use:

| Setting | Value |
|---|---|
| Build command | `npm run vendor` |
| Build output directory | `web` |
| Environment variable | `NODE_VERSION` = `22` |

**From your computer:**

```bash
npx wrangler pages deploy web --project-name briefly
```

Security headers come from [`web/_headers`](web/_headers).

## Limits

- Briefly is **not legal advice**. It helps you understand a letter; always check the original.
- Photo reading can make mistakes. The text it read is shown and can be corrected.
- Deadlines like “one month after delivery” are estimates and are marked as such.
- Machine translation can be wrong. Dates and amounts in the summary come from the German text, not the translation.

## Credits

Tesseract.js (Apache-2.0), pdf.js (Apache-2.0), Bergamot translator and models (MPL-2.0). Example letters are made up.

## Support

Briefly is free and has no ads. If it helped you, you can [buy me a coffee](https://buymeacoffee.com/adi.shukla41).

## License

MIT
