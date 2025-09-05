import { User } from "@/types/user";

export interface AppState {
	user: User;
	// state slices on needed for the app
}

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  ProfileModal: {
    isVisible: boolean;
    userId?: string;
    userProfile?: User;
    isLoading: boolean;
  }
}