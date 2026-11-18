# Artikel Arcade

A frontend-only German article learning game, built with Next.js, React and TypeScript.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build` for a static export in `out/`.

## Included

- Responsive dark arcade cockpit, pixel shuttle and CSS planet artwork
- Mission control, six CEFR sectors, word collection and flight log
- 12 lesson-based episode slots per sector, episode preview, flight manual, settings, pause and completion dialogs
- Playable eight-word A1 demo: shuttle stays centered above Der | Das | Die; left/right select the article, up/down adjust speed (0.5×–3×), Esc opens the game menu and pauses the flight. Word planets automatically check the selected article as they pass. Planet and starfield movement follow the selected speed.
- Optional synthesized arcade effects and browser-local progress

All 12 A1 episodes are populated from supplied lesson photos. Vocabulary for the remaining levels is awaiting lesson lists, with sample Lesson 1 content available for testing. Full Leitner scheduling is not yet implemented. Progress stays in this browser's localStorage and can be reset in Settings.

## Lesson content

`app/data/curriculum.ts` defines 12 lessons per CEFR level. Lesson word counts may vary.

A1 Lesson 1 now uses the two user-supplied vocabulary photos, transcribed in `app/data/a1-lesson-1.ts`: 96 entries, including 25 nouns with printed articles. The game and article practice use those 25 nouns; Browse words includes all entries, verb forms, plural forms, phrases, countries, languages, and numbers. English meanings were added for practice. Unmarked titles such as Frau and Herr retain no article rather than adding one not printed in the source.

A1 Lesson 2 uses the next two user-supplied vocabulary photos, transcribed in `app/data/a1-lesson-2.ts`: 93 entries, including 38 nouns with printed articles and 22 number entries. Browse words includes every entry; the game and article practice use the 38 nouns. The explicitly plural nouns Eltern, Geschwister, and Großeltern retain `die` and are labeled as plural nouns. English meanings were added for practice. A2 Lesson 1 remains a separate sample lesson.

Lesson 1 in A2–C2 still contains five labeled sample words per level; these are illustrative, not verified textbook vocabulary or CEFR assignments. The separate eight-word demo remains available. Prior completion of the A1 sample does not mark the replacement book lesson complete.

A1 Lessons 3–12 are transcribed in their corresponding `app/data/a1-lesson-*.ts` files. Across all 12 A1 lessons, the library contains 1,076 vocabulary entries, including 534 entries with printed articles for the game and article practice. Printed verb forms and plural forms are retained, line-break hyphens are normalized, and English meanings are added for practice.
