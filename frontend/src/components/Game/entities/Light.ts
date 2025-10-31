import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { HemisphericLight, SpotLight } from "@babylonjs/core";

export class Light {
  constructor(scene: Scene) {
    const light = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1.0;
  }
}
