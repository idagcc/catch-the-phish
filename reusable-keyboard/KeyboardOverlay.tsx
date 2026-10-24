import {useEffect, useState} from 'react';
import TouchKeyboard from './TouchKeyboard';

/** Positions the original keyboard on its original 2160 × 3840 portrait canvas. */
export default function KeyboardOverlay(props: {
  field: 'name' | 'email';
  onKey: (key: string) => void;
  onClose: () => void;
}) {
  const measure = () => Math.min(window.innerWidth / 2160, window.innerHeight / 3840);
  const [scale, setScale] = useState(measure);

  useEffect(() => {
    const resize = () => setScale(measure());
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      width: 2160,
      height: 3840,
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: '50% 50%',
      pointerEvents: 'none',
      zIndex: 9999,
    }}>
      <div style={{pointerEvents: 'auto'}}>
        <TouchKeyboard {...props}/>
      </div>
    </div>
  );
}
