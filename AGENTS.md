# AGENTS.md

## Project purpose

This repository contains a reusable interactive marketing-research report. The application renders a standardized `report-data.json` produced by a marketing-analysis GPT.

## Core rules

1. Keep the report data-driven. Never hard-code a client research result in HTML, CSS, or JavaScript.
2. Preserve compatibility with `report-data.schema.json`.
3. If JSON fields change, update together:
   - `report-data.schema.json`;
   - `sample-report-data.json`;
   - `app.js`;
   - relevant documentation.
4. Use plain HTML, CSS, and JavaScript unless a migration is explicitly requested.
5. Do not add external dependencies without a clear need.
6. Keep local file loading through the “Загрузить JSON” control.
7. Preserve desktop, mobile, and print/PDF layouts.
8. Hide sections that have no meaningful data.
9. Keep sources, assumptions, limitations, and confidence visible.
10. Treat this as an analytical report, not a promotional landing page.

## Required visual structures

- Executive summary: KPI and finding cards.
- TAM / SAM / SOM: levels plus scenario table.
- Trends: cards with direction.
- Competitors: comparative table.
- Audiences: segment cards.
- CJM: horizontal stages.
- Value Proposition Canvas: two-column layout.
- SWOT: 2×2 matrix plus SO/WO/ST/WT strategies.
- Business Model Canvas: standard nine-block layout.
- Roadmap: 30/60/90-day columns.
- Sources: linked evidence table.

## Validation before completion

- Open `sample-report-data.json` in the UI.
- Check the browser console for JavaScript errors.
- Validate the sample against `report-data.schema.json`.
- Check responsive behavior.
- Check print preview.
- List modified files and any schema migration in the final response.
