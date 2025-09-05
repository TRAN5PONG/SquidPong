import { createContext, useContext, ZeroactNode } from "@/lib/Zeroact";
import { SoundValue, useSound } from "@/hooks/useSound";

const SoundContext = createContext<SoundValue | null>(null);

export function SoundProvider({ children }: { children: ZeroactNode[] }) {
  const sound = useSound("/sounds/pause_ambient.mp3", {
    volume: 0.7,
  });

  return {
    type: SoundContext.Provider,
    props: {
      value: sound,
      children,
    },
  };
}

export function useAmbientSound(): SoundValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useAmbientSound must be used inside SoundProvider");
  return ctx;
}
