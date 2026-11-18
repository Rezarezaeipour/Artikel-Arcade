import type { Article, VocabularyWord } from './curriculum';

export function noun(
  article: Article,
  word: string,
  meaning: string,
  plural?: string,
): VocabularyWord {
  return { word, article, meaning, plural };
}

export function term(
  word: string,
  meaning: string,
  partOfSpeech = 'phrase',
  forms?: string[],
): VocabularyWord {
  return { word, article: null, meaning, partOfSpeech, forms };
}

export function section(category: string, words: VocabularyWord[]): VocabularyWord[] {
  return words.map(word => ({ ...word, category }));
}
