import {useState} from 'react';
import './TouchKeyboard.css';

export default function TouchKeyboard({field,onKey,onClose}:{field:'name'|'email';onKey:(k:string)=>void;onClose:()=>void}) {
  const [shift,setShift]=useState(field==='name');
  const rows=['1234567890','qwertyuiop','asdfghjkl','zxcvbnm'];
  return <section className="touch-keyboard" aria-label="Touch keyboard" onPointerDown={e=>e.preventDefault()}>
    <div className="keyboard-title">{field==='name'?'Enter your name':'Enter your email'}<button onClick={onClose}>Done ✓</button></div>
    {rows.map(row=><div className="key-row" key={row}>{[...row].map(k=><button key={k} onClick={()=>{onKey(shift?k.toUpperCase():k);if(shift)setShift(false)}}>{shift?k.toUpperCase():k}</button>)}</div>)}
    <div className="key-row"><button onClick={()=>setShift(!shift)} aria-pressed={shift}>Shift</button>{field==='email'&&<><button onClick={()=>onKey('@')}>@</button><button onClick={()=>onKey('.')}>.</button><button onClick={()=>onKey('.com')}>.com</button></>}{['-','_',"'",'+'].map(k=><button key={k} onClick={()=>onKey(k)}>{k}</button>)}<button className="space-key" onClick={()=>onKey(' ')}>Space</button><button onClick={()=>onKey('BACKSPACE')}>⌫</button></div>
  </section>;
}
