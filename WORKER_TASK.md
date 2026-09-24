# Task: revive three browser games for portfolio screenshots

You are reviving old projects so they can be screenshotted for a software engineering
portfolio. Work only inside `/home/binyam/jobs/rescue/arcade`. Do the work yourself; do not
delegate to subagents.

## The three games

- `cutzrope/` — a Cut the Rope style physics game, Ethiopian coffee themed. Vite. Check
  `package.json` for the start script.
- `snake-xenzia/` — a Nokia Snake clone in one vanilla JS file. No build; it is an
  `index.html` you can serve statically.
- `tejie/` — a water/colour sort puzzle built on PixiJS 8 + Vite.

## What to do, in order

1. For each game: install dependencies if it has a `package.json` (`npm install`), start it
   (`npm run dev`, or `npx serve . -l <port>` for the plain HTML one), and confirm in a real
   browser that it actually renders and responds to input. Note the exact start command.
2. Play each one enough to reach a visually interesting state: pieces in motion, a level
   underway, a score on the board. An empty title screen is a weak screenshot.
3. Capture screenshots with Playwright:
   - `headless: false` and `DISPLAY=:0`. A real visible window. Never headless.
   - `viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2`, so each PNG is
     2880x1800. Verify the size after writing; a wrong size means it fell back to headless.
   - Per game: one striking shot of play in progress, plus one or two others that show
     something different (a menu, a later level, a win state).
   - Save to `.handoff/shots/NN-<game>-<what>.png`, numbered 01 upward across all games.
     Shot 01 becomes the cover, so make it the best one.
   - Avoid loading spinners, error overlays, dev tool overlays and near duplicates.
   - Keep your Playwright script at `.handoff/capture.mjs`.
   - Playwright is available at `/home/binyam/jobs/portfolio/node_modules/playwright`.
4. Write a short `README.md` in each game folder: what it is, how to run it, what is
   interesting about the implementation. Be accurate, do not inflate.
5. Add a `.gitignore` covering `node_modules`, `dist`, `.env*`.
6. `git init` in each game folder that has no `.git`, and make one commit with a single short
   line as the message. No body, no co-author or attribution trailers.

## Never

- Never touch `/home/binyam/jobs/portfolio` or anything outside your working directory.
- Never run `git push` or create a GitHub repo. Local commits only.
- Never commit `node_modules`, `dist`, `.env*` or any file over 5 MB.
- Never use a headless browser.
- Never describe a feature you did not see working on screen.

## Finish by writing `.handoff/report.json`

```json
{
  "slug": "arcade",
  "status": "ok | partial | blocked",
  "games": [
    {
      "name": "cutzrope",
      "start_command": "npm run dev",
      "url": "http://localhost:5188",
      "ran": true,
      "verified": ["what you actually saw working, one line each"],
      "not_working": ["anything broken, stubbed or unfinished"],
      "stack": ["the real libraries you found in package.json"]
    }
  ],
  "shots": [
    { "file": "01-cutzrope-play.png", "caption": "one plain sentence", "device": "desktop" }
  ],
  "commits": ["the one-line message you used"],
  "blockers": [],
  "time_minutes": 0
}
```

If you are stuck on one thing for more than 10 minutes, stop, write `report.json` with status
`blocked` and the blocker, and exit. An honest "blocked" is more useful than a guess.
Budget: 35 minutes total.
