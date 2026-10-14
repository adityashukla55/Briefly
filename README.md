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
- **Writes the reply for you**: ready-made letters in the letter’s language to object, ask for more time, pay in instalments, or move an appointment.
- **Translates the whole letter** to English on the device, with amounts and dates protected from translation mistakes.
- **Copy or save the text** it read — a private, offline document-to-text scanner.

## Privacy by design

| | |
|---|---|
| No server sees your letter | A static site. The only backend is a tiny feedback function that receives what a visitor types into “Report a problem” — never a letter. |
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
photo / PDF ──► text reader (Tesseract, WebAssembly) ──► country rules ──► dates, money, steps, replies
                pdf.js for text PDFs                          │
                                                              └──► translator (Bergamot, WebAssembly) ──► English
```

- **Text reading:** [Tesseract.js](https://github.com/naptha/tesseract.js) with German, French, Spanish, Portuguese, Italian, Dutch, Polish, Swedish, Danish and English models, and [pdf.js](https://github.com/mozilla/pdf.js) for PDFs that already contain text.
- **Understanding:** hand-written rules. Each **language** ([`web/src/languages/`](web/src/languages/)) knows dates, deadline phrases, amounts and reply letters. Each **country** ([`web/src/countries/`](web/src/countries/)) knows its offices, letter types, legal delivery rules, office words and example letters. The engine is [`web/src/analyze.js`](web/src/analyze.js). Rules are predictable and testable, which matters when the result is a legal deadline.
- **Translation:** [Bergamot](https://browser.mt/) models (the engine behind Firefox Translations) for German, French, Spanish, Portuguese, Italian, Dutch, Polish, Swedish and Danish → English, 20–26 MB each, downloaded only when used. Letters from the UK, Ireland, the United States and Canada are already in English, so they need no translator. Belgian letters can be in Dutch or French; Briefly picks the right language by itself.
- **No framework, no build step.** Plain HTML, CSS and JavaScript modules.

## Search pages

[`scripts/pages.mjs`](scripts/pages.mjs) generates static, search-friendly pages from the same country files the app uses, so they always match:

- a page per country, e.g. [/germany/](https://brieflyapp.pages.dev/germany/)
- a page per office, e.g. [/germany/finanzamt/](https://brieflyapp.pages.dev/germany/finanzamt/)
- a page per office word, e.g. [/germany/words/bescheid/](https://brieflyapp.pages.dev/germany/words/bescheid/)
- reply templates, e.g. [/germany/templates/objection/](https://brieflyapp.pages.dev/germany/templates/objection/)
- tool pages: scan to text offline, translate letters, deadline calculator
- `sitemap.xml`, `robots.txt`, structured data (breadcrumbs, FAQ, web app)

After changing a country or language file, run `npm run pages` and commit the result. A test fails if the pages are out of date.

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

Spam protection: a hidden field that only bots fill in, a minimum time before sending, and size limits. When you run it locally without `RESEND_API_KEY`, reports are printed in the terminal instead of being sent.

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

Tesseract.js (Apache-2.0), pdf.js (Apache-2.0), Bergamot translator and models (MPL-2.0). Example letters are made up.

## Support

Briefly is free and has no ads. If it helped you, you can [buy me a coffee](https://buymeacoffee.com/adi.shukla41).

## License

MIT
