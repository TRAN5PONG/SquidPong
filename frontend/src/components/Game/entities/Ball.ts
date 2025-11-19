import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh, Vector3 } from "@babylonjs/core";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import * as BABYLON from "@babylonjs/core";

export enum EffectType {
  FIRE = "fire",
  SMOKE = "smoke",
}

interface ParticleConfig {
  color1: Color4;
  color2: Color4;
  colorDead: Color4;
  minSize: number;
  maxSize: number;
  minLifeTime: number;
  maxLifeTime: number;
  emitRate: number;
  minEmitPower: number;
  maxEmitPower: number;
  updateSpeed: number;
  blendMode: number;
}

export class Ball {
  private meshGroup: TransformNode | null = null;
  private readonly scene: Scene;
  mesh!: AbstractMesh;

  // Particle systems
  private fireParticleSystem: ParticleSystem | null = null;
  private smokeParticleSystem: ParticleSystem | null = null;

  // State tracking
  private isFireActive: boolean = false;
  private isSmokeActive: boolean = false;

  // Constants
  private readonly PARTICLE_TEXTURE_URL: string =
    "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png";
  private readonly PARTICLE_COUNT: number = 2000;
  private readonly MODEL_PATH: string = "/models/ball.glb";
  private readonly BALL_SCALE: number = 2;

  // Emission box sizes
  private readonly EMIT_BOX_MIN: Vector3 = new Vector3(-0.05, -0.05, -0.05);
  private readonly EMIT_BOX_MAX: Vector3 = new Vector3(0.05, 0.05, 0.05);
  private readonly DIRECTION_MIN: Vector3 = new Vector3(-0.5, -0.5, -0.5);
  private readonly DIRECTION_MAX: Vector3 = new Vector3(0.5, 0.5, 0.5);

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async Load(): Promise<void> {
    try {
      const container = await LoadAssetContainerAsync(
        this.MODEL_PATH,
        this.scene,
      );
      container.addAllToScene();

      const group = new TransformNode("BallGroup", this.scene);
      container.meshes.forEach((mesh) => {
        if (mesh.name !== "__root__") {
          mesh.parent = group;
          this.mesh = mesh;
        }
      });

      this.meshGroup = group;
      this.mesh.scaling.scaleInPlace(this.BALL_SCALE);
      this.applyTexture();

      // Setup both particle effects
      // this.setupFireEffect();
      this.setupSmokeEffect();

      this.mesh.rotationQuaternion = new BABYLON.Quaternion();

      console.log("Ball loaded with Fire and Smoke effects!");
    } catch (error) {
      console.error("Error loading ball model:", error);
    }
  }

  private applyTexture() {
    if (!this.mesh) return;

    const tex = new Texture("/models/cross.jpg", this.scene);

    const mat = this.mesh.material;

    if (mat && (mat as any).albedoTexture !== undefined) {
      (mat as any).albedoTexture = tex;
    } else if (mat && (mat as any).diffuseTexture !== undefined) {
      (mat as any).diffuseTexture = tex;
    } else {
      // Create new PBR material
      const pbr = new BABYLON.PBRMaterial("ballMat", this.scene);
      pbr.albedoTexture = tex;
      this.mesh.material = pbr;
    }

    console.log("🎨 Texture applied to ball!");
  }
  // ================= Position Management =================
  setMeshPosition(pos: Vector3): void {
    if (this.mesh) this.mesh.position.copyFrom(pos);
  }

  getMeshPosition(): Vector3 {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }

  reset(): void {
    this.setMeshPosition(Vector3.Zero());
    // this.deactivateAllEffects();
  }

  // ================= Particle Effect Setup =================
  private setupFireEffect(): void {
    if (!this.mesh) return;

    const fireConfig: ParticleConfig = {
      color1: new Color4(0.6, 0.1, 0, 1.0), // Dark red
      color2: new Color4(0.4, 0.05, 0, 1.0), // Darker red
      colorDead: new Color4(0.1, 0, 0, 0.0), // Very dark red fade
      minSize: 0.001,
      maxSize: 0.5,
      minLifeTime: 0.1,
      maxLifeTime: 0.25,
      emitRate: 1500,
      minEmitPower: 0.5,
      maxEmitPower: 1.5,
      updateSpeed: 0.005,
      blendMode: ParticleSystem.BLENDMODE_ONEONE, // Additive for bright fire
    };

    this.fireParticleSystem = this.createParticleSystem("ballFire", fireConfig);
    console.log("Fire effect setup complete!");
  }

