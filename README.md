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
- Playable eight-word A1 demo: shuttle stays centered above Der | Das | Die; left/right select the article, up/down adjust speed (0.5×–3×), Esc pauses. Word planets automatically check the selected article as they pass. Planet and starfield movement follow the selected speed.
- Optional synthesized arcade effects and browser-local progress

This is the interface prototype. Additional episodes and level-specific vocabulary are placeholders. Full Leitner scheduling is not yet implemented. Progress stays in this browser's localStorage and can be reset in Settings.

## Lesson content

`app/data/curriculum.ts` defines 12 lessons for each CEFR level. Populate each lesson with the user-supplied Starten Wir! vocabulary; lesson word counts may vary. The eight sample words are a separate demo and do not count toward course completion. No book lesson word lists have been supplied yet. Lesson 1 of each level includes five explicitly labeled sample words for testing; these are illustrative, not verified textbook vocabulary or CEFR assignments. Sample lessons are playable and appear in Word collection.
