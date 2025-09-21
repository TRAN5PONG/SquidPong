import { ToastEl } from "@/components/Toast/Toast";
import { useSocket } from "@/hooks/useSocket";
import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { createContext, useState, ZeroactNode } from "@/lib/Zeroact";
import { Match } from "@/types/game/game";
import { User, UserPreferences } from "@/types/user";

type ModalState = {
  show: boolean;
  title?: string;
  message: string;
  resolve: ((value: boolean) => void) | null;
};
type userData = {
  user: User | null;
  setUser: (user: User | null) => void;
  preferences: UserPreferences | null;
  setPreferences: (preferences: UserPreferences | null) => void;
  chat: {
    activeConversations: string[] | null;
    setActiveConversations: (conversations: string[] | null) => void;
  };
  toasts: {
    toastsQueue: ToastEl[];
    addToastToQueue: (toast: ToastEl) => void;
  };
  modal: {
    showConfirmationModal: (
      message: string,
      title?: string
    ) => Promise<boolean>;
    modalState: ModalState; // Expose the state
    handleModalConfirm: () => void; // Expose handlers
    handleModalClose: () => void;
  };
  // current match logic
  match: {
    currentMatch: Match | null;
    setCurrentMatch: (
      value: Match | null | ((prev: Match | null) => Match | null)
    ) => void;
  };
};
const AppContext = createContext<userData | null>(null);

export function AppProvider({ children }: { children: ZeroactNode[] }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [activeConversations, setActiveConversations] = useState<
    string[] | null
  >(null);
  // Toasts management
  const [toastsQueue, setToastsQueue] = useState<ToastEl[]>([]);
  const addToastToQueue = (toast: ToastEl) => {
    const key = Date.now() + Math.random();
    const toastWithKey = { ...toast, key };

    setToastsQueue((prevToasts) => [...prevToasts, toastWithKey]);

    setTimeout(
      () => {
        setToastsQueue((prevToasts) => prevToasts.filter((t) => t.key !== key));
      },
      toast.duration ? toast.duration + 700 : 3200
    );
  };
  // current match logic
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  // Modal management
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    title: undefined,
    message: "",
    resolve: null,
  });
  const showConfirmationModal = (message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        resolve,
      });
    });
  };
  const handleModalConfirm = () => {
    modalState.resolve?.(true);
    setModalState((prev) => ({ ...prev, show: false, resolve: null }));
  };
  const handleModalClose = () => {
    modalState.resolve?.(false);
    setModalState((prev) => ({ ...prev, show: false, resolve: null }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        preferences,
        setPreferences,
        toasts: {
          toastsQueue,
          addToastToQueue,
        },
        chat: {
          activeConversations,
          setActiveConversations,
        },
        modal: {
          showConfirmationModal,
          modalState, // Expose the state
          handleModalConfirm, // Expose the handlers
          handleModalClose,
        },
        match: {
          currentMatch,
          setCurrentMatch,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = Zeroact.useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};
