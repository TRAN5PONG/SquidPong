import { createContext, useContext, ZeroactNode } from "@/lib/Zeroact";
import { SoundValue, useSound } from "@/hooks/useSound";

// Define all your sounds in a single object
export type AppSounds = {
  pauseAmbientSound: SoundValue;
  backgroundSound: SoundValue;
  wonSound: SoundValue;
  lostSound: SoundValue;
  el_clickSound: SoundValue;
  el_hoverSound: SoundValue;
  startSound: SoundValue;
  errorSound: SoundValue;
  readySound: SoundValue;
  popupSound: SoundValue;
  notificationSound: SoundValue;
  countDownSound: SoundValue;
  countDownEndSound: SoundValue;
  msgSentSound: SoundValue;
  msgReceivedSound: SoundValue;
  entranceSound: SoundValue
};

const SoundContext = createContext<AppSounds | null>(null);

export function SoundProvider({ children }: { children: ZeroactNode[] }) {
  // Preload all sounds immediately
  const pauseAmbientSound = useSound("/sounds/pause_ambient.mp3");
  const backgroundSound = useSound("/sounds/background.mp3");
  const entranceSound = useSound("/sounds/ambient.mp3");
  const wonSound = useSound("/sounds/won.mp3");
  const lostSound = useSound("/sounds/lost.mp3");
  const el_clickSound = useSound("/sounds/elSelect.mp3");
  const el_hoverSound = useSound("/sounds/elHover.mp3");
  const errorSound = useSound("/sounds/error.mp3");
  const startSound = useSound("/sounds/start.mp3");
  const readySound = useSound("/sounds/ready.mp3");
  const popupSound = useSound("/sounds/popup.mp3");
  const notificationSound = useSound("/sounds/update.mp3");
  const countDownSound = useSound("/sounds/countdown.mp3");
  const countDownEndSound = useSound("/sounds/countdown_done.mp3");
  const msgSentSound = useSound("/sounds/msgSent.mp3");
  const msgReceivedSound = useSound("/sounds/msgReceived.mp3");

  const sounds: AppSounds = {
    pauseAmbientSound,
    backgroundSound,
    wonSound,
    lostSound,
    el_clickSound,
    el_hoverSound,
    errorSound,
    startSound,
    readySound,
    popupSound,
    notificationSound,
    countDownSound,
    countDownEndSound,
    msgSentSound,
    msgReceivedSound,
    entranceSound
  };

  return {
    type: SoundContext.Provider,
    props: {
      value: sounds,
      children,
    },
  };
}

// Hook to access all sounds
export function useSounds(): AppSounds {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSounds must be used inside SoundProvider");
  return ctx;
}
