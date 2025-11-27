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

export function useSound(soundUrl: string): SoundValue {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const soundBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [isMuffled, setIsMuffled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      source.disconnect();
      if (sourceRef.current === source) sourceRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    const source = sourceRef.current;
    if (source) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        console.warn("Failed to stop source", e);
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
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