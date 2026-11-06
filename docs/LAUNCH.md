# Launch & SEO Guide — JobRadar

## 1. Metadata & Positioning

- **Repository**: `https://github.com/MRJonam91/JobRadar`
- **Primary Keyword**: `job application tracker` / `tracker candidature lavoro`
- **Tagline**: Deterministic job application tracker, interview stage monitor and follow-up reminder engine: local-first, privacy-respecting, zero-dependency.
- **Description (max 350 chars)**: Local-first job application tracker and interview lifecycle monitor. Organize postings, track interview stages, get actionable follow-up reminders, verify salary sources, and export to Markdown, iCal and CSV. Zero dependencies.
- **Topics**: `job-tracker`, `job-hunt`, `application-tracker`, `career-tool`, `job-applications`, `interview-tracker`, `follow-up-reminder`, `local-first`, `privacy-first`, `cv-versioning`, `ical`, `cli`, `typescript`, `nodejs`

---

## 2. Launch Announcement Drafts

### 🇮🇹 Post Italiano (LinkedIn / Telegram / Reddit r/italyinformatica)

> **Titolo**: Ho creato JobRadar: un tracker locale e privacy-first per candidature e colloqui
>
> Chi cerca lavoro o valuta nuove opportunità si ritrova spesso con decine di annunci sparsi tra LinkedIn, Indeed, email, cartelle e fogli di calcolo. È facile perdere di vista quando fare un follow-up, quale versione del CV è stata inviata o se un'offerta sta per scadere.
>
> Ho sviluppato **JobRadar**:
> - 🔒 **100% Locale e Privacy-first**: il file `jobradar.json` risiede solo sul tuo PC, zero tracker.
> - 📅 **Promemoria automatici**: ti avvisa quando una candidatura è ferma da più di 10 giorni o quando un'intervista è imminente.
> - 📆 **Export iCalendar (.ics)**: sincronizza scadenze e promemoria con Google Calendar, Apple Calendar o Outlook.
> - ⚖️ **Fonti salariali verificate**: vietate stime arbitrarie, ogni range richiede la fonte originale (annuncio, recruiter, lettera).
> - 🚀 **Zero dipendenze runtime**: veloce, leggero, scritto in TypeScript per Node.js >= 22.18.
>
> Provalo subito:
> ```bash
> git clone https://github.com/MRJonam91/JobRadar.git
> cd JobRadar && npm install && npm run build
> node dist/cli/index.js init
> ```
> Feedback e contributi benvenuti! 🚀

### 🇬🇧 English Pitch (Show HN / Reddit r/node r/careerguidance)

> **Show HN: JobRadar – Local-first job application tracker with iCal reminders & zero dependencies**
>
> Job hunts usually turn into a mess of bookmarks, conflicting spreadsheets, and forgotten recruiter follow-ups.
>
> I built **JobRadar**, a deterministic command-line application tracker and interview lifecycle engine:
> 1. **Local-first & offline**: your application pipeline stays in a simple, auditable `jobradar.json` file.
> 2. **Proactive reminders**: alerts you about stale applications (>10 days without contact), approaching offer deadlines, and upcoming interview rounds.
> 3. **Export to iCal / Markdown / CSV**: export calendar events (.ics) directly to Apple Calendar, Google Calendar, or Outlook.
> 4. **Verifiable salary audit**: ensures every compensation figure has an explicit, verifiable source (no vague guesswork).
> 5. **Zero external runtime dependencies**: pure Node.js standard library.
>
> GitHub: https://github.com/MRJonam91/JobRadar

---

## 3. Checklist Pre-Launch

- [x] Test suite passing (`npm test`)
- [x] Typecheck passing (`npm run typecheck`)
- [x] Core size guard under 1500 lines (`npm run typecheck; npm run build`)
- [x] License and NOTICE files in place (Apache-2.0)
- [x] Funding and donation channels configured (`.github/FUNDING.yml`)
- [x] Issue templates and PR templates configured
- [x] Anti-plagiarism provenance markers recorded in `_provenance/`
