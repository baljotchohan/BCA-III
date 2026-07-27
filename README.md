# BCA 3 Hub

A Notion-style study dashboard for **BCA 3rd Semester** students (Panjab University, 2026-27 batch). Built so nobody has to dig through WhatsApp for "what did we do in class today" — one place for the syllabus, a day-by-day lecture log, and basic study tools.

Static site, no backend — plain HTML/CSS/JS, so it runs anywhere and costs nothing to host.

## What's in it

- **Dashboard** — greeting, search (⌘K), a calendar (month/week view), a to-do list, and Today's Agenda pulled from whatever lectures are logged for the current date.
- **7 subjects**, matching the official PU 3rd-sem syllabus exactly: Computer Architecture, Data Structures, Computer Oriented Numerical Methods, Introduction to Machine Learning, English-3, Web Development/Designing, Backend Web Development.
- **Per-subject folder**, each with three tabs:
  - **Lecture Log** — day-by-day record of what was actually covered in class (date, time, topic, notes/PDF link). Empty by default; filled in as classes happen.
  - **Syllabus Units** — the official Unit I–IV topic breakdown, taken directly from the PU syllabus PDF (only shown where the PDF actually publishes it — English-3, Web Dev, and Backend Dev only appear in the credit table, so those show an honest "not published" note instead of invented content).
  - **Official PU Syllabus PDF** — direct link to the source document.
- Light/dark theme (auto-detects system preference on first visit), fully responsive down to phone width, and a Print/Export view for any subject.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure/layout |
| `styles.css` | All styling (Notion-inspired, light + dark themes, responsive breakpoints) |
| `app.js` | All behavior — rendering, search, calendar, to-do list, theming |
| `syllabus-data.js` | The actual data: subjects, syllabus units, lectures, to-dos. This is what gets edited to add new content. |
| `Syllabus.pdf` | Official Panjab University syllabus document (source of truth for units/credits) |

## Running it locally

No build step, no dependencies. Just serve the folder:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Updating content

The Lecture Log is meant to be filled in as the semester goes — after each class, add an entry to that subject's `lectures` array in `syllabus-data.js`:

```js
{ date: "2026-07-28", time: "10:00 AM", topic: "Number Systems", description: "optional notes", fileUrl: "optional link to a PDF/photo" }
```

Everything else (Today's Agenda, progress bars, search) picks it up automatically.

## Deployment

It's a static site — any static host works (GitHub Pages, Vercel, Netlify, Cloudflare Pages). No environment variables, no server, no database.
