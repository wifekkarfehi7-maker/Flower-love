"use client";

import * as React from "react";
import { Music2, VolumeX } from "lucide-react";

const LABEL = { on: "Music on", off: "Music off" };

/**
 * Persistent floating music control. Never autoplays on mount — only starts
 * once `triggerAutoplay` flips to true (the visitor's own "Open Invitation"
 * click), satisfying the platform's "no autoplay before user interaction"
 * rule while still counting as a genuine user gesture for the browser's
 * audio autoplay policy. When there's no Cover page to click through,
 * the button still renders (`show`) so the visitor can start it manually.
 */
export function MusicPlayer({
  url,
  autoplayAfterOpen,
  show,
  triggerAutoplay,
}: {
  url: string;
  autoplayAfterOpen: boolean;
  show: boolean;
  triggerAutoplay: boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const hasStarted = React.useRef(false);

  React.useEffect(() => {
    if (!triggerAutoplay || hasStarted.current || !autoplayAfterOpen) return;
    hasStarted.current = true;
    audioRef.current?.play().then(
      () => setPlaying(true),
      () => setPlaying(false) // autoplay blocked by the browser — visitor can still tap the button
    );
  }, [triggerAutoplay, autoplayAfterOpen]);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    }
  }

  if (!show) return null;

  return (
    <>
      <audio ref={audioRef} src={url} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? LABEL.on : LABEL.off}
        aria-pressed={playing}
        className="fixed bottom-5 end-5 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
        style={{ backgroundColor: "var(--inv-primary)", color: "var(--inv-bg)" }}
      >
        {playing ? <Music2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </>
  );
}
