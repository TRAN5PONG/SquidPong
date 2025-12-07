import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import {
  AbstractMesh,
  DirectionalLight,
  float,
  HemisphericLight,
  ShadowGenerator,
  SpotLight,
} from "@babylonjs/core";

export class Light {
  private shadowGenerator: ShadowGenerator | null = null;
  private spotLight: SpotLight | null = null;
  private ambientLight: HemisphericLight | null = null;

  constructor(scene: Scene) {
    // Ambient light
    this.ambientLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      scene
    );
    this.ambientLight.intensity = 0.2;
    this.ambientLight.groundColor = new Color3(0.3, 0.3, 0.3);
    scene.environmentIntensity = 0;

    const lightPos = new Vector3(0, 20, 0);
    const target = new Vector3(0, 0, 0);
    const direction = target.subtract(lightPos).normalize();

    this.spotLight = new SpotLight(
      "spotMain",
      lightPos,
      direction,
      Math.PI / 4,
      20,
      scene
    );
    this.spotLight.intensity = 2;
    this.spotLight.angle = Math.PI / 2.5;
    this.spotLight.falloffType = SpotLight.FALLOFF_STANDARD;
    this.spotLight.diffuse = new Color3(1, 1, 1);
    this.spotLight.specular = new Color3(1, 1, 1);

    // CRITICAL: Create shadow generator with proper settings
    this.shadowGenerator = new ShadowGenerator(2048, this.spotLight);
    
    // Use PCF (Percentage Closer Filtering) for better shadow quality
    this.shadowGenerator.usePoissonSampling = true; // OR use this for better performance
    // this.shadowGenerator.useBlurExponentialShadowMap = true; // More expensive but softer
    
    this.shadowGenerator.setDarkness(0.5);
    this.shadowGenerator.bias = 0.00001; // Adjust this if you see shadow acne
    
    // IMPORTANT: Enable filtering
    this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
  }

  addShadowCaster(mesh: AbstractMesh) {
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(mesh, true); // true = include children
    }
  }

  setShadowReceiver(mesh: AbstractMesh, receive: boolean = true) {
    mesh.receiveShadows = receive;
  }

  getShadowGenerator() {
    return this.shadowGenerator;
  }

  setDirecionLightIntensity(val: number) {
    // Not used anymore since using SpotLight
  }

  setAambientLightIntensity(val: number) {
    if (this.ambientLight) {
      this.ambientLight.intensity = val;
    }
  }
}