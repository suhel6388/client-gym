/**
 * Notification sound utility.
 * Plays the WePlay notification sound on transaction events.
 * Includes Web Audio API synthesizer fallback if audio fails or is blocked.
 */

const NOTIFICATION_SOUND_URL = "https://www.myinstants.com/media/sounds/noti.mp3";

let audioElement: HTMLAudioElement | null = null;
let soundEnabled = true;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioElement) {
    try {
      audioElement = new Audio(NOTIFICATION_SOUND_URL);
      audioElement.volume = 0.65;
      audioElement.preload = "auto";
    } catch {
      audioElement = null;
    }
  }
  return audioElement;
}

/** Fallback chime using Web Audio API in case external mp3 fails or is blocked */
function playSynthChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two-tone friendly chime (WePlay style high-pitch pleasant chime)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(830.61, now); // G#5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1254.37, now + 0.08); // D#6
    osc2.frequency.exponentialRampToValueAtTime(1661.22, now + 0.25); // G#6

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch {
    // Audio context not available or blocked
  }
}

export function playNotificationSound(): void {
  if (!isSoundEnabled() || typeof window === "undefined") return;

  const audio = getAudio();
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // If html5 audio fails or is blocked by CORS/network, use Web Audio API chime
      playSynthChime();
    });
  } else {
    playSynthChime();
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("gym-notification-sound", enabled ? "on" : "off");
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("gym-notification-sound");
    if (stored !== null) {
      soundEnabled = stored === "on";
    }
  }
  return soundEnabled;
}

/** Preload the audio to avoid delay on first play. */
export function preloadNotificationSound(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("gym-notification-sound");
  if (stored !== null) {
    soundEnabled = stored === "on";
  }
  try {
    getAudio();
  } catch {
    // Ignore
  }
}

