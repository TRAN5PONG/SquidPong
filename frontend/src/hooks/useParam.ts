import { useContext} from "@/lib/Zeroact";
import { RouterContext } from "@/contexts/RouterProvider";

export function useRouteParam(pattern: string, paramName: string): string | undefined {
  const { currentPath } = useContext(RouterContext);

  const paramNames: any[] = [];
  const regexPath = pattern.replace(/:([^/]+)/g, (_, key) => {
    paramNames.push(key);
    return "([^/]+)";
  });

  const regex = new RegExp(`^${regexPath}$`);
  const match = currentPath.match(regex);
  if (!match) return undefined;

  const params = Object.fromEntries(
    paramNames.map((name, index) => [name, match[index + 1]])
  );

  return params[paramName];
}

