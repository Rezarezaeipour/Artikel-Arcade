# Contributing to Artikel Arcade

Contributions are welcome in gameplay, accessibility, vocabulary, translations, visual design, documentation, and bug fixes.

## Set up the project

Use Node.js 20 or later and npm. Clone the repository and install its locked dependencies.

```sh
git clone https://github.com/Rezarezaeipour/German-game.git
cd German-game
npm ci
npm run dev
```

Open http://localhost:3000. For a production build, stop the development server and run the checks sequentially.

```sh
npx tsc --noEmit
npm run build
```

The static site is generated in `out/`. To preview that output locally with Python 3 installed, run the following command.

```sh
python3 -m http.server 3000 --directory out
```

## Work with a coding agent

Give your agent the repository, your task, and the relevant source material. Ask it to read the repository guidance before making changes.

```text
Read AGENTS.md, README.md, and CONTRIBUTING.md.
Inspect the files relevant to my request.
Implement the requested change using the existing architecture and data model.
Verify the affected user flow and run the applicable checks.
Summarize the changes, verification results, and remaining uncertainties.

Task
Describe the change here, including the level and lesson for vocabulary work.

Source material
Attach the lesson vocabulary or provide the relevant reference.
```

These files give an agent project context and instructions for each contribution. The workflow works with coding agents that accept repository files as context.

## Find the relevant code

- `app/page.tsx` contains the game loop, article selection, speed controls, scoring, menus, and saved progress.
- `app/components/WordCollection.tsx` contains the vocabulary library and practice mode.
- `app/data/curriculum.ts` contains levels, lessons, vocabulary types, and `getArticleWords`.
- `app/data/a1-lesson-*.ts` contains the twelve A1 lesson lists.
- `app/data/vocabulary-builders.ts` contains helpers for entries and categories.
- `app/globals.css` contains styling, responsive layout, and motion rules.
- `app/layout.tsx` contains the root layout and page metadata.

## Add or correct vocabulary

### Identify the lesson and source

Specify the CEFR level and lesson number. Each level has 12 lesson slots. Include the book title, edition, page numbers, or supplied lesson reference when available. Current A1 entries were transcribed from supplied Starten Wir! vocabulary photos, with English meanings added for practice.

Record the source in the lesson's `sourceNote`. Describe a correction's original wording and proposed replacement in the pull request. Flag unclear text so reviewers can assess the transcription.

### Create the word list

Use a file such as `app/data/a2-lesson-2.ts`. Follow existing lesson files and vocabulary helpers. The following entries are illustrative examples.

```ts
import { noun, section, term } from './vocabulary-builders';

export const a2Lesson2Words = [
  ...section('Beispiel', [
    noun('der', 'Name', 'name', 'Namen'),
    noun('die', 'Sprache', 'language', 'Sprachen'),
    term('sprechen', 'to speak', 'verb', ['du sprichst', 'er spricht']),
    term('Guten Morgen.', 'Good morning.', 'greeting'),
  ]),
];
```

- `noun` accepts the article, word, English meaning, and an optional full plural form.
- `term` accepts the word or phrase, English meaning, an optional part of speech, and optional forms. It sets `article` to `null`.
- `section` assigns a category to a group of entries.
- Keep capitalization, umlauts, and ß accurate. Join words split across printed lines and retain separable verb forms in `forms`.
- Preserve explicitly plural nouns and record `partOfSpeech: 'plural noun'` where appropriate.
- Keep repeated words when the lesson source includes them. Distinct entries can share spelling and have different articles or meanings.
- Use `article: null` for vocabulary whose supplied form has no printed article. Browse words includes those entries. The game and article practice use entries returned by `getArticleWords`.

### Register the lesson

Import the word list in `app/data/curriculum.ts` and assign it to the intended level and zero-based lesson index. Lesson 2 occupies index `1`.

```ts
import { a2Lesson2Words } from './a2-lesson-2';

curriculum.A2[1] = {
  number: 2,
  title: 'Lesson 02 · Sample',
  source: 'sample',
  sourceNote: 'Illustrative vocabulary for testing.',
  words: a2Lesson2Words,
};
```

For a supplied textbook lesson, use `source: 'user'`, its lesson title, and the source details in `sourceNote`. Use `source: 'sample'` for illustrative content. Apply the assignment after the initial sample setup in `curriculum.ts`, following the existing registrations.

### Check the result

1. Select the intended level and lesson in Mission control and launch it.
2. Confirm the game uses that lesson's article entries and reveals the correct articles after evaluation.
3. Open Word collection, select the same level and lesson, and check Browse words and Practice articles.
4. Search for a word, meaning, and conjugated form from the new list.
5. Run the TypeScript check and production build. Include entry counts and verification results in the pull request.

## Change gameplay or styling

The shuttle stays centered above Der, Das, Die. Left/right changes the article, and up/down changes speed. A word's position triggers evaluation. Correct answers award 100 points and show green feedback. Incorrect answers show red feedback and the correct article.

Check pause/resume, menus, Main page navigation, completion, replay, keyboard controls, and touch controls when a change affects those flows. Keep the portrait playfield and word radar usable on desktop and mobile. Use the existing blue-and-yellow palette and account for reduced-motion preferences.

## Saved progress

The game uses the `artikel-progress` and `artikel-sector` localStorage keys. Completion IDs are calculated as `levelIndex * LESSONS_PER_LEVEL + lessonNumber`. Saved progress currently uses curriculum version 4, with older-data migration in `app/page.tsx`.

When changing stored data or lesson assignments, update the migration for affected existing records. Verify completed lessons, best score, and practiced-word counts after reloading.

## Submit a contribution

Fork the repository if needed and create a branch for the contribution. Keep the change focused and describe the user-visible result in the pull request. Include the affected level and lesson for vocabulary work, source details, checks performed, and screenshots for visual changes when available.

AI-assisted contributions are welcome. Review generated code and vocabulary, verify the result, and mention agent assistance when it helps reviewers understand the contribution.

Use GitHub issues for bug reports and feature discussions. A bug report should include reproduction steps, expected and actual behavior, browser or device details, and a screenshot when useful.

## Author and credits

The current author is Reza Rezaeipour. Contributor credit can be included in the contribution's pull request and the repository history.

## License status

License selection is pending. This checkout currently has no `LICENSE` file.
