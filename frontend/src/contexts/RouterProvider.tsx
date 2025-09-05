import {
  useEffect,
  useState,
  useContext,
  createContext,
  ZeroactElement,
} from "@/lib/Zeroact";
import { scheduleUpdate } from "@/lib/Zeroact/core/fiber";

// Types
export interface Route {
  path: string;
  component: FunctionComponent;
  exact?: boolean;
  showLoader: boolean;
}
interface RouterContextValue {
  currentPath: string;
  navigate: (path: string) => void;
}
interface RouterProps {
  routes: Route[];
  children?: any;
}

export const RouterContext = createContext<RouterContextValue>({
  currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
  navigate: () => {},
});
export function BrowserRouter({
  routes,
  children,
}: RouterProps): ZeroactElement | null {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    scheduleUpdate();
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      scheduleUpdate();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return RouterContext.Provider({
    value: { currentPath, navigate },
    children,
  });
}
export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}
