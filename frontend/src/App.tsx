import Zeroact, {
  useContext,
  useEffect,
  useRef,
  useState,
  ZeroactElement,
} from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import "@babylonjs/loaders/glTF";
// Styles
import "./style.css";

// Components
import Navbar from "@/components/Navbar/Navbar";
import { ChatContainer } from "@/components/Chat/Chat";
import { db } from "./db";
import Home from "./components/Home/Home";
import Tournament from "./components/Tournament/Tournament";
import SelectCharacter from "./components/SelectCharacter/SelectCharacter";
import Toast, { ToastContainer } from "./components/Toast/Toast";

// Redux
import { store } from "@/store";
import { userActions } from "./store/user/actions";
import { useSelector } from "./hooks/useSelector";
import SkeletonText from "./components/Skeleton/Skeleton";
import CountDown from "./components/Game/Elements/CountDown";
import Loader, { LoaderSpinner } from "./components/Loader/Loader";
import ScoreBoard from "./components/Game/Elements/ScoreBoard";
import { useSound } from "./hooks/useSound";
import Lobby from "./components/Lobby/Lobby";
import SelectPaddle from "./components/SelectPaddle/SelectPaddle";
import Profile from "./components/Profile/Profile";
import { Route, RouterContext } from "@/contexts/RouterProvider";
import NotFound from "./components/NotFound/NotFound";
import Tournaments from "./components/Tournament/Tournaments";
import Spectate from "./components/Spectate/Spectate";
import Settings from "./components/Settings/Settings";
import Leaderboard from "./components/Leaderboard/Leaderboard";
import { useAppContext } from "./contexts/AppProviders";
import GameMenu from "./components/GameMenu/GameMenu";
import Badges from "./components/Badges/Badges";
import ConfirmationModal from "./components/ConfirmationModal/ConfirmationModal";
import { getUserProfile } from "./api/user";
import { socketManager } from "./utils/socket";
import GameContiner from "./components/Game/GameContainer";
import { InviteOponent } from "./components/Lobby/InvitationModal";
import { Match, MatchPlayer } from "./types/game/game";
import { useSounds } from "./contexts/SoundProvider";

const StyledApp = styled("div")`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  .route-container {
    width: 100%;
    height: 100%;
    display: flex;
  }
`;
export const routes: Route[] = [
  { path: "/", component: Home, exact: true, showLoader: false },
  { path: "/lobby", component: Lobby, exact: true, showLoader: true },
  { path: "/user", component: Profile, exact: false, showLoader: false },
  { path: "/badges", component: Badges, exact: true, showLoader: true },
  {
    path: "/select-character",
    component: SelectCharacter,
    exact: true,
    showLoader: true,
  },
  { path: "/game", component: GameContiner, exact: false, showLoader: true },
  {
    path: "/select-paddle",
    component: SelectPaddle,
    exact: true,
    showLoader: true,
  },
  {
    path: "/tournament",
    component: Tournament,
    exact: false,
    showLoader: true,
  },
  {
    path: "/tournaments",
    component: Tournaments,
    exact: true,
    showLoader: false,
  },
  { path: "/spectate", component: Spectate, exact: false, showLoader: true },
  { path: "/settings", component: Settings, exact: false, showLoader: false },
  {
    path: "/leaderboard",
    component: Leaderboard,
    exact: true,
    showLoader: true,
  },
];

function RouterSwitch({ routes }: { routes: Route[] }) {
  const { currentPath } = useContext(RouterContext);
  const previousPath = useRef(currentPath);

  const findMatchingRoute = (path: string) => {
    for (const route of routes) {
      const isMatch = route.exact
        ? path === route.path
        : path === route.path || path.startsWith(route.path + "/");

      if (isMatch) {
        return route;
      }
    }
    return null;
  };

  // Stats
  const [delayedRoute, setdelayedRoute] = useState<Route | null>(
    findMatchingRoute(currentPath)
  );
  const [showLoader, setShowLoader] = useState<boolean>(false);

  useEffect(() => {
    if (previousPath.current !== currentPath) {
      const nextRoute = findMatchingRoute(currentPath);

      if (nextRoute?.showLoader) {
        setShowLoader(true);
        setTimeout(() => {
          setdelayedRoute(nextRoute);
          setShowLoader(false);
        }, 2000);
      } else {
        // instantly switch route, no loader
        setdelayedRoute(nextRoute);
      }

      previousPath.current = currentPath;
    }
  }, [currentPath]);

  const RouteComponent = delayedRoute?.component || NotFound;

  return (
    <div className="route-container">
      <Loader show={showLoader} onFinish={() => {}} nextRoute={currentPath} />
      <RouteComponent />
    </div>
  );
}

const App = () => {
  const { modal, setUser, user, inviteModal, toasts, match } = useAppContext();
  const { errorSound, notificationSound } = useSounds();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await getUserProfile();
        if (userData.success && userData.data) setUser(userData.data);
        else throw new Error("No valid session");
      } catch (error) {
        console.log("No valid session found");
      }
    };
    if (!user) initializeAuth();

    if (!socketManager.isConntected()) {
      socketManager.connect(`${import.meta.env.VITE_IP}`);
    } else {
      console.log("Socket already connected.");
    }
  }, []);

  /**
   * Socket listeners for game invitations and match updates
   */
  useEffect(() => {
    // Listen for game invitations
    const handleInvite = (data: any) => {
      if (data.invitation) {
        inviteModal.setSelectedInvitation(data.invitation);
      }
      if (data.match) {
        match.setCurrentMatch(data.match);
        return inviteModal.setIsInviteModalOpen(false);
      }
      inviteModal.setIsInviteModalOpen(true);
    };
    const handleError = (data: any) => {
      if (data.message) {
        errorSound.play();
        toasts.addToastToQueue({
          type: "error",
          message: data.message,
        });
      }
    };

    socketManager.subscribe("game-invitation", handleInvite);
    socketManager.subscribe("match-error", handleError);
    return () => {
      socketManager.unsubscribe("game-invitation", handleInvite);
      socketManager.unsubscribe("match-error", handleError);
    };
  }, []);

  return (
    <StyledApp>
      <ToastContainer />
      <Navbar />
      <ChatContainer />
      <GameMenu />
      <RouterSwitch routes={routes} />

      {modal.modalState.show ? (
        <ConfirmationModal
          show={modal.modalState.show}
          message={modal.modalState.message}
          title={modal.modalState.title}
          onConfirm={modal.handleModalConfirm}
          onClose={modal.handleModalClose}
        />
      ) : (
        ""
      )}
      {inviteModal.isInviteModalOpen && (
        <InviteOponent
          onClose={inviteModal.onCloseInviteModal}
          GameSettings={inviteModal.GameSettings}
          selectedInvitation={inviteModal.selectedInvitation}
          setSelectedInvitation={inviteModal.setSelectedInvitation}
          setSelectedMatch={match.setCurrentMatch}
          setSelectedMode={inviteModal.setSelectedMode}
          selectedOpponent={inviteModal.selectedOpponent}
          setSelectedOpponent={inviteModal.setSelectedOpponent}
        />
      )}
    </StyledApp>
  );
};

export default App;
