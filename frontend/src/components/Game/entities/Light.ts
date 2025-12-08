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
  private directionalLightShadowGenerator: ShadowGenerator | null = null;
  /**
   * Lights
   */
  private spotLight: SpotLight | null = null;
  private ambientLight: HemisphericLight | null = null;
  private directionalLight: DirectionalLight | null = null;

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

    const lightPos = new Vector3(0, 25, 0);
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
    this.spotLight.angle = Math.PI / 2;
    this.spotLight.falloffType = SpotLight.FALLOFF_STANDARD;
    this.spotLight.diffuse = new Color3(1, 1, 1);
    this.spotLight.specular = new Color3(1, 1, 1);

    this.directionalLight = new DirectionalLight(
      "dirLight",
      new Vector3(1, -0.9, 0.3).normalize(),
      scene
    );

    this.directionalLight.position = new Vector3(1, 10, 0);
    this.directionalLight.intensity = 1.2;

    // ============================================
    // IMPROVED SHADOW SETTINGS FOR SMOOTHNESS
    // ============================================
    this.directionalLightShadowGenerator = new ShadowGenerator(
      2048, // Increased from 2048 for better quality
      this.directionalLight
    );

    // OPTION 1: PCF with Poisson Sampling (Good balance)
    this.directionalLightShadowGenerator.usePoissonSampling = true;

    // OPTION 2: Blur Exponential Shadow Map (Smoother but more expensive)
    // Uncomment this block and comment out usePoissonSampling above:
    // this.directionalLightShadowGenerator.useBlurExponentialShadowMap = true;
    // this.directionalLightShadowGenerator.useKernelBlur = true;
    // this.directionalLightShadowGenerator.blurKernel = 64; // Higher = smoother
    // this.directionalLightShadowGenerator.blurScale = 2;

    // OPTION 3: Contact Hardening Shadow (Most realistic, varies softness by distance)
    // Uncomment this block and comment out usePoissonSampling above:
    // this.directionalLightShadowGenerator.useContactHardeningShadow = true;
    // this.directionalLightShadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
    // this.directionalLightShadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

    // OPTION 4: Percentage Closer Soft Shadows (PCSS) - Best quality
    // Uncomment this block and comment out usePoissonSampling above:
    // this.directionalLightShadowGenerator.usePercentageCloserFiltering = true;
    // this.directionalLightShadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

    // Core settings
    this.directionalLightShadowGenerator.setDarkness(0.3); // Lighter shadows
    this.directionalLightShadowGenerator.bias = 0.00005; // Slightly increased to reduce acne

    // Improve filtering quality
    this.directionalLightShadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

    // Enable frustum edge falloff for smoother edges at shadow boundaries
    this.directionalLightShadowGenerator.frustumEdgeFalloff = 1.0;

    // Set normal bias to reduce shadow acne on slopes
    this.directionalLightShadowGenerator.normalBias = 0.02;

    // Optional: Control shadow fade distance
    this.directionalLight.shadowMinZ = 1;
    this.directionalLight.shadowMaxZ = 100;

    // Optional: Increase shadow frustum size if shadows are cut off
    // this.directionalLight.autoUpdateExtends = false;
    // this.directionalLight.orthoLeft = -20;
    // this.directionalLight.orthoRight = 20;
    // this.directionalLight.orthoTop = 20;
    // this.directionalLight.orthoBottom = -20;
  }

  addShadowCaster(mesh: AbstractMesh) {
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(mesh, true);
    }
    if (this.directionalLightShadowGenerator) {
      this.directionalLightShadowGenerator.addShadowCaster(mesh, true);
    }
  }

  setShadowReceiver(mesh: AbstractMesh, receive: boolean = true) {
    mesh.receiveShadows = receive;
  }

  getShadowGenerator() {
    return this.shadowGenerator;
  }

  getDirectionalLightShadowGenerator() {
    return this.directionalLightShadowGenerator;
  }

  setDirecionLightIntensity(val: number) {
    if (this.directionalLight) {
      this.directionalLight.intensity = val;
    }
  }

  setAambientLightIntensity(val: number) {
    if (this.ambientLight) {
      this.ambientLight.intensity = val;
    }
  }

  dispose() {
    if (this.directionalLightShadowGenerator) {
      this.directionalLightShadowGenerator.dispose();
      this.directionalLightShadowGenerator = null;
    }

    if (this.shadowGenerator) {
      this.shadowGenerator.dispose();
      this.shadowGenerator = null;
    }

    if (this.spotLight) {
      this.spotLight.dispose();
      this.spotLight = null;
    }

    if (this.directionalLight) {
      this.directionalLight.dispose();
      this.directionalLight = null;
    }

    if (this.ambientLight) {
      this.ambientLight.dispose();
      this.ambientLight = null;
    }
  }

}

/*
==============================================
SHADOW QUALITY COMPARISON GUIDE
==============================================

1. POISSON SAMPLING (Default, Good Performance)
   - Best for: Games, real-time applications
   - Quality: Good
   - Performance: Fast
   - Edge Smoothness: Moderate

2. BLUR EXPONENTIAL (Smoothest)
   - Best for: Cinematic scenes, when performance isn't critical
   - Quality: Excellent
   - Performance: Slow
   - Edge Smoothness: Very high
   - Settings to tweak: blurKernel (32-128), blurScale (1-4)

3. PCF (Percentage Closer Filtering)
   - Best for: Good balance of quality and performance
   - Quality: Very Good
   - Performance: Moderate
   - Edge Smoothness: High

4. CONTACT HARDENING SHADOW
   - Best for: Realistic shadows that vary by distance
   - Quality: Excellent (realistic)
   - Performance: Moderate
   - Edge Smoothness: Varies (closer = sharper, farther = softer)

5. SHADOW MAP SIZE
   - 1024: Low quality, fast
   - 2048: Good quality, balanced (your current)
   - 4096: High quality, slower
   - 8192: Ultra quality, very slow

==============================================
FIXING COMMON SHADOW ISSUES
==============================================

1. SHADOW ACNE (Stripey patterns):
   - Increase bias: 0.00001 → 0.0001
   - Increase normalBias: 0 → 0.02
   - Check mesh face orientation

2. PETER PANNING (Shadows detached from objects):
   - Decrease bias
   - Decrease normalBias

3. JAGGED EDGES:
   - Increase shadow map size (2048 → 4096)
   - Use better filtering (PCF or blur)
   - Increase blurKernel (if using blur)

4. SHADOW CUT OFF:
   - Increase orthoLeft/Right/Top/Bottom
   - Set autoUpdateExtends = true

5. WEIRD SHAPES:
   - Ensure mesh normals are correct
   - Check if mesh is receiving shadows (receiveShadows = true)
   - Verify light direction and position
*/