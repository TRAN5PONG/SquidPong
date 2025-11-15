import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh, Vector3 } from "@babylonjs/core";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color4 } from "@babylonjs/core/Maths/math.color";
export class Ball {
  private meshGroup: TransformNode | null = null;
  private readonly scene: Scene;
  mesh!: AbstractMesh;
  private particleSystem: ParticleSystem | null = null;
  private particleSystem: ParticleSystem | null = null;
  private isFireActive: boolean = false; // ADD THIS
  constructor(scene: Scene) {
    this.scene = scene;
  }

  async Load(): Promise<void> {
    try {
      const container = await LoadAssetContainerAsync(
        "/models/ball.glb",
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

      this.setupFireEffect();
      // this.activateFireEffect();
      this.mesh.scaling.scaleInPlace(2);
    } catch (error) {
      console.error("Error loading ball model:", error);
    }
  }

  setMeshPosition(pos: Vector3): void {
    if (this.mesh) this.mesh.position.copyFrom(pos);
  }

  getMeshPosition(): Vector3 {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }

  reset(): void {
    this.setMeshPosition(Vector3.Zero());
  }

  setupFireEffect(): void {
    if (!this.mesh) return;

    // Create particle system
    this.particleSystem = new ParticleSystem("ballFire", 2000, this.scene);

    // Texture
    this.particleSystem.particleTexture = new Texture(
      "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png",
      this.scene,
    );

    // Emit from the ball - SMALLER emission area so particles stay close
    this.particleSystem.emitter = this.mesh;
    this.particleSystem.minEmitBox = new Vector3(-0.03, -0.03, -0.03);
    this.particleSystem.maxEmitBox = new Vector3(0.03, 0.03, 0.03);

    // FIRE COLORS - Red/Orange/Yellow gradient
    // this.particleSystem.color1 = new Color4(1, 0.2, 0, 1.0); // Bright red-orange
    // this.particleSystem.color2 = new Color4(1, 0.6, 0, 1.0); // Orange
    // this.particleSystem.colorDead = new Color4(0.1, 0.1, 0.1, 0.0); // Dark fade

    // VERY DARK FIRE - Almost black with red glow
    // this.particleSystem.color1 = new Color4(0.4, 0.05, 0, 1.0); // Dark crimson
    // this.particleSystem.color2 = new Color4(0.2, 0.02, 0, 1.0); // Very dark red
    // this.particleSystem.colorDead = new Color4(0.05, 0, 0, 0.0); // Nearly black

    // DARK FIRE COLORS - Dark red/orange flames
    // this.particleSystem.color1 = new Color4(0.6, 0.1, 0, 1.0); // Dark red
    // this.particleSystem.color2 = new Color4(0.4, 0.05, 0, 1.0); // Darker red
    // this.particleSystem.colorDead = new Color4(0.1, 0, 0, 0.0); // Very dark red fade

    // SMOKE COLORS for sample shot
    this.particleSystem.color1 = new Color4(0.1, 0.1, 0.1, 1.0); // Dark gray
    this.particleSystem.color2 = new Color4(0.05, 0.05, 0.05, 1.0); // Almost black
    this.particleSystem.colorDead = new Color4(0, 0, 0, 0.0); // Black fade

    // Smaller particles that stay close
    this.particleSystem.minSize = 0.1;
    this.particleSystem.maxSize = 0.2;

    // Shorter lifetime so particles don't spread far
    this.particleSystem.minLifeTime = 0.1;
    this.particleSystem.maxLifeTime = 0.25;

    // Higher emission rate for dense fire
    this.particleSystem.emitRate = 1500;

    // Additive blend for bright fire
    this.particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

    // LOW speed so particles stay attached to ball
    this.particleSystem.minEmitPower = 0.8;
    this.particleSystem.maxEmitPower = 1.5;
    this.particleSystem.updateSpeed = 0.002;

    // NO gravity - we want fire to follow the ball
    this.particleSystem.gravity = new Vector3(0, 0, 0);

    // MINIMAL direction spread - particles stay very close
    this.particleSystem.direction1 = new Vector3(-0.5, -0.5, -0.5);
    this.particleSystem.direction2 = new Vector3(0.5, 0.5, 0.5);

    this.isFireActive = false;

    console.log("Fire effect setup complete!");
  }

  activateFireEffect(): void {
    if (this.particleSystem && !this.isFireActive) {
      this.particleSystem.start();
      this.isFireActive = true;
    }
  }

  deactivateFireEffect(): void {
    if (this.particleSystem && this.isFireActive) {
      this.particleSystem.stop();
      this.isFireActive = false;
    }
  }
}
