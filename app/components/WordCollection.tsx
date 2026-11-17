'use client';
import { useState } from 'react';
import { LEVELS, curriculum, demoWords, type VocabularyWord } from '../data/curriculum';

type Entry = VocabularyWord & { id: string; level: string; lesson: number; source: 'book' | 'demo' | 'sample' };
const bookEntries: Entry[] = LEVELS.flatMap(level => curriculum[level].flatMap(lesson => lesson.words.map((word, index) => ({
  ...word, id: `${level}-${lesson.number}-${index}`, level, lesson: lesson.number, source: lesson.source === 'sample' ? 'sample' as const : 'book' as const,
}))));
const demoEntries: Entry[] = demoWords.map((word, index) => ({ ...word, id: `demo-${index}`, level: 'A1', lesson: 0, source: 'demo' }));

export default function WordCollection() {
  const [level, setLevel] = useState('all');
  const [lesson, setLesson] = useState('all');
  const [query, setQuery] = useState('');
  const [practice, setPractice] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const entries = level === 'demo' ? demoEntries : bookEntries;
  const matches = entries.filter(word => (level === 'all' || level === 'demo' || word.level === level)
    && (lesson === 'all' || word.lesson === Number(lesson))
    && `${word.word} ${word.meaning} ${word.article??''} ${word.forms?.join(' ')??''} ${word.category??''}`.toLocaleLowerCase('de').includes(query.trim().toLocaleLowerCase('de')));
  const filtered=practice?matches.filter(word=>word.article!==null):matches;
  const attempted = filtered.filter(word => answers[word.id]);
  const correct = attempted.filter(word => answers[word.id] === word.article).length;
  function chooseLevel(value: string) { setLevel(value); setLesson('all'); }
  return <section className="collection" aria-label="Vocabulary practice library">
    <div className="collection-overview"><div><span>VOCABULARY LIBRARY</span><strong>{bookEntries.length} <small>words across all levels</small></strong></div><div className="collection-mode"><button className={!practice ? 'selected' : ''} aria-pressed={!practice} onClick={() => setPractice(false)}>Browse words</button><button className={practice ? 'selected' : ''} aria-pressed={practice} onClick={() => { setPractice(true); setAnswers({}); }}>Practice articles</button></div></div>
    <div className="collection-levels" aria-label="Filter vocabulary by level">{['all', ...LEVELS, 'demo'].map(value => <button key={value} aria-pressed={level === value} className={level === value ? 'selected' : ''} onClick={() => chooseLevel(value)}>{value === 'all' ? 'All levels' : value === 'demo' ? 'Demo' : value}<span>{value === 'demo' ? demoEntries.length : value === 'all' ? bookEntries.length : bookEntries.filter(word => word.level === value).length}</span></button>)}</div>
    <div className="collection-tools"><label><span>SEARCH WORDS</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a word or meaning…" /></label><label><span>LESSON</span><select value={lesson} onChange={event => setLesson(event.target.value)} disabled={level === 'demo'}><option value="all">All 12 lessons</option>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>Lesson {String(index + 1).padStart(2, '0')}</option>)}</select></label></div>
    <div className="collection-result-bar"><span>{filtered.length} WORDS {level === 'demo' && '· SAMPLE VOCABULARY'}</span>{practice ? <><span aria-live="polite">{correct} CORRECT / {attempted.length} ANSWERED</span><button onClick={() => setAnswers({})}>RESET PRACTICE ↺</button></> : <span>ALL VOCABULARY · NOUNS, VERBS, PHRASES & MORE</span>}</div>
    {(level === 'demo' || filtered.some(word => word.source === 'sample')) && <p className="collection-source-note">Sample words are for testing the interface. Their level placement is illustrative; they are not sourced from Starten Wir!.</p>}
    {practice && filtered.length > 0 && <p className="collection-source-note">Article practice shows only nouns with articles. Choose der, das, or die to reveal each answer. Switch to Browse words for the full lesson vocabulary.</p>}
    {filtered.length ? <div className="word-grid collection-grid">{filtered.map(word => {
      const answer = answers[word.id];
      const result = answer ? answer === word.article ? 'correct' : 'wrong' : '';
      return <article className={`word-card practice-word ${practice ? result : ''}`} key={word.id}>
        <div className="collection-word-meta"><span>{word.level} · {word.source === 'demo' ? 'DEMO' : `LESSON ${String(word.lesson).padStart(2, '0')}`}</span><span>{word.source === 'book' ? 'STARTEN WIR!' : 'SAMPLE'}</span></div>
        <h2>{word.article&&<span className={`article ${!practice || answer ? word.article : ''}`}>{!practice || answer ? word.article : '–'}</span>} {word.word}</h2><p>{word.meaning}</p>
        {word.partOfSpeech&&<span className="vocabulary-kind">{word.partOfSpeech}</span>}
        {word.forms&&<p className="vocabulary-details">{word.forms.join(' · ')}</p>}
        {word.plural&&<p className="vocabulary-details">Plural: {word.plural}</p>}
        {word.category&&<p className="vocabulary-category">{word.category}</p>}
        {practice && word.article && <><div className="practice-options" role="group" aria-label={`Choose the article for ${word.word}`}>{['der', 'das', 'die'].map(article => <button key={article} disabled={Boolean(answer)} className={answer === article ? 'chosen-answer' : ''} onClick={() => setAnswers(previous => ({ ...previous, [word.id]: article }))}>{article}</button>)}</div><p className="practice-result" aria-live="polite">{answer ? result === 'correct' ? `✓ Correct — ${word.article} ${word.word}` : `× You chose ${answer}. Correct: ${word.article} ${word.word}` : 'Choose an article to reveal the answer.'}</p></>}
      </article>;
    })}</div> : <div className="collection-empty"><BookSymbol/><h2>{entries.length ? 'No matching words.' : level === 'all' ? 'Your lesson library starts here.' : `${level} vocabulary is waiting for its word lists.`}</h2><p>{entries.length ? 'Try another search, level, or lesson, or switch to Browse words to see vocabulary without articles.' : 'The library includes A1–C2, with 12 lessons per level. Send the lesson vocabulary to add it here for browsing and practice.'}</p>{!entries.length && <button className="primary" onClick={() => { chooseLevel('demo'); setQuery(''); }}>TRY THE 8 DEMO WORDS →</button>}</div>}
  </section>;
}
function BookSymbol() { return <span className="collection-book" aria-hidden="true">▤</span>; }
