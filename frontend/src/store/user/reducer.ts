import {
  USER_SHOW_PROFILE_MODAL,
  USER_HIDE_PROFILE_MODAL,
  USER_LOGIN_START,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAILURE,
  USER_LOGOUT,
  USER_UPDATE_PROFILE,
  USER_UPDATE_STATS,
  USER_SET_ONLINE_STATUS,
  USER_UPDATE_WALLET,
  USER_SELECT_CHARACTER,
  UserAction,
} from "./actions";
import { UserState } from "./types";

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  // Profile modal state
  ProfileModal: {
    isVisible: false,
    userId: undefined,
    userProfile: undefined,
    isLoading: false,
  },
};

export function userReducer(
  state: UserState = initialState,
  action: UserAction
): UserState {
  switch (action.type) {
    case USER_LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case USER_LOGIN_SUCCESS:
      return {
        ...state,
        currentUser: action.payload,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      };
    case USER_LOGIN_FAILURE:
      return {
        ...state,
        currentUser: null,
        isLoading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case USER_LOGOUT:
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        error: null,
      };
    case USER_UPDATE_PROFILE:
      if (!state.currentUser) return state;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          ...action.payload,
          updatedAt: new Date(),
        },
      };
    case USER_UPDATE_STATS:
      if (!state.currentUser) return state;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          playerStats: {
            ...state.currentUser.playerStats,
            ...action.payload,
          },
        },
      };
    case USER_SET_ONLINE_STATUS:
      if (!state.currentUser) return state;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          status: action.payload ? "online" : "offline",
          lastSeen: action.payload ? state.currentUser.lastSeen : new Date(),
        },
      };
    case USER_UPDATE_WALLET:
      if (!state.currentUser) return state;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          walletBalance: action.payload,
        },
      };
    case USER_SELECT_CHARACTER:
      if (!state.currentUser) return state;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          playerSelectedCharacter: action.payload,
        },
      };

    case USER_SHOW_PROFILE_MODAL:
      return {
        ...state,
        ProfileModal: {
          isVisible: true,
          userId: action.payload.userId,
          isLoading: false,
        },
      };
    case USER_HIDE_PROFILE_MODAL:
      return {
        ...state,
        ProfileModal: {
          isVisible: false,
          userId: undefined,
          isLoading: false,
        },
      };

    default:
      return state;
  }
}
