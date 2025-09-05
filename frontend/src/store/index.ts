// store/index.ts
import { createStore } from "@/lib/ZeroState/core";
import { rootReducer } from "./rootReducer";

export const store = createStore(rootReducer);
