import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { HemisphericLight, SpotLight } from "@babylonjs/core";

export function useLight(scene: Scene) {
  useEffect(() => {
    if (!scene) return;

    const light = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1.0;

    return () => {
      // light.dispose();
    };
  }, [scene]);
}
