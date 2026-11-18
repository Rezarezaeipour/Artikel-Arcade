'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, House, Smartphone, X, Pause, Play, Trophy, Orbit, LockKeyhole, RotateCcw } from 'lucide-react';
import PhonePairing from './components/PhonePairing';
import JoystickPrompt from './components/JoystickPrompt';
import { usePhoneController } from './hooks/usePhoneController';
import WordCollection from './components/WordCollection';
const repositoryUrl='https://github.com/Rezarezaeipour/German-game';
const authors=['Reza Rezaeipour'];
const articles = ['der', 'das', 'die'];
import { LEVELS as levels, LESSONS_PER_LEVEL, curriculum, demoWords, getArticleWords } from './data/curriculum';
const lessonGameVocabulary=levels.map(level=>curriculum[level].map(getArticleWords));
type Progress = {curriculumVersion: 4; completed: number[]; best: number; reviewed: number};
const initial: Progress = {curriculumVersion:4,completed:[],best:0,reviewed:0};
const digitPixels = [
 ['01110','11011','11011','11011','11011','11011','01110'],
 ['00110','01110','00110','00110','00110','00110','11111'],
 ['11110','00011','00011','01110','11000','11000','11111'],
 ['11110','00011','00011','01110','00011','00011','11110'],
 ['11011','11011','11011','11111','00011','00011','00011'],
 ['11111','11000','11000','11110','00011','00011','11110'],
 ['01110','11000','11000','11110','11011','11011','01110'],
 ['11111','00011','00110','00110','01100','01100','01100'],
 ['01110','11011','11011','01110','11011','11011','01110'],
 ['01110','11011','11011','01111','00011','00011','01110'],
];
function ArcadeScore({value, className=''}:{value:number;className?:string}){
 const digits=String(value).padStart(4,'0');
 return <svg className={`arcade-digits ${className}`} viewBox={`0 0 ${digits.length*6-1} 7`} preserveAspectRatio="none" role="img" aria-label={`${value} points`} shapeRendering="crispEdges">{digits.split('').flatMap((digit,index)=>digitPixels[Number(digit)].flatMap((row,y)=>row.split('').map((pixel,x)=>pixel==='1'?<rect key={`${index}-${x}-${y}`} x={index*6+x} y={y} width="1" height="1"/>:null)))}</svg>;
}
function Ship({small=false}:{small?:boolean}) {return <svg className={small?'ship small':'ship'} viewBox="0 0 80 100" aria-label="Pixel space shuttle"><path fill="#6aaeff" d="M35 3h10v10h8v20h8v18h10v25H54V64h-7v20H33V64h-7v12H9V51h10V33h8V13h8z"/><path fill="#e1eeff" d="M35 13h10v12h8v27H27V25h8z"/><path fill="#112448" d="M34 29h13v17H34z"/><path fill="#365fa2" d="M27 52h26v12H27zM13 57h10v14H13zM57 57h10v14H57z"/><path className="flame" fill="#ffda57" d="M33 84h14v9h-4v7h-6v-7h-4z"/></svg>}
export default function Home(){
 const [page,setPage]=useState('mission'); const [level,setLevel]=useState(0); const [modal,setModal]=useState<string|null>(null); const [progress,setProgress]=useState<Progress>(initial); const [ready,setReady]=useState(false); const [sound,setSound]=useState(false); const [episode,setEpisode]=useState(1); const [playing,setPlaying]=useState(false); const [paused,setPaused]=useState(false); const [lane,setLane]=useState(1); const [round,setRound]=useState(0); const [score,setScore]=useState(0); const [feedback,setFeedback]=useState(''); const [finished,setFinished]=useState(false);
 const [pairingOpen, setPairingOpen] = useState(false);
 const [menuIndex,setMenuIndex]=useState(0);
 const menuWasPaused=useRef(false); const menuButtons=useRef<Array<HTMLButtonElement|HTMLAnchorElement|null>>([]);
 function returnToMain(){setPairingOpen(false);setPlaying(false);setPaused(false);setModal(null);setPage('mission');}
 function openMenu(){menuWasPaused.current=paused;if(playing)setPaused(true);setMenuIndex(0);setModal('menu');}
 function closeMenu(){setModal(null);if(playing)setPaused(menuWasPaused.current);}
 const menuItems:Array<{label:string;action:()=>void;href?:string}>=[...(playing?[{label:'Resume flight',action:()=>{setModal(null);setPaused(false);}}]:[]),...([{id:'mission',label:'Mission control'},{id:'review',label:'Word collection'},{id:'stats',label:'Flight log'}].map(item=>({label:item.label,action:()=>{setPlaying(false);setPage(item.id);setModal(null);}}))),{label:'Settings',action:()=>setModal('settings')},{label:'GitHub repository',href:repositoryUrl,action:()=>menuButtons.current[menuIndex]?.click()}];
 useEffect(()=>{if(modal==='menu')menuButtons.current[menuIndex]?.focus();},[modal,menuIndex]);
 const [activeLesson,setActiveLesson]=useState<{level:number;episode:number}|null>(null);
 const words=activeLesson?lessonGameVocabulary[activeLesson.level][activeLesson.episode-1]:demoWords;
 const activeSource=activeLesson?curriculum[levels[activeLesson.level]][activeLesson.episode-1].source:null;
 const [answerResult,setAnswerResult]=useState<'correct'|'wrong'|null>(null);
 const [wordResults,setWordResults]=useState<Array<'correct'|'wrong'|null>>(()=>words.map(()=>null));
 const [speed,setSpeed]=useState(1); const [flightPosition,setFlightPosition]=useState(0);
 const travel=useRef(0); const starDistance=useRef(0); const checked=useRef(false);
 const flightStage=useRef<HTMLDivElement|null>(null); const shuttleElement=useRef<HTMLDivElement|null>(null);
 const encounterPosition=useRef((74-10)/86);
 const wordList=useRef<HTMLOListElement|null>(null); const wordRows=useRef<Array<HTMLLIElement|null>>([]);
 useEffect(()=>{
  if(!playing)return;
  const stage=flightStage.current;const shuttle=shuttleElement.current;
  if(!stage||!shuttle)return;
  const updateEncounter=()=>{if(stage.clientHeight)encounterPosition.current=(shuttle.offsetTop/stage.clientHeight*100-10)/86;};
  updateEncounter();
  const observer=new ResizeObserver(updateEncounter);observer.observe(stage);
  return()=>observer.disconnect();
 },[playing]);
 useEffect(()=>{
  if(!playing)return;
  const list=wordList.current;const row=wordRows.current[round];
  if(!list||!row)return;
  if(round===0){list.scrollTop=0;return;}
  const top=row.offsetTop;const bottom=top+row.offsetHeight;
  if(top<list.scrollTop+12||bottom>list.scrollTop+list.clientHeight-12){
   list.scrollTo({top:Math.max(0,top-(list.clientHeight-row.offsetHeight)/2),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
 },[round,playing,activeLesson]);
 function changeArticle(direction:number){if(!playing||paused||finished)return;setLane(l=>Math.max(0,Math.min(2,l+direction)));}
 function changeSpeed(direction:number){if(!playing||paused||finished)return;setSpeed(s=>Math.max(.5,Math.min(3,s+direction*.25)));}
 const phone = usePhoneController({
  enabled: playing,
  selectedArticle: articles[lane] as 'der' | 'das' | 'die',
  ready: playing && !paused && !finished && !modal && !pairingOpen,
  onCommand(direction) {
   if (['der', 'das', 'die'].includes(direction)) setLane(['der', 'das', 'die'].indexOf(direction));
   if (direction === 'left') changeArticle(-1);
   if (direction === 'right') changeArticle(1);
   if (direction === 'up') changeSpeed(1);
   if (direction === 'down') changeSpeed(-1);
  },
  onPaired() {
   setPairingOpen(false);
   setPaused(false);
  },
  onDisconnect() {
   setPaused(true);
  },
 });
 function openPhonePairing() {
  setPaused(true);
  setModal(null);
  setPairingOpen(true);
  if (phone.status !== 'connecting' && phone.status !== 'waiting') void phone.connect();
 }
 function disconnectPhone() {
  phone.disconnect();
  setPairingOpen(false);
  setPaused(true);
 }
 useEffect(()=>{try {const p=JSON.parse(localStorage.getItem('artikel-progress')||'null');if(p&&Array.isArray(p.completed))setProgress({...initial,...p,curriculumVersion:4,completed:p.curriculumVersion===4?p.completed:[2,3].includes(p.curriculumVersion)?Array.from(new Set(p.completed.filter((id:number)=>p.curriculumVersion!==2||id!==1).map((id:number)=>id===14?2:id))):[]});const saved=Number(localStorage.getItem('artikel-sector')||0);if(saved>=0&&saved<6)setLevel(saved);}catch{} setReady(true);},[]);
 useEffect(()=>{if(ready){try{localStorage.setItem('artikel-progress',JSON.stringify(progress));localStorage.setItem('artikel-sector',String(level));}catch{}}},[progress,level,ready]);
 function start(ep:number,demo=true,askJoystick=true){const showJoystickPrompt=askJoystick&&!window.matchMedia('(max-width: 767px), (max-height: 500px) and (pointer: coarse)').matches;const nextWords=demo?demoWords:lessonGameVocabulary[level][ep-1];if(!nextWords.length)return;setActiveLesson(demo?null:{level,episode:ep});setWordResults(nextWords.map(()=>null));if(demo)setLevel(0);setEpisode(demo?1:ep);setRound(0);setScore(0);setLane(0);setSpeed(1);travel.current=0;starDistance.current=0;checked.current=false;setFlightPosition(0);setFeedback('');setAnswerResult(null);setFinished(false);setPaused(showJoystickPrompt);setPlaying(true);setModal(showJoystickPrompt?'joystick':null);}
 function resetFlight() {
  start(episode, activeLesson === null, false);
  if (wordList.current) {
   wordList.current.scrollTop = 0;
  }
 }

 function answer(){if(feedback||paused||finished)return;const correct=articles[lane]===words[round%words.length].article; setAnswerResult(correct?'correct':'wrong');setWordResults(results=>results.map((result,index)=>index===round?(correct?'correct':'wrong'):result)); const next=score+(correct?100:0);setScore(next);setFeedback(correct?'PERFECT ORBIT! +100':`It's ${words[round%words.length].article} ${words[round%words.length].word}`);if(sound){try{const ctx=new AudioContext();const o=ctx.createOscillator();const g=ctx.createGain();o.type='square';o.frequency.value=correct?660:160;g.gain.value=.035;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.12);}catch{}}}
 // Distance, rather than a submit key, determines when a planet is checked.
 useEffect(()=>{
  if(!playing||paused||finished)return;
  let frame:number; let previous:number|null=null;
  function tick(now:number){
   const delta=previous===null?0:Math.min(now-previous,80); previous=now;
   travel.current+=delta*speed/9000;
   starDistance.current+=delta*speed*.07;
   if(travel.current>=encounterPosition.current&&!checked.current){checked.current=true;answer();}
   if(travel.current>=1){
    travel.current=0;checked.current=false;setFeedback('');setAnswerResult(null);
    if(round===words.length-1){
     setFinished(true);
     setProgress(p=>({...p,completed:activeLesson?Array.from(new Set([...p.completed,activeLesson.level*LESSONS_PER_LEVEL+activeLesson.episode])):p.completed,best:Math.max(p.best,score),reviewed:p.reviewed+words.length}));
     setFlightPosition(0);return;
    }
    setRound(r=>r+1);setFlightPosition(0);return;
   }
   setFlightPosition(travel.current);
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[playing,paused,finished,speed,lane,round,score,sound,activeLesson,words]);
 useEffect(()=>{function key(e:KeyboardEvent){
  if(modal==='joystick'){if(e.key==='Escape'){e.preventDefault();setModal(null);setPaused(false);}return;}
  if(pairingOpen){if(e.key==='Escape')setPairingOpen(false);return;}
  if(modal==='menu'){
   if(e.key==='Tab'){e.preventDefault();setMenuIndex(index=>(index+(e.shiftKey?-1:1)+menuItems.length)%menuItems.length);return;}
   if(['ArrowDown','ArrowUp','Enter','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape')closeMenu();else if(e.key==='Enter')menuItems[menuIndex].action();else setMenuIndex(index=>(index+(e.key==='ArrowDown'?1:-1)+menuItems.length)%menuItems.length);}return;
  }
  if(e.key==='Escape'){if(modal)setModal(null);else openMenu();return;}
  if(!playing||modal)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();if(paused||finished)return;
   if(e.key==='ArrowLeft')changeArticle(-1);
   if(e.key==='ArrowRight')changeArticle(1);
   if(e.key==='ArrowUp')changeSpeed(1);
   if(e.key==='ArrowDown')changeSpeed(-1);
  }
 }window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const selectedLesson=curriculum[levels[level]][episode-1];
 const selectedNouns=getArticleWords(selectedLesson);
 const completed=progress.completed.filter(n=>n>level*LESSONS_PER_LEVEL&&n<=level*LESSONS_PER_LEVEL+LESSONS_PER_LEVEL).length;
 return <div className="app-shell">
  <main>
  {!playing&&<button className="arcade-menu-trigger" onClick={openMenu} aria-haspopup="dialog">☰ <span>MENU</span></button>}
  {playing?<div className="game-content"><div className="flight-layout">
   <aside className="flight-telemetry" aria-label="Flight statistics">
    <div className="telemetry-title">
     <span className="eyebrow">
      {activeLesson ? `${levels[activeLesson.level]} · LESSON ${activeLesson.episode}` : 'A1 · FLIGHT DEMO'}
     </span>
     <h1>Find your article.</h1>
     <span className="telemetry-status">
      <i/>{finished ? 'MISSION COMPLETE' : paused ? 'HOLDING ORBIT' : 'IN FLIGHT'}
     </span>
     <div className="cockpit-actions">
      <button className="secondary cockpit-pause" disabled={finished} onClick={()=>setPaused(p=>!p)}>
       {paused ? <Play size={14}/> : <Pause size={14}/>} {paused ? 'RESUME' : 'PAUSE'}
      </button>
      <button className="secondary cockpit-menu" onClick={openMenu} aria-haspopup="dialog">☰ MENU</button>
      <button className="secondary cockpit-reset" onClick={resetFlight}>
       <RotateCcw size={14}/> RESET FLIGHT
      </button>
     </div>
    </div>
    <div className="controller-link-panel">
     <button className="secondary connect-phone" onClick={openPhonePairing}>
      <Smartphone size={16}/> {phone.status === 'connected' ? 'PAIR NEW PHONE' : 'CONNECT PHONE'}
     </button>
     {phone.status !== 'idle' && <p className={`phone-link-status ${phone.status}`} role="status">
      {phone.status === 'connected' ? 'Phone connected' : phone.status === 'disconnected' ? 'Phone disconnected · flight paused' : phone.status === 'error' ? 'Phone connection needs attention' : 'Waiting for phone'}
     </p>}
     {phone.pairUrl && <button className="phone-disconnect" onClick={disconnectPhone}>Disconnect controller</button>}
    </div>
    <div className="telemetry-score"><span>1P SCORE</span><div key={score} className={`score-display ${score>0?'score-updated':''}`} aria-live="polite"><ArcadeScore value={score}/></div><div className="high-score"><span>HI-SCORE</span><ArcadeScore value={Math.max(progress.best,score)}/></div></div>
    <div className="telemetry-stats"><div><span>FLIGHT SPEED</span><strong className="speed-readout">{speed.toFixed(2)}×</strong></div><div><span>CORRECT</span><strong>{score/100} <small>/ {finished?words.length:round+(answerResult?1:0)}</small></strong></div></div>
    <div className="telemetry-progress"><div><span>FLIGHT PROGRESS</span><strong>{finished?words.length:round} / {words.length}</strong></div><div className="telemetry-track"><i style={{width:`${(finished?words.length:round)/words.length*100}%`}}/></div><small>{activeLesson?`${levels[activeLesson.level]} · ${activeSource==='sample'?'SAMPLE':'LESSON'} VOCABULARY`:'A1 · DEMO VOCABULARY'}</small></div>
    <div className="telemetry-controls"><h3>FLIGHT CONTROLS</h3><div><span><kbd>←</kbd> <kbd>→</kbd></span><span>Select article</span></div><div><span><kbd>↑</kbd> <kbd>↓</kbd></span><span>Adjust speed</span></div><div><kbd>Esc</kbd><span>Game menu</span></div></div>
    <div className="telemetry-legend"><span><i className="correct-dot"/> CORRECT ANSWER</span><span><i className="wrong-dot"/> WRONG ANSWER</span></div>
   </aside>
   <div className="flight-screen"><div ref={flightStage} className={`flight-stage starfield ${paused||finished?'motion-paused':''}`} data-result={answerResult??undefined} style={{backgroundPosition:[1, .45, 1.6, .7, 2, 1.2].map(rate=>`0 ${starDistance.current*rate}px`).join(',')}}>
   <div className="game-hud"><button className="flight-phone" onClick={openPhonePairing} aria-label="Connect phone controller" title="Connect phone controller"><Smartphone size={16}/></button><button className="flight-home" onClick={returnToMain} aria-label="Return to main page"><House size={14}/><span>MAIN PAGE</span></button><button className="flight-hud-menu" onClick={openMenu} aria-haspopup="dialog">☰ MENU</button><span>WORD {round+1} / {words.length}</span><span className="hud-sector">{activeLesson?`${levels[activeLesson.level]} · ${activeSource==='sample'?'SAMPLE':`LESSON ${activeLesson.episode}`}`:'A1 · DEMO'}</span><button className="flight-reset" aria-label="Reset current flight" title="Reset current flight" onClick={resetFlight}><RotateCcw size={15}/></button></div>
   <div className={`word-planet traveling-planet ${feedback?'planet-checked':''}`} style={{top:`${10+flightPosition*86}%`,opacity:flightPosition>.86?(1-flightPosition)/.14:1}}><span style={{fontSize:words[round%words.length].word.length>18?9:words[round%words.length].word.length>12?12:undefined}}>{words[round%words.length].word}</span><small>{words[round%words.length].meaning}</small></div>
   <div ref={shuttleElement} className="centered-shuttle"><Ship/></div>
   <div className="article-selector" role="group" aria-label="Selected article — use left and right arrows">{articles.map((article,i)=><span key={article} className={i===lane?'selected':''} aria-current={i===lane?'true':undefined}>{article[0].toUpperCase()+article.slice(1)}</span>)}</div>
   <div className="feedback" aria-live="polite">{feedback||'← → SELECT ARTICLE · ↑ FASTER · ↓ SLOWER'}</div>{paused&&!finished&&<div className="game-overlay"><div className="eyebrow">HOLDING ORBIT</div><h2>Take a breath, pilot.</h2><button className="primary" onClick={()=>setPaused(false)}>RESUME FLIGHT <Play size={15}/></button><button className="text-btn" onClick={returnToMain}>Return to main page</button></div>}{finished&&<div className="game-overlay"><Trophy size={36}/><div className="eyebrow">MISSION COMPLETE</div><h2>A stellar start.</h2><ArcadeScore value={score} className="completion-score"/><p>{words.length} words explored</p><button className="primary" onClick={()=>start(episode,!activeLesson)}>PLAY AGAIN <RotateCcw size={16}/></button><button className="text-btn" onClick={returnToMain}>Return to main page</button></div>}</div><div className="touch-controls"><button aria-label="Previous article" disabled={paused||finished} onClick={()=>changeArticle(-1)}>←</button><button aria-label="Speed up" disabled={paused||finished||speed>=3} onClick={()=>changeSpeed(1)}>↑</button><button aria-label="Slow down" disabled={paused||finished||speed<=.5} onClick={()=>changeSpeed(-1)}>↓</button><button aria-label="Next article" disabled={paused||finished} onClick={()=>changeArticle(1)}>→</button></div></div>
   <aside className="flight-word-list" aria-label="Episode word results">
    <div className="word-list-heading"><span className="eyebrow">{activeLesson?(activeSource==='sample'?'SAMPLE VOCABULARY':'LESSON VOCABULARY'):'DEMO VOCABULARY'}</span><h2>Word radar <span>{wordResults.filter(Boolean).length} / {words.length}</span></h2><p>Articles appear as words pass.</p></div>
    <ol ref={wordList} tabIndex={0} aria-label="Lesson words — scroll to review">{words.map((word,index)=>{
     const result=wordResults[index];
     return <li key={`${word.article}-${word.word}-${index}`} ref={element=>{wordRows.current[index]=element;}} className={`radar-word ${result??'pending'} ${index===round&&!finished?'current-word':''}`} aria-current={index===round&&!finished?'step':undefined}>
      <span className="radar-number">{String(index+1).padStart(2,'0')}</span>
      <div><div className="radar-noun"><span className="radar-article">{result?word.article:'–'}</span> {word.word}</div><small>{word.meaning}</small></div>
      <span className="radar-result" aria-label={result==='correct'?'Correct answer':result==='wrong'?'Wrong answer':'Not answered'}>{result==='correct'?'✓':result==='wrong'?'×':'·'}</span>
     </li>;
    })}</ol>
    <p className="word-list-note">{finished?'All words explored. Ready for another flight?':'Choose an article before the planet reaches your shuttle.'}</p>
   </aside>
   </div></div>:<div className="content">
   <div className="section-heading"><div><div className="eyebrow">A LITTLE PRACTICE. A WHOLE NEW UNIVERSE.</div><h1>{page==='review'?'Your word collection.':page==='stats'?'Your flight log.':'Ready for liftoff, cadet?'}</h1><p>{page==='review'?'Browse and practice vocabulary from every level and lesson.':page==='stats'?'Small flights. Real progress. All stored on this device.':'Master der, die, and das. One small space adventure at a time.'}</p></div><button className="how-button" onClick={()=>setModal('how')}><span>?</span> How to play <ArrowUpRight size={15}/></button></div>
   {page==='review'?<WordCollection/>:page==='stats'?<><div className="stat-grid">{[['EPISODES COMPLETE',progress.completed.length],['WORDS PRACTICED',progress.reviewed],['PERSONAL BEST',progress.best]].map(([l,v])=><div className="stat-card" key={l}><span>{l}</span><strong>{v}</strong><small>YOUR EXPLORATION, SO FAR</small></div>)}</div><div className="empty-log"><Orbit size={40}/><h2>Every orbit counts.</h2><p>Your next adventure is one arrow away.</p><button className="primary" onClick={()=>start(1)}>START A FLIGHT <ArrowRight size={16}/></button></div></>:<>
   {page==='mission'&&<section className="hero starfield"><div className="hero-copy"><div className="mission-tag"><i/> {levels[level]} · LESSON 01</div><h2>Small words.<br/>Big <span>universe.</span></h2><p>Three articles. Countless worlds to discover.<br/>Get in your shuttle. Let your instincts take flight.</p><button className="primary" onClick={()=>start(1,false)}>{completed?'PRACTICE LESSON 01':'START LESSON 01'} <ArrowRight size={17}/></button><div className="hero-meta"><span>{levels[level]} · {lessonGameVocabulary[level][0].length} ARTICLE WORDS</span><b>·</b><span>ARROW CONTROLS</span></div></div><div className="space-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="pixel-planet"><div className="planet-shade"/></div><span className="planet-label label-der">DER</span><span className="planet-label label-die">DIE</span><span className="planet-label label-das">DAS</span><div className="hero-ship"><Ship/><div className="exhaust"/></div><span className="space-cross cross-one">✦</span><span className="space-cross cross-two">+</span><span className="coordinate">SECTOR 01 — THE BEGINNING<br/>52° 31′ N / 13° 24′ E</span></div><div className="hero-bottom"><span><i/> SYSTEMS READY</span><span>THE GALAXY SPEAKS GERMAN. SO WILL YOU.</span><span>01 / 06</span></div></section>}
   <section className="sector-section"><div className="sub-heading"><h2>Select your sector <span>06 LEVELS</span></h2><span>FROM FIRST WORDS TO FARAWAY WORLDS</span></div><div className="level-grid">{levels.map((l,i)=><button key={l} onClick={()=>setLevel(i)} className={`level-card ${level===i?'chosen':''}`}><div className="level-top"><span>SECTOR 0{i+1}</span>{level===i?<span className="selected-dot"/>:<Orbit size={13}/>}</div><div className={`mini-planet planet-${i}`}/><strong>{l}</strong><span className="level-name">{['The beginning','New horizons','Into orbit','Deep space','The unknown','Infinity'][i]}</span><div className="level-footer"><span>{progress.completed.filter(n=>n>i*LESSONS_PER_LEVEL&&n<=i*LESSONS_PER_LEVEL+LESSONS_PER_LEVEL).length} / 12</span><span>{level===i?'SELECTED':'EXPLORE'} {level===i?'':'↗'}</span></div></button>)}</div></section>
   <section className="episodes"><div className="sub-heading"><h2><span className="sector-badge">{levels[level]}</span> Starten Wir! <span>12 LESSONS · 12 EPISODES</span></h2><span>{completed} OF 12 COMPLETE</span></div><p className="curriculum-note">One lesson, one episode. Each episode uses its own lesson word list.</p><div className="episode-row">{curriculum[levels[level]].map(lesson=><button key={lesson.number} className="episode" onClick={()=>{setEpisode(lesson.number);setModal('episode')}}><span className="episode-number">{String(lesson.number).padStart(2,'0')}</span><div><strong>{lesson.title}</strong><span>{lesson.words.length?`${lesson.words.length} WORDS · ${getArticleWords(lesson).length} NOUNS${lesson.source==='sample'?' · SAMPLE':''}`:'AWAITING WORD LIST'}</span></div>{getArticleWords(lesson).length?<Play size={13}/>:<LockKeyhole size={13}/>}</button>)}</div><button className="all-episodes" onClick={()=>setModal('all')}>VIEW ALL 12 EPISODES <ArrowRight size={14}/></button></section>

   </>}
   <footer className="project-footer"><div><span className="footer-label">ARTIKEL ARCADE</span><p>An open-source project for learning German through arcade games.</p></div><div><span className="footer-label">AUTHORS</span><ul aria-label="Project authors">{authors.map(author=><li key={author}>{author}</li>)}</ul></div><div><span className="footer-label">CREATOR WEBSITE</span><a href="https://rezarezaeipour.com" target="_blank" rel="noopener noreferrer">rezarezaeipour.com <ArrowUpRight size={14}/></a></div></footer>
  </div>}
  </main>
  {playing && pairingOpen && <PhonePairing
    status={phone.status}
    error={phone.error}
    pairUrl={phone.pairUrl}
    onRetry={() => { void phone.connect(); }}
    onClose={() => setPairingOpen(false)}
  />}
  {modal==='joystick'&&<JoystickPrompt connected={phone.status==='connected'} onConnect={openPhonePairing} onContinue={()=>{setModal(null);setPaused(false);}}/>}
  {modal&&modal!=='joystick'&&<div className="modal-backdrop" onClick={()=>modal==='menu'?closeMenu():setModal(null)}><section className={`modal ${modal==='all'?'wide':''}`} role="dialog" aria-modal="true" aria-label={modal==='menu'?'Arcade menu':modal==='how'?'Flight manual':modal==='settings'?'Settings':'Episode selection'} onClick={e=>e.stopPropagation()}><button className="close-modal icon-btn" aria-label="Close dialog" onClick={()=>modal==='menu'?closeMenu():setModal(null)}><X size={20}/></button><div className="eyebrow">ARTIKEL ARCADE / FLIGHT DECK</div>{modal==='menu'?<><div className="arcade-menu-logo">ARTIKEL<br/><span>ARCADE</span></div><p className="arcade-menu-caption">{playing?'FLIGHT PAUSED · SELECT AN OPTION':'SELECT YOUR NEXT ADVENTURE'}</p><nav className="arcade-menu-options" aria-label="Game pages">{menuItems.map((item,index)=>item.href?<a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" ref={element=>{menuButtons.current[index]=element;}} className={index===menuIndex?'selected':''} onFocus={()=>setMenuIndex(index)}><span className="menu-cursor">▶</span>{item.label}<small>↗</small></a>:<button key={item.label} ref={element=>{menuButtons.current[index]=element;}} className={index===menuIndex?'selected':''} onFocus={()=>setMenuIndex(index)} onClick={item.action}><span className="menu-cursor">▶</span>{item.label}<small>{String(index+1).padStart(2,'0')}</small></button>)}</nav><p className="arcade-menu-hint">↑ ↓ SELECT · ENTER CONFIRM · ESC CLOSE</p></>:modal==='how'?<><h2>Your flight manual.</h2><p>Word planets fly toward your shuttle. Select the correct article before each planet passes you; your answer is checked automatically.</p><div className="instruction"><kbd>←</kbd><kbd>→</kbd><span>Select Der, Das, or Die beneath your shuttle.</span></div><div className="instruction"><kbd>↑</kbd><span>Speed up your flight (up to 3×).</span></div><div className="instruction"><kbd>↓</kbd><span>Slow down your flight (down to 0.5×).</span></div><p className="muted">Press Esc to open the game menu, or use the Pause button to pause. The separate demo includes eight sample A1 words; these are not book lesson content. More episode vocabulary and Leitner scheduling come next.</p><button className="primary" onClick={()=>start(1)}>LET'S FLY <ArrowRight size={16}/></button></>:modal==='settings'?<><h2>Cockpit settings.</h2><div className="setting-row"><span>Arcade sound effects</span><button className="secondary" onClick={()=>setSound(!sound)}>{sound?'ON':'OFF'}</button></div><p>Progress is stored in this browser with localStorage. No account required.</p><button className="danger" onClick={()=>setModal('reset')}><RotateCcw size={15}/> Reset flight progress</button></>:modal==='reset'?<><h2>A fresh launch?</h2><p>This clears your completed episodes and scores on this device.</p><button className="danger" onClick={()=>{setProgress(initial);setModal(null)}}>RESET MY PROGRESS</button></>:modal==='all'?<><h2>{levels[level]} · Episode directory</h2><p>Each episode matches one Starten Wir! lesson. Send its word list to populate it; word counts can vary by lesson.</p><div className="all-grid">{Array.from({length:LESSONS_PER_LEVEL},(_,i)=><button key={i} onClick={()=>{setEpisode(i+1);setModal('episode')}} className={curriculum[levels[level]][i].words.length?'available':''}>{String(i+1).padStart(2,'0')} {curriculum[levels[level]][i].words.length?<Play size={11}/>:<LockKeyhole size={11}/>}</button>)}</div></>:<><div className="episode-modal-icon"><Ship small/></div><h2>{levels[level]} · Episode {String(episode).padStart(2,'0')}</h2><p>Starten Wir! · Lesson {String(episode).padStart(2,'0')}. {selectedLesson.source==='user'?'Vocabulary from your supplied lesson photos. The article game uses nouns with printed articles; browse the full list, including phrases and verbs, in Word collection.':selectedLesson.words.length?'Illustrative sample vocabulary for testing. These words are not from the book.':'This episode is waiting for your lesson vocabulary.'}</p><div className="mission-summary"><span>{selectedLesson.words.length?`${selectedLesson.words.length} TOTAL · ${selectedNouns.length} ARTICLE WORDS`:'WORD LIST PENDING'}</span><span>DER / DAS / DIE</span><span>ARROW CONTROLS</span></div><button className="primary" onClick={()=>selectedNouns.length?start(episode,false):start(1)}>{selectedNouns.length?(selectedLesson.source==='sample'?'LAUNCH SAMPLE LESSON':'LAUNCH LESSON'):'LAUNCH A1 DEMO'} <ArrowRight size={16}/></button></>}</section></div>}
 </div>
}
