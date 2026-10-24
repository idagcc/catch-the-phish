import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './Motion.css';

export const SCENE_ENTER_MS = 420;
export const SCENE_EXIT_MS = 200;
export const QUIZ_ENTER_MS = 220;
export const QUIZ_EXIT_MS = 120;

export function getSceneEnterMs(sceneKey: string) {
  return sceneKey.startsWith('quiz-') ? QUIZ_ENTER_MS : SCENE_ENTER_MS;
}

interface SceneSnapshot {
  key: string;
  children: ReactNode;
}

export interface SceneTransitionProps {
  sceneKey: string;
  children: ReactNode;
  onReady?: (sceneKey: string) => void;
}

/** Keeps live React children intact while their scene key is unchanged. */
export function SceneTransition({ sceneKey, children, onReady }: SceneTransitionProps) {
  const [outgoing, setOutgoing] = useState<SceneSnapshot | null>(null);
  const [entering, setEntering] = useState(true);
  const incomingRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<SceneSnapshot>({ key: sceneKey, children });
  const onReadyRef = useRef(onReady);
  const generationRef = useRef(0);
  onReadyRef.current = onReady;

  useLayoutEffect(() => {
    const node = incomingRef.current;
    if (!node) return;
    const generation = ++generationRef.current;
    const previous = previousRef.current;
    const quiz = sceneKey.startsWith('quiz-');
    const enterDuration = getSceneEnterMs(sceneKey);
    const exitDuration = quiz ? QUIZ_EXIT_MS : SCENE_EXIT_MS;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let ready = false;
    let animation: Animation | undefined;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    let outgoingTimer: ReturnType<typeof setTimeout> | undefined;

    setEntering(true);
    node.inert = true;
    if (previous.key !== sceneKey && !motionQuery.matches) {
      setOutgoing(previous);
      outgoingTimer = setTimeout(() => {
        if (!disposed && generationRef.current === generation) setOutgoing(null);
      }, exitDuration);
    } else {
      setOutgoing(null);
    }

    const finish = () => {
      if (disposed || ready || generationRef.current !== generation) return;
      ready = true;
      if (readyTimer !== undefined) clearTimeout(readyTimer);
      animation?.cancel();
      node.inert = false;
      setEntering(false);
      onReadyRef.current?.(sceneKey);
    };

    const reduceMotion = () => {
      if (!motionQuery.matches) return;
      if (outgoingTimer !== undefined) clearTimeout(outgoingTimer);
      setOutgoing(null);
      finish();
    };

    if (motionQuery.matches || typeof node.animate !== 'function') {
      readyTimer = setTimeout(finish, 0);
    } else {
      animation = node.animate([
        { opacity: 0, transform: 'translateY(24px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ], { duration: enterDuration, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
      void animation.finished.then(finish, () => undefined);
      // A fallback also unlocks interaction if a browser suppresses animation events.
      readyTimer = setTimeout(finish, enterDuration + 80);
    }
    motionQuery.addEventListener('change', reduceMotion);

    return () => {
      disposed = true;
      animation?.cancel();
      if (readyTimer !== undefined) clearTimeout(readyTimer);
      if (outgoingTimer !== undefined) clearTimeout(outgoingTimer);
      motionQuery.removeEventListener('change', reduceMotion);
    };
  }, [sceneKey]);

  useLayoutEffect(() => {
    previousRef.current = { key: sceneKey, children };
  }, [sceneKey, children]);

  const quiz = sceneKey.startsWith('quiz-');
  const style = {
    '--scene-enter-ms': `${getSceneEnterMs(sceneKey)}ms`,
    '--scene-exit-ms': `${quiz ? QUIZ_EXIT_MS : SCENE_EXIT_MS}ms`,
  } as CSSProperties;

  return (
    <div className="scene-transition" data-entering={entering} style={style}>
      {outgoing && <div key={`outgoing-${outgoing.key}`} className="scene-transition__outgoing" aria-hidden="true" inert>{outgoing.children}</div>}
      <div key={sceneKey} ref={incomingRef} className="scene-transition__incoming" inert={entering}>{children}</div>
      {entering && <span key={`scan-${sceneKey}`} className="scene-transition__scan" aria-hidden="true" />}
    </div>
  );
}
