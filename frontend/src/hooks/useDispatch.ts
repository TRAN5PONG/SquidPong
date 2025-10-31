// useDispatch.ts
import { store } from "@/store";

export function useDispatch() {
  return store.dispatch;
}
