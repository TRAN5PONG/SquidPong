import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import {
  AbstractMesh,
  DirectionalLight,
  HemisphericLight,
  ShadowGenerator,
  SpotLight,
} from "@babylonjs/core";

export class Light {
  private shadowGenerator: ShadowGenerator | null = null;
  private directionalLight: DirectionalLight | null = null;

  constructor(scene: Scene) {
    // Ambient light
    const ambientLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.2;
    ambientLight.groundColor = new Color3(0.3, 0.3, 0.3);

    // Directional light
    this.directionalLight = new DirectionalLight(
      "mainLight",
      new Vector3(-1, -2, -1), // Direction pointing down and to the side
      scene
    );

    this.directionalLight.position = new Vector3(0, 20, 0);  // Position for shadow calculation
    this.directionalLight.intensity = 0.8;
    this.directionalLight.diffuse = new Color3(1, 0.95, 0.9); // Warm white light
    this.directionalLight.specular = new Color3(0.3, 0.3, 0.3); // Subtle specular highlights

    // Create shadow generator
    this.shadowGenerator = new ShadowGenerator(2048, this.directionalLight);
    // Shadow quality settings for realistic look
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.useKernelBlur = true;
    this.shadowGenerator.blurKernel = 64; // Higher = softer shadows
    this.shadowGenerator.darkness = 0.5; // Shadow opacity (0-1)
    // Optional: Better shadow quality
    this.shadowGenerator.bias = 0.00001;
    this.shadowGenerator.setDarkness(0.6);
  }

  // Add method to control which meshes cast/receive shadows
  addShadowCaster(mesh: AbstractMesh) {
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(mesh);
    }
  }
  setShadowReceiver(mesh: AbstractMesh, receive: boolean = true) {
    mesh.receiveShadows = receive;
  }
}
