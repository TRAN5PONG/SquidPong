import { useEffect, useRef, useState, useCallback } from "@/lib/Zeroact";

export interface SoundValue {
  play: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setMuffled: (value: boolean) => void;
  setVolume: (v: number) => void;
  isMuffled: boolean;
  isPlaying: boolean;
}

interface SoundSettings {
  volume?: number;
  muffled?: boolean;
  loop?: boolean;
}

export function useSound(
  soundUrl: string,
  settings: SoundSettings = {}
): SoundValue {
  // Core
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const soundBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Settings
  const [isMuffled, setIsMuffled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(settings.loop || false);
  const volume = settings.volume ?? 1;

  useEffect(() => {
    const context = new AudioContext();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = 22050;

    gainNode.connect(filter);
    filter.connect(context.destination);

    audioContextRef.current = context;
    gainNodeRef.current = gainNode;
    filterRef.current = filter;

    if (settings.muffled) {
      const targetFreq = 200;
      filter.frequency.setTargetAtTime(targetFreq, context.currentTime, 0);
      setIsMuffled(true);
    }

    return () => {
      stop();
      context.close();
      audioContextRef.current = null;
      gainNodeRef.current = null;
      filterRef.current = null;
      soundBufferRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadSound = async () => {
      const context = audioContextRef.current;
      if (!context) return;

      try {
        const response = await fetch(soundUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        soundBufferRef.current = audioBuffer;
      } catch (err) {
        console.error(`Error loading sound from ${soundUrl}:`, err);
        soundBufferRef.current = null;
      }
    };

    loadSound();
  }, [soundUrl]);

  const play = useCallback(() => {
    const context = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const buffer = soundBufferRef.current;

    if (!context || !gainNode || !buffer) {
      console.warn("Sound not ready.");
      return;
    }

    stop(); // stop any existing source first

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.start();

    sourceRef.current = source;
    gainNode.gain.setValueAtTime(volume, context.currentTime);
    if (isLooping) {
      source.loop = true;
    }
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      source.disconnect();
      if (sourceRef.current === source) sourceRef.current = null;
    };
  }, []);

  const stop = useCallback((fadeDuration = 3) => {
    const context = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const source = sourceRef.current;

    if (!context || !gainNode || !source) {
      setIsPlaying(false);
      return;
    }

    try {
      // Smooth fade out instead of abrupt stop
      const currentTime = context.currentTime;
      const currentGain = gainNode.gain.value;

      // Cancel any scheduled automation first
      gainNode.gain.cancelScheduledValues(currentTime);

      // Start from current volume
      gainNode.gain.setValueAtTime(currentGain, currentTime);

      // Fade down to 0 over fadeDuration
      gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeDuration);

      // Stop the sound after fade is complete
      source.stop(currentTime + fadeDuration);

      // Cleanup when fade ends
      setTimeout(() => {
        try {
          source.disconnect();
        } catch {}
        if (sourceRef.current === source) {
          sourceRef.current = null;
        }
        setIsPlaying(false);
      }, fadeDuration * 1000);
    } catch (e) {
      console.warn("Failed to fade stop", e);
      source.stop();
      source.disconnect();
      sourceRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    const context = audioContextRef.current;
    if (context?.state === "running") {
      context.suspend();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    const context = audioContextRef.current;
    if (context?.state === "suspended") {
      context.resume();
      setIsPlaying(true);
    }
  }, []);

  const setMuffled = useCallback((value: boolean) => {
    const context = audioContextRef.current;
    const filter = filterRef.current;

    if (!context || !filter) return;

    const targetFreq = value ? 200 : 2000;
    filter.frequency.setTargetAtTime(targetFreq, context.currentTime, 0.5);
    setIsMuffled(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    const context = audioContextRef.current;
    const gainNode = gainNodeRef.current;

    if (!context || !gainNode) return;

    gainNode.gain.setValueAtTime(value, context.currentTime);
  }, []);

  return {
    play,
    stop,
    pause,
    resume,
    setMuffled,
    setVolume,
    isMuffled,
    isPlaying,
  };
}
