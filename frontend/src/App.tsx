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
  { path: "/spectate", component: Spectate, exact: true, showLoader: true },
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
  const { modal, setUser } = useAppContext();

  useEffect(() => {
    // setUser(db.users[0]);
    const initializeAuth = async () => {
      try {
        const userData = await getUserProfile();
        // console.log("User data:", userData);
        setUser(userData.data!);
      } catch (error) {
        console.log("No valid session found");
      }
    };
    socketManager.connect("ws://10.13.2.6:4000/chat-notification");

    initializeAuth();
  }, []);

  return (
    <StyledApp>
      <ToastContainer />
      <Navbar />
      <ChatContainer conversationsIds={["1"]} />
      <GameMenu />
      <RouterSwitch routes={routes} />

      {modal.modalState.show && (
        <ConfirmationModal
          show={modal.modalState.show}
          message={modal.modalState.message}
          title={modal.modalState.title}
          onConfirm={modal.handleModalConfirm}
          onClose={modal.handleModalClose}
        />
      )}
    </StyledApp>
  );
};

export default App;
