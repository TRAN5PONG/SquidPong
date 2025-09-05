import { Action } from "@/lib/ZeroState/types";
import { PlayerStats, User } from "@/types/user";

// Action Types
export const USER_LOGIN_START = "USER_LOGIN_START";
export const USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS";
export const USER_LOGIN_FAILURE = "USER_LOGIN_FAILURE";
export const USER_LOGOUT = "USER_LOGOUT";
export const USER_UPDATE_PROFILE = "USER_UPDATE_PROFILE";
export const USER_UPDATE_STATS = "USER_UPDATE_STATS";
export const USER_SET_ONLINE_STATUS = "USER_SET_ONLINE_STATUS";
export const USER_UPDATE_WALLET = "USER_UPDATE_WALLET";
export const USER_SELECT_CHARACTER = "USER_SELECT_CHARACTER";

// Profile Modal
export const USER_SHOW_PROFILE_MODAL = "USER_SHOW_PROFILE_MODAL";
export const USER_HIDE_PROFILE_MODAL = "USER_HIDE_PROFILE_MODAL";

// Action Interfaces
export interface UserLoginStartAction extends Action {
  type: typeof USER_LOGIN_START;
}
export interface UserLoginSuccessAction extends Action {
  type: typeof USER_LOGIN_SUCCESS;
  payload: User;
}
export interface UserLoginFailureAction extends Action {
  type: typeof USER_LOGIN_FAILURE;
  payload: string;
}
export interface UserLogoutAction extends Action {
  type: typeof USER_LOGOUT;
}
export interface UserUpdateProfileAction extends Action {
  type: typeof USER_UPDATE_PROFILE;
  payload: Partial<User>;
}
export interface UserUpdateStatsAction extends Action {
  type: typeof USER_UPDATE_STATS;
  payload: Partial<PlayerStats>;
}
export interface UserSetOnlineStatusAction extends Action {
  type: typeof USER_SET_ONLINE_STATUS;
  payload: boolean;
}
export interface UserUpdateWalletAction extends Action {
  type: typeof USER_UPDATE_WALLET;
  payload: number;
}
export interface UserSelectCharacterAction extends Action {
  type: typeof USER_SELECT_CHARACTER;
  payload: string | null;
}
export interface UserShowProfileModalAction extends Action {
  type: typeof USER_SHOW_PROFILE_MODAL;
  payload: {
    userId?: string;
    userProfile?: User;
  };
}
export interface UserHideProfileModalAction extends Action {
  type: typeof USER_HIDE_PROFILE_MODAL;
}

// Union type for all user actions
export type UserAction =
  | UserLoginStartAction
  | UserLoginSuccessAction
  | UserLoginFailureAction
  | UserLogoutAction
  | UserUpdateProfileAction
  | UserUpdateStatsAction
  | UserSetOnlineStatusAction
  | UserUpdateWalletAction
  | UserSelectCharacterAction
  | UserShowProfileModalAction
  | UserHideProfileModalAction;

// Action Creators
export const userActions = {
  loginStart: (): UserLoginStartAction => ({
    type: USER_LOGIN_START,
  }),

  loginSuccess: (user: User): UserLoginSuccessAction => ({
    type: USER_LOGIN_SUCCESS,
    payload: user,
  }),

  loginFailure: (error: string): UserLoginFailureAction => ({
    type: USER_LOGIN_FAILURE,
    payload: error,
  }),

  logout: (): UserLogoutAction => ({
    type: USER_LOGOUT,
  }),

  updateProfile: (updates: Partial<User>): UserUpdateProfileAction => ({
    type: USER_UPDATE_PROFILE,
    payload: updates,
  }),

  updateStats: (stats: Partial<PlayerStats>): UserUpdateStatsAction => ({
    type: USER_UPDATE_STATS,
    payload: stats,
  }),

  setOnlineStatus: (isOnline: boolean): UserSetOnlineStatusAction => ({
    type: USER_SET_ONLINE_STATUS,
    payload: isOnline,
  }),

  updateWallet: (amount: number): UserUpdateWalletAction => ({
    type: USER_UPDATE_WALLET,
    payload: amount,
  }),

  selectCharacter: (characterId: string | null): UserSelectCharacterAction => ({
    type: USER_SELECT_CHARACTER,
    payload: characterId,
  }),

  // Profile Modal Actions
  showProfileModal: (
    userId: string,
  ): UserShowProfileModalAction => ({
    type: USER_SHOW_PROFILE_MODAL,
    payload: { userId },
  }),
  hideProfileModal: (): UserHideProfileModalAction => ({
    type: USER_HIDE_PROFILE_MODAL,
  }),
};
