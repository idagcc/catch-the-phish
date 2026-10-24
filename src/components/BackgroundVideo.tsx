import {useEffect, useRef} from 'react';

const asset = (path:string) => `${import.meta.env.BASE_URL}${path}`;

/** One persistent decoder keeps the supplied video running across every scene. */
export default function BackgroundVideo() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (document.hidden || motion.matches) media.pause();
      else void media.play().catch(() => { /* The included poster remains available. */ });
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);
  return <div className="scene-backdrop" aria-hidden="true">
    <video ref={video} className="scene-video" autoPlay loop muted playsInline preload="auto"
      disablePictureInPicture poster={asset('video/dge-background-poster.jpg')}>
      <source src={asset('video/dge-background.mp4')} type="video/mp4"/>
    </video>
    <div className="scene-shade"/>
  </div>;
}
