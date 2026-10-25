import {useCallback, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import questionsData from '../data/questions.json';
import {AngularButton, GlowPanel, FieldArtwork} from './components/Design';
import BackgroundVideo from './components/BackgroundVideo';
import {SceneTransition} from './components/Motion';
import {gameAudio} from './lib/audio';
import {selectQuestions, startRound, answerQuestion, nextQuestion, getRoundResult, createLeaderboardEntry, readLeaderboard, saveLeaderboardEntry, compareLeaderboardEntries} from './lib/game';
import type {Answer, Question, RoundState, LeaderboardEntry} from './lib/game';

const ROUND_COUNT = 10;
const INACTIVITY_TIMEOUT_MS = 30_000;
const ROTATION_STORAGE_KEY = 'catch-the-phish.rotation.v1';
const ROTATION_NOTICE_MS = 2_000;
const pool = questionsData as Question[];
const asset = (path:string) => import.meta.env.BASE_URL + path.replace(/^\//,'');
const clock = () => performance.now();
const formatTime = (ms:number) => {
  const seconds = Math.floor(Math.max(0,ms)/1000);
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
};
const storage = {getItem:(k:string)=>localStorage.getItem(k),setItem:(k:string,v:string)=>localStorage.setItem(k,v),removeItem:(k:string)=>localStorage.removeItem(k)};
function Text({x=350,y,w=1460,size=48,bold=false,color='white',align='center',children,...rest}:{x?:number;y:number;w?:number;size?:number;bold?:boolean;color?:string;align?:'left'|'center'|'right';children:ReactNode;id?:string}) {
  return <div {...rest} className="design-text" style={{left:x,top:y,width:w,fontSize:size,fontWeight:bold?700:400,color,textAlign:align}}>{children}</div>;
}
function TouchKeyboard({field,onKey,onClose}:{field:'name'|'email';onKey:(k:string)=>void;onClose:()=>void}) {
  const [shift,setShift]=useState(field==='name');
  const rows=['1234567890','qwertyuiop','asdfghjkl','zxcvbnm'];
  return <section className="touch-keyboard" aria-label="Touch keyboard" onPointerDown={e=>e.preventDefault()}>
    <div className="keyboard-title">{field==='name'?'Enter your name':'Enter your email'}<button onClick={onClose}>Done ✓</button></div>
    {rows.map(row=><div className="key-row" key={row}>{[...row].map(k=><button key={k} onClick={()=>{onKey(shift?k.toUpperCase():k);if(shift)setShift(false)}}>{shift?k.toUpperCase():k}</button>)}</div>)}
    <div className="key-row"><button onClick={()=>setShift(!shift)} aria-pressed={shift}>Shift</button>{field==='email'&&<><button onClick={()=>onKey('@')}>@</button><button onClick={()=>onKey('.')}>.</button><button onClick={()=>onKey('.com')}>.com</button></>}{['-','_',"'",'+'].map(k=><button key={k} onClick={()=>onKey(k)}>{k}</button>)}<button className="space-key" onClick={()=>onKey(' ')}>Space</button><button onClick={()=>onKey('BACKSPACE')}>⌫</button></div>
  </section>;
}

export default function App(){
  const [screen,setScreen]=useState<'idle'|'registration'|'instructions'|'quiz'|'result'>('idle');
  const [name,setName]=useState(''); const [email,setEmail]=useState('');
  const [keyboard,setKeyboard]=useState<'name'|'email'|null>(null);
  const [round,setRound]=useState<RoundState|null>(null);
  const roundRef=useRef<RoundState|null>(null);
  const roundGeneration=useRef(0);
  const readyScene=useRef<string|null>(null);
  const questionReadyRef=useRef(false);
  const [questionReady,setQuestionReady]=useState(false);
  const [leaderboard,setLeaderboard]=useState<LeaderboardEntry[]>(()=>readLeaderboard(storage));
  const [now,setNow]=useState(clock());
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const [rotation,setRotation]=useState(()=>{
    try {
      const saved=Number(localStorage.getItem(ROTATION_STORAGE_KEY));
      return [90,180,270].includes(saved)?saved:0;
    }catch{return 0}
  });
  const [viewport,setViewport]=useState(()=>({width:window.innerWidth,height:window.innerHeight}));
  const sideways=rotation===90||rotation===270;
  const scale=Math.min(viewport.width/(sideways?3840:2160),viewport.height/(sideways?2160:3840));
  const [showRotationNotice,setShowRotationNotice]=useState(false);
  const rotationNoticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const rotateScreen=useCallback(()=>{
    setRotation(current=>(current+90)%360);
    setShowRotationNotice(true);
    if(rotationNoticeTimer.current)clearTimeout(rotationNoticeTimer.current);
    rotationNoticeTimer.current=setTimeout(()=>{setShowRotationNotice(false);rotationNoticeTimer.current=null},ROTATION_NOTICE_MS);
  },[]);
  useEffect(()=>()=>{if(rotationNoticeTimer.current)clearTimeout(rotationNoticeTimer.current)},[]);
  const transition=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pendingStart=useRef(0);const saved=useRef(false);
  const pendingScores=useRef<LeaderboardEntry[]>([]);
  const flushScores=useCallback(()=>{
    let entries=readLeaderboard(storage);
    pendingScores.current=pendingScores.current.filter(entry=>{const attempt=saveLeaderboardEntry(storage,entry);entries=attempt;return !attempt.persisted});
    const merged=[...new Map([...entries,...pendingScores.current].map(e=>[e.id,e])).values()].sort(compareLeaderboardEntries);
    setLeaderboard(merged);return pendingScores.current.length===0;
  },[]);
  const reset=useCallback(()=>{pendingStart.current++;if(transition.current)clearTimeout(transition.current);roundRef.current=null;readyScene.current=null;questionReadyRef.current=false;setQuestionReady(false);setRound(null);setName('');setEmail('');setKeyboard(null);setLoading(false);setError('');setScreen('idle');flushScores();},[flushScores]);
  useEffect(()=>{const resize=()=>setViewport({width:window.innerWidth,height:window.innerHeight});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
  useEffect(()=>{
    try{localStorage.setItem(ROTATION_STORAGE_KEY,String(rotation))}catch{/* Rotation still works when storage is unavailable. */}
  },[rotation]);
  useEffect(()=>{
    const rotate=(event:KeyboardEvent)=>{
      if(!event.shiftKey||event.altKey||(event.code!=='KeyR'&&event.key.toLowerCase()!=='r'))return;
      // Typing an uppercase R in registration must keep entering the player's details.
      if(!event.ctrlKey&&!event.metaKey&&event.target instanceof HTMLElement&&(event.target.isContentEditable||event.target.closest('input,textarea,select')))return;
      event.preventDefault();
      if(!event.repeat)rotateScreen();
    };
    window.addEventListener('keydown',rotate,true);
    window.addEventListener('ctphish:rotate',rotateScreen);
    return()=>{
      window.removeEventListener('keydown',rotate,true);
      window.removeEventListener('ctphish:rotate',rotateScreen);
    };
  },[rotateScreen]);
  useEffect(()=>{
    if(screen==='idle')return;
    let timer:ReturnType<typeof setTimeout>;
    const restartTimer=()=>{clearTimeout(timer);timer=setTimeout(reset,INACTIVITY_TIMEOUT_MS)};
    restartTimer();
    window.addEventListener('pointerdown',restartTimer,true);
    window.addEventListener('keydown',restartTimer,true);
    window.addEventListener('ctphish:rotate',restartTimer);
    return()=>{
      clearTimeout(timer);
      window.removeEventListener('pointerdown',restartTimer,true);
      window.removeEventListener('keydown',restartTimer,true);
      window.removeEventListener('ctphish:rotate',restartTimer);
    };
  },[screen,reset]);
  useEffect(()=>{if(screen!=='quiz')return;const i=setInterval(()=>setNow(clock()),100);return()=>clearInterval(i)},[screen]);
  useEffect(()=>()=>{pendingStart.current++;if(transition.current)clearTimeout(transition.current)},[]);
  const sceneKey=screen==='quiz'&&round?`quiz-${roundGeneration.current}-${round.index}`:screen;
  const previousScene=useRef<string|null>(null);
  useEffect(()=>{
    gameAudio.setScene(screen);
    if(previousScene.current!==null&&previousScene.current!==sceneKey)gameAudio.play('transition');
    if(screen==='result')gameAudio.play('complete');
    previousScene.current=sceneKey;
  },[screen,sceneKey]);
  useEffect(()=>{
    // Electron permits music on launch; browsers unlock it on the first gesture.
    gameAudio.unlock();
    const pointer=()=>gameAudio.unlock();
    const activate=(event:MouseEvent)=>{
      const target=event.target instanceof Element?event.target.closest('button,input,select,[role="button"],[role="option"]'):null;
      if(!target||target.matches(':disabled')||target.closest('[inert]'))return;
      gameAudio.unlock();
      gameAudio.play(target.closest('.touch-keyboard')?'key':'tap');
    };
    const key=(event:KeyboardEvent)=>{
      gameAudio.unlock();
      if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='m'){
        event.preventDefault();if(!gameAudio.toggleMute())gameAudio.play('tap');
      }else if(!event.repeat&&event.target instanceof HTMLInputElement&&event.key.length===1)gameAudio.play('key');
    };
    window.addEventListener('pointerdown',pointer,true);window.addEventListener('click',activate,true);window.addEventListener('keydown',key,true);
    return()=>{window.removeEventListener('pointerdown',pointer,true);window.removeEventListener('click',activate,true);window.removeEventListener('keydown',key,true)};
  },[]);
  const handleSceneReady=useCallback((key:string)=>{
    const current=roundRef.current;
    if(!current||current.status!=='question'||current.completed||key!==`quiz-${roundGeneration.current}-${current.index}`||readyScene.current===key)return;
    const activated={...current,questionStartedAt:clock()};
    readyScene.current=key;questionReadyRef.current=true;setQuestionReady(true);
    roundRef.current=activated;setRound(activated);setNow(clock());
  },[]);
  const begin=async()=>{
    if(loading)return;setLoading(true);setError('');const generation=++pendingStart.current;
    const selected=selectQuestions(pool,ROUND_COUNT);
    try {await Promise.all([document.fonts.ready,...selected.map(q=>new Promise<void>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error('A question image could not load. Tap Next to retry.'));im.src=asset(q.image)}))]);
      if(generation!==pendingStart.current)return;
      roundGeneration.current++;readyScene.current=null;questionReadyRef.current=false;setQuestionReady(false);
      const r=startRound(selected,clock());roundRef.current=r;setRound(r);saved.current=false;setNow(clock());setLoading(false);setScreen('quiz');
    }catch(e){if(generation===pendingStart.current){setError(e instanceof Error?e.message:'Unable to load questions. Please retry.');setLoading(false)}}
  };
  const choose=(answer:Answer)=>{
    const current=roundRef.current;if(!current||!questionReadyRef.current)return;
    const answered=answerQuestion(current,answer,clock());if(answered===current)return;
    gameAudio.play(answered.answers[answered.index]?.correct?'correct':'incorrect');
    roundRef.current=answered;setRound(answered);setNow(clock());
    transition.current=setTimeout(()=>{
      questionReadyRef.current=false;setQuestionReady(false);
      const next=nextQuestion(answered,clock());roundRef.current=next;setRound(next);setNow(clock());
      if(next.completed){
        const result=getRoundResult(next);
        if(!saved.current){saved.current=true;const entry=createLeaderboardEntry(name,result,{email});pendingScores.current.push(entry);if(!flushScores())setError('Your score is held in memory. Please contact the operator to save it.');}
        setScreen('result');
      }
    },1500);
  };
  const validName=name.trim().length>0;
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const modify=(key:string)=>{const setter=keyboard==='name'?setName:setEmail;setter(v=>key==='BACKSPACE'?v.slice(0,-1):(v+key).slice(0,keyboard==='name'?32:120))};
  const result=round?getRoundResult(round):null;
  const current=round?.questions[round.index];
  const lastAnswer=round?.answers[round.index];
  const elapsed=result?result.elapsedMs+(screen==='quiz'&&questionReady&&!lastAnswer&&round?Math.max(0,now-round.questionStartedAt):0):0;
  const feedback:'correct'|'incorrect'|undefined=lastAnswer?(lastAnswer.correct?'correct':'incorrect'):undefined;
  return <main className="app-viewport">
    <div className="design-plane" style={{width:2160,height:3840,transform:`translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`}} data-screen={screen} data-rotation={rotation}>
      <BackgroundVideo/>
      <SceneTransition sceneKey={sceneKey} onReady={handleSceneReady}>
      {screen==='idle'&&<>
        <GlowPanel x={206} y={575} width={1748} height={2300} type="main"/>
        <Text x={376} y={712} w={1408} size={138} bold>Catch the Phish</Text>
        <Text y={1064} size={46} color="#b8d8f3">CAN YOU CATCH THE PHISH?</Text>
        <Text x={650} y={1300} w={860} size={80} bold>Leaderboard</Text>
        <div className="leaderboard" aria-label="Leaderboard">
          <div className="leader-header"><span>Rank</span><span>Agent</span><span>Correct</span><span>Time</span></div>
          <div className="leader-rules" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} style={{top:301+i*185}}/>)}{[190,950,1230].map(x=><b key={x} style={{left:x}}/>)}</div>
          {Array.from({length:5},(_,i)=>{const entry=leaderboard[i];return <div className="leader-row" style={{top:200+i*185}} key={i}><strong>{i+1}</strong><span className="agent-name">{entry?.playerName||(i===0?'Be the first to play':'—')}</span><strong>{entry?entry.correct:'—'}</strong><span>{entry?formatTime(entry.elapsedMs):'—'}</span></div>})}
        </div>
        <AngularButton x={640} y={3000} onClick={()=>setScreen('registration')}>Start</AngularButton>
      </>}
      {screen==='registration'&&<>
        <GlowPanel x={206} y={575} width={1748} height={2300} type="main"/>
        <Text y={694} size={106} bold>AGENT</Text><Text y={854} size={106} bold>REGISTRATION</Text>
        <Text y={1092}>Enter your name and email</Text><Text y={1187}>to play Catch the Phish.</Text>
        <form onSubmit={e=>{e.preventDefault();if(validName&&validEmail){setName(name.trim());setEmail(email.trim());setKeyboard(null);setScreen('instructions')}}} autoComplete="off">
          <Text y={1454} size={56} bold align="left"><label htmlFor="agent-name">Name</label></Text>
          <FieldArtwork x={350} y={1605}/>
          <input id="agent-name" className="agent-input" style={{top:1605}} placeholder="Enter your name" value={name} maxLength={32} onChange={e=>setName(e.target.value)} onFocus={()=>setKeyboard('name')} inputMode="none" autoComplete="off" required/>
          <Text y={2004} size={56} bold align="left"><label htmlFor="agent-email">Email</label></Text>
          <FieldArtwork x={350} y={2155}/>
          <input id="agent-email" className="agent-input" style={{top:2155}} placeholder="Enter your email" value={email} maxLength={120} onChange={e=>setEmail(e.target.value)} onFocus={()=>setKeyboard('email')} inputMode="none" type="email" autoComplete="off" required/>
          <Text y={2478} size={52} bold color="#d9ecff">Ready to catch the phish?</Text>
          <Text y={2630} size={40} color="#b8d8f3">Register to continue to the instructions.</Text>
          <AngularButton x={640} y={3000} disabled={!validName||!validEmail} onClick={()=>{if(validName&&validEmail){setName(name.trim());setEmail(email.trim());setKeyboard(null);setScreen('instructions')}}}>Register</AngularButton>
        </form>
      </>}
      {screen==='instructions'&&<>
        <GlowPanel x={206} y={575} width={1748} height={2300} type="main"/>
        <Text x={376} y={712} w={1408} size={138} bold>Catch the Phish</Text><Text y={1002} size={68} bold color="#5be9ff">HOW TO PLAY</Text>
        {[
          ['INSPECT THE MESSAGE','Read the sender, message and links.','Look for anything suspicious.'],
          ['TAP YOUR CHOICE','Select Legitimate or Phishing.'],
          ['WATCH THE FEEDBACK','Green means correct.','Red means incorrect.'],
          ['BE ACCURATE AND QUICK']
        ].map((step,i)=><div key={i}><Text x={350} y={1244+i*380} w={120} size={76} bold align="left" color="#5be9ff">0{i+1}</Text><Text x={540} y={1264+i*380} w={1200} size={56} bold align="left">{step[0]}</Text>{step[1]&&<Text x={540} y={1402+i*380} w={1200} align="left">{step[1]}</Text>}{step[2]&&<Text x={540} y={1492+i*380} w={1200} align="left">{step[2]}</Text>}</div>)}
        <AngularButton x={640} y={3000} disabled={loading} onClick={begin}>{loading?'Loading…':'Next'}</AngularButton>
        {error&&<Text y={3300} size={40} color="#ffb8b8">{error}</Text>}
      </>}
      {screen==='quiz'&&round&&current&&<>
        <GlowPanel x={205.875} y={700} width={1748.25} height={2440} type="question" feedback={feedback}/>
        <Text y={815} size={50} bold color="#5be9ff" align="left">ROUND {String(round.index+1).padStart(2,'0')} / {ROUND_COUNT}</Text>
        <div className="progress" aria-label={`Question ${round.index+1} of ${ROUND_COUNT}`}>{Array.from({length:ROUND_COUNT},(_,i)=><i key={i} className={i<=round.index?'active':''}/>)}</div>
        <Text x={344.5} y={1006} w={1470} size={144} bold>Catch the Phish</Text><Text y={1212} size={58} color="#d9ecff">Legitimate or Phishing?</Text>
        <GlowPanel x={350} y={1400} width={1460} height={920} type="message"/>
        <div className="question-image-slot" aria-label={`Message to inspect, round ${round.index+1}`}>
          <div className="question-crop"><img src={asset(current.image)} alt="Inspect the sender, message and links before choosing Legitimate or Phishing." draggable={false}/></div>
        </div>
        <AngularButton x={350} y={2450} width={700} height={202.829} labelSize={45.56} disabled={!!lastAnswer||!questionReady} onClick={()=>choose('legitimate')}>Legitimate</AngularButton>
        <AngularButton x={1110} y={2450} width={700} height={202.829} labelSize={45.56} disabled={!!lastAnswer||!questionReady} onClick={()=>choose('phishing')}>Phishing</AngularButton>
        <div className="statistics"><div><span>AGENT</span><strong title={name}>{name}</strong></div><div><span>TIME</span><strong>{formatTime(elapsed)}</strong></div><div><span>CORRECT</span><strong>{result?.correct} / {ROUND_COUNT}</strong></div></div>
        <div className="sr-only" aria-live="assertive">{feedback?`${feedback==='correct'?'Correct':'Incorrect'}. This message is ${current.answer}.`:''}</div>
      </>}
      {screen==='result'&&result&&<>
        <GlowPanel x={206} y={940} width={1748} height={1580} type="result"/>
        <Text x={350} y={1040} size={170} bold>Thank you!</Text><Text y={1390} size={60} bold color="#5be9ff">Catch the Phish</Text><Text y={1505} size={60} bold color="#5be9ff">COMPLETE</Text>
        <Text x={480} y={1645} w={1200} size={220} bold>{result.correct} / {ROUND_COUNT}</Text><Text y={1972} size={48} bold color="#b8d8f3">YOUR SCORE</Text>
        <Text y={2148} size={72} bold>Total time: {formatTime(result.elapsedMs)}</Text><Text y={2310} size={60}>{name}</Text>
        <AngularButton x={640} y={2645} onClick={reset}>Finish</AngularButton>{error&&<Text y={3050} size={36} color="#ffb8b8">{error}</Text>}
      </>}
      </SceneTransition>
      {keyboard&&screen==='registration'&&<TouchKeyboard field={keyboard} onKey={modify} onClose={()=>{setKeyboard(null);(document.activeElement as HTMLElement)?.blur()}}/>}
    </div>
    {showRotationNotice&&<div className="rotation-notice" role="status">Screen rotated to {rotation}°</div>}
  </main>;
}
