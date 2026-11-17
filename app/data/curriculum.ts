import { a1Lesson1Words } from './a1-lesson-1';
import { a2Lesson2Words } from './a2-lesson-2';
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const LESSONS_PER_LEVEL = 12;
export type Level = typeof LEVELS[number];
export type Article = 'der' | 'das' | 'die';
export type VocabularyWord = {
  word: string;
  article: Article | null;
  meaning: string;
  category?: string;
  partOfSpeech?: string;
  forms?: string[];
  plural?: string;
};
export type Lesson = {
  number: number;
  title: string;
  source?: 'user' | 'sample';
  sourceNote?: string;
  // Populate from the user's supplied lesson lists, preserving their source.
  words: VocabularyWord[];
};
function emptyLessons(): Lesson[] {
  return Array.from({ length: LESSONS_PER_LEVEL }, (_, index) => ({
    number: index + 1,
    title: `Lesson ${String(index + 1).padStart(2, '0')}`,
    words: [],
  }));
}
export const curriculum: Record<Level, Lesson[]> = {
  A1: emptyLessons(), A2: emptyLessons(), B1: emptyLessons(),
  B2: emptyLessons(), C1: emptyLessons(), C2: emptyLessons(),
};

// Illustrative vocabulary for UI testing, not a verified CEFR or textbook list.
const sampleWords: Record<Level, VocabularyWord[]> = {
  A1: [
    {word:'Tisch',article:'der',meaning:'table'},
    {word:'Tür',article:'die',meaning:'door'},
    {word:'Fenster',article:'das',meaning:'window'},
    {word:'Schule',article:'die',meaning:'school'},
    {word:'Stuhl',article:'der',meaning:'chair'},
  ],
  A2: [
    {word:'Bahnhof',article:'der',meaning:'train station'},
    {word:'Reise',article:'die',meaning:'journey'},
    {word:'Gepäck',article:'das',meaning:'luggage'},
    {word:'Rechnung',article:'die',meaning:'bill'},
    {word:'Koffer',article:'der',meaning:'suitcase'},
  ],
  B1: [
    {word:'Erfahrung',article:'die',meaning:'experience'},
    {word:'Entscheidung',article:'die',meaning:'decision'},
    {word:'Ergebnis',article:'das',meaning:'result'},
    {word:'Beruf',article:'der',meaning:'profession'},
    {word:'Möglichkeit',article:'die',meaning:'possibility'},
  ],
  B2: [
    {word:'Voraussetzung',article:'die',meaning:'prerequisite'},
    {word:'Zusammenhang',article:'der',meaning:'connection'},
    {word:'Verhältnis',article:'das',meaning:'relationship'},
    {word:'Maßnahme',article:'die',meaning:'measure'},
    {word:'Einfluss',article:'der',meaning:'influence'},
  ],
  C1: [
    {word:'Widerspruch',article:'der',meaning:'contradiction'},
    {word:'Bewusstsein',article:'das',meaning:'awareness'},
    {word:'Auseinandersetzung',article:'die',meaning:'debate or confrontation'},
    {word:'Erkenntnis',article:'die',meaning:'insight'},
    {word:'Sachverhalt',article:'der',meaning:'state of affairs'},
  ],
  C2: [
    {word:'Unverhältnismäßigkeit',article:'die',meaning:'disproportionality'},
    {word:'Paradigmenwechsel',article:'der',meaning:'paradigm shift'},
    {word:'Spannungsverhältnis',article:'das',meaning:'tension between opposing forces'},
    {word:'Deutungshoheit',article:'die',meaning:'authority to define an interpretation'},
    {word:'Daseinsberechtigung',article:'die',meaning:'justification for existence'},
  ],
};
for (const level of LEVELS) {
  curriculum[level][0] = { number: 1, title: 'Lesson 01 · Sample', source: 'sample', words: sampleWords[level] };
}

curriculum.A1[0] = {
  number: 1,
  title: 'Lesson 01',
  source: 'user',
  sourceNote: 'Starten Wir! vocabulary transcribed from the two photos supplied for A1 Lesson 1. English meanings added for practice.',
  words: a1Lesson1Words,
};

curriculum.A2[1] = {
  number: 2,
  title: 'Lesson 02',
  source: 'user',
  sourceNote: 'Starten Wir! vocabulary transcribed from the two photos supplied for A2 Lesson 2. English meanings added for practice.',
  words: a2Lesson2Words,
};

export type ArticleWord = VocabularyWord & { article: Article };
export function getArticleWords(lesson: Lesson): ArticleWord[] {
  return lesson.words.filter((word): word is ArticleWord => word.article !== null);
}

// Interface demo only: these words have not been sourced from Starten Wir!.
export const demoWords: ArticleWord[] = [
  {word:'Sonne',article:'die',meaning:'sun'},
  {word:'Mond',article:'der',meaning:'moon'},
  {word:'Haus',article:'das',meaning:'house'},
  {word:'Stern',article:'der',meaning:'star'},
  {word:'Wasser',article:'das',meaning:'water'},
  {word:'Blume',article:'die',meaning:'flower'},
  {word:'Baum',article:'der',meaning:'tree'},
  {word:'Buch',article:'das',meaning:'book'},
];
