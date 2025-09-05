// useSelector.ts
import Zeroact from "@/lib/Zeroact";
import { store } from "@/store";

export function useSelector<T>(selector: (state: ReturnType<typeof store.getState>) => T) : T {
  const [selected, setSelected] = Zeroact.useState<T>(selector(store.getState()));

  Zeroact.useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const nextSelected = selector(store.getState());
      setSelected(nextSelected);
    });

    return unsubscribe
  }, []);

  return selected;
}
