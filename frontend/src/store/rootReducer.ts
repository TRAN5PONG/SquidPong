// store/rootReducer.ts
import { combineReducers } from "./combineReducers";
import { userReducer } from "./user/reducer";
import { UserState } from "./user/types";
import { UserAction } from "./user/actions";

export interface RootState {
  user: UserState;
}

export const rootReducer = combineReducers<RootState, UserAction>({
  user: userReducer,
});
