# Guidance for coding agents

This file applies throughout the repository. Follow the contributor's current request and read [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## Project context

- Artikel Arcade is an open-source, AI-native German learning game inspired by 1980s arcades.
- The application uses Next.js App Router, React, TypeScript, plain CSS, and Lucide icons.
- The application runs in the browser and exports a static site through `next.config.ts`.
- Progress lives in localStorage. Preserve existing saved data when changing its structure.
- A1 has 12 populated lessons. A2–C2 have 12 lesson slots each, with sample vocabulary in Lesson 1.

## Read the relevant files

- `app/page.tsx` owns game state, navigation, menus, scoring, and persistence.
- `app/components/WordCollection.tsx` owns vocabulary search, filters, and article practice.
- `app/data/curriculum.ts` defines vocabulary types, lesson registration, and article filtering.
- `app/data/a1-lesson-*.ts` contains the supplied A1 vocabulary.
- `app/data/vocabulary-builders.ts` provides `noun`, `term`, and `section` helpers.
- `app/globals.css` owns the responsive blue-and-yellow pixel arcade design.
- `app/layout.tsx` owns the root layout and metadata.

## Preserve the game contract

- Keep the shuttle centered, with the selector ordered Der, Das, Die underneath it.
- Left/right changes the article. Up/down changes speed between 0.5× and 3× in 0.25× steps.
- Evaluate the article when the word planet reaches the shuttle. Award 100 points for a correct answer.
- Show translucent green/red result feedback and preserve the scrollable word radar.
- Keep Menu and Main page controls accessible on desktop and mobile. Opening the menu pauses flight.
- Keep all vocabulary available in Browse words. Use `getArticleWords` for gameplay and article practice.

## Change practices

- Keep changes scoped to the request and preserve unrelated contributor work.
- Write readable TypeScript and React code. Reuse the existing data model and helpers.
- Treat lesson numbers as one-based labels and curriculum array indexes as zero-based positions.
- Preserve supplied spelling, capitalization, articles, plurals, and conjugations. Record source details and flag uncertain readings.
- Use `article: null` for entries whose supplied form has no article. Label illustrative content with `source: 'sample'`.
- Derive counts from lesson data. Preserve distinct entries sharing spelling with different articles or meanings.
- Access browser APIs through client-side handlers and effects. Preserve keyboard access and reduced-motion behavior.
- Use the static export architecture for normal contributions. Introduce services or dependencies when the requested change needs them.

## Verification and handoff

- Install locked dependencies with `npm ci` when needed.
- For code or vocabulary changes, run `npx tsc --noEmit` and `npm run build` sequentially. Stop the development server before building because both use `.next/`.
- Check the affected feature through its normal entry point. For vocabulary work, check the intended level and lesson in both the game and Word collection.
- Use targeted regression tests when a behavior change needs them. The repository currently has no test-runner or lint script.
- For documentation changes, verify relative links, commands, and project facts.
- Summarize changes, verification, and remaining uncertainty in the handoff or pull request.
