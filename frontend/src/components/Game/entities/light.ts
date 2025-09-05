import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math";

export function useLight(scene: Scene) {
  useEffect(() => {
    if (!scene) return;

    const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    return () => {
      light.dispose();
    };
  }, [scene]);
}