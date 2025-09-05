import Zeroact from "./lib/Zeroact";
import App, { routes } from "./App";
import { BrowserRouter } from "@/contexts/RouterProvider";
import { SoundProvider } from "./contexts/SoundProvider";
import { AppProvider } from "./contexts/AppProviders";


const Root = () => ({
  type: BrowserRouter,
  props: {
    routes,
    children: [
      {
        type: AppProvider,
        props: {
          children: [
            {
              type: SoundProvider,
              props: {
                children: [{ type: App, props: {} }],
              },
            },
          ],
        },
      },
    ],
  },
});

Zeroact.render(Root(), document.getElementById("app")!);