  private setupSmokeEffect(): void {
    if (!this.mesh) return;

    const smokeConfig: ParticleConfig = {
      color1: new Color4(0.1, 0.1, 0.1, 1.0), // Dark gray
      color2: new Color4(0.05, 0.05, 0.05, 1.0), // Almost black
      colorDead: new Color4(0, 0, 0, 0.0), // Black fade
      minSize: 0.1,
      maxSize: 0.2,
      minLifeTime: 0.1,
      maxLifeTime: 0.25,
      emitRate: 1500,
      minEmitPower: 0.8,
      maxEmitPower: 1.5,
      updateSpeed: 0.002,
      blendMode: ParticleSystem.BLENDMODE_ONEONE, // Standard blend for smoke
    };

    this.smokeParticleSystem = this.createParticleSystem(
      "ballSmoke",
      smokeConfig,
    );
    console.log("Smoke effect setup complete!");
  }

  private createParticleSystem(
    name: string,
    config: ParticleConfig,
  ): ParticleSystem {
    const particleSystem = new ParticleSystem(
      name,
      this.PARTICLE_COUNT,
      this.scene,
    );

    // Texture
    particleSystem.particleTexture = new Texture(
      this.PARTICLE_TEXTURE_URL,
      this.scene,
    );

    // Emitter
    particleSystem.emitter = this.mesh;
    particleSystem.minEmitBox = this.EMIT_BOX_MIN.clone();
    particleSystem.maxEmitBox = this.EMIT_BOX_MAX.clone();

    // Colors
    particleSystem.color1 = config.color1;
    particleSystem.color2 = config.color2;
    particleSystem.colorDead = config.colorDead;

    // Size
    particleSystem.minSize = config.minSize;
    particleSystem.maxSize = config.maxSize;

    // Lifetime
    particleSystem.minLifeTime = config.minLifeTime;
    particleSystem.maxLifeTime = config.maxLifeTime;

    // Emission
    particleSystem.emitRate = config.emitRate;
    particleSystem.minEmitPower = config.minEmitPower;
    particleSystem.maxEmitPower = config.maxEmitPower;
    particleSystem.updateSpeed = config.updateSpeed;

    // Blend mode
    particleSystem.blendMode = config.blendMode;

    // No gravity - follow the ball
    particleSystem.gravity = Vector3.Zero();

    // Minimal direction spread
    particleSystem.direction1 = this.DIRECTION_MIN.clone();
    particleSystem.direction2 = this.DIRECTION_MAX.clone();

    return particleSystem;
  }

  // ================= Fire Effect Control =================
  public activateFireEffect(): void {
    if (this.fireParticleSystem && !this.isFireActive) {
      this.fireParticleSystem.start();
      this.isFireActive = true;
      console.log("🔥 Fire effect activated!");
    }
  }

  public deactivateFireEffect(): void {
    if (this.fireParticleSystem && this.isFireActive) {
      this.fireParticleSystem.stop();
      this.isFireActive = false;
      console.log("Fire effect deactivated.");
    }
  }

  // ================= Smoke Effect Control =================
  public activateSmokeEffect(): void {
    if (this.smokeParticleSystem && !this.isSmokeActive) {
      this.smokeParticleSystem.start();
      this.isSmokeActive = true;
      console.log("💨 Smoke effect activated!");
    }
  }

  public deactivateSmokeEffect(): void {
    if (this.smokeParticleSystem && this.isSmokeActive) {
      this.smokeParticleSystem.stop();
      this.isSmokeActive = false;
      console.log("Smoke effect deactivated.");
    }
  }

  // ================= Combined Effect Control =================
  public activateEffect(type: EffectType): void {
    switch (type) {
      case EffectType.FIRE:
        this.activateFireEffect();
        break;
      case EffectType.SMOKE:
        this.activateSmokeEffect();
        break;
    }
  }

  // public deactivateEffect(type: EffectType): void {
  //   switch (type) {
  //     case EffectType.FIRE:
  //       this.deactivateFireEffect();
  //       break;
  //     case EffectType.SMOKE:
  //       this.deactivateSmokeEffect();
  //       break;
  //   }
  // }
  //
  public deactivateAllEffects(): void {
    this.deactivateFireEffect();
    this.deactivateSmokeEffect();
  }

  // ================= State Getters =================
  public isEffectActive(type: EffectType): boolean {
    switch (type) {
      case EffectType.FIRE:
        return this.isFireActive;
      case EffectType.SMOKE:
        return this.isSmokeActive;
      default:
        return false;
    }
  }

  public getActiveEffects(): EffectType[] {
    const activeEffects: EffectType[] = [];
    if (this.isFireActive) activeEffects.push(EffectType.FIRE);
    if (this.isSmokeActive) activeEffects.push(EffectType.SMOKE);
    return activeEffects;
  }

  // ================= Cleanup =================
  public dispose(): void {
    this.deactivateAllEffects();

    if (this.fireParticleSystem) {
      this.fireParticleSystem.dispose();
      this.fireParticleSystem = null;
    }

    if (this.smokeParticleSystem) {
      this.smokeParticleSystem.dispose();
      this.smokeParticleSystem = null;
    }

    if (this.meshGroup) {
      this.meshGroup.dispose();
      this.meshGroup = null;
    }
  }
}
