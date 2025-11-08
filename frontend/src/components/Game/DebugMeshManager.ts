import {
  Scene,
  Mesh,
  MeshBuilder,
  Color3,
  StandardMaterial,
  Vector3,
  LinesMesh,
} from "@babylonjs/core";

import { constants } from "@/utils/constants";

export class DebugMeshManager {
  private scene: Scene;

  public paddleMesh!: Mesh;
  private ballMesh!: Mesh;
  private netMesh!: Mesh;
  private groundMesh!: Mesh;
  private tableMesh!: Mesh;
  private physicsDebugSphere!: Mesh;
  private graphicsDebugSphere!: Mesh;
  private targetLines: LinesMesh[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private paddleSize = {
    width: constants.PADDLE.size.width,
    height: constants.PADDLE.size.height,
    depth: constants.PADDLE.size.length,
  };
  private ballDiameter = constants.BALL.diameter;
  private netSize = {
    width: constants.NET.size.width,
    height: constants.NET.size.height,
    depth: constants.NET.size.length,
  };
  private groundSize = {
    width: constants.FLOOR.size.width,
    height: constants.FLOOR.size.height,
    depth: constants.FLOOR.size.length,
  };
  private tableSize = {
    width: constants.TABLE.size.width,
    height: constants.TABLE.size.height,
    depth: constants.TABLE.size.length,
  };

  /** Create all debug meshes (only one paddle now) */
  createMeshes() {
    // Paddle
    if (!this.paddleMesh) {
      this.paddleMesh = MeshBuilder.CreateBox(
        "localPaddle",
        this.paddleSize,
        this.scene,
      );
      this.paddleMesh.material = this.createMaterial(Color3.Green());
    }

    // Ball
    if (!this.ballMesh) {
      this.ballMesh = MeshBuilder.CreateSphere(
        "ball",
        { diameter: this.ballDiameter },
        this.scene,
      );
      this.ballMesh.material = this.createMaterial(Color3.Red());
    }

    // Table
    if (!this.tableMesh) {
      this.tableMesh = MeshBuilder.CreateBox(
        "table",
        this.tableSize,
        this.scene,
      );
      this.tableMesh.material = this.createMaterial(Color3.Blue());
      this.tableMesh.position = new Vector3(
        constants.TABLE.position.x,
        constants.TABLE.position.y,
        constants.TABLE.position.z,
      );
    }

    // Ground
    if (!this.groundMesh) {
      this.groundMesh = MeshBuilder.CreateBox(
        "ground",
        this.groundSize,
        this.scene,
      );
      this.groundMesh.material = this.createMaterial(Color3.Black());
      this.groundMesh.position = new Vector3(
        constants.FLOOR.position.x,
        constants.FLOOR.position.y,
        constants.FLOOR.position.z,
      );
    }

    // Net (optional for visuals)
    if (!this.netMesh) {
      this.netMesh = MeshBuilder.CreateBox("net", this.netSize, this.scene);
      this.netMesh.material = this.createMaterial(Color3.Yellow());
      this.netMesh.position = new Vector3(
        constants.NET.position.x,
        constants.NET.position.y,
        constants.NET.position.z,
      );
    }

    this.createTargetLines();
  }

  updatePaddle(position: Vector3, rotation: Vector3) {
    if (!this.paddleMesh) return;

    this.paddleMesh.position.copyFrom(position);
    this.paddleMesh.rotation.x = rotation.x;
    this.paddleMesh.rotation.y = rotation.y;
    this.paddleMesh.rotation.z = rotation.z;
  }

  updateBall(position: Vector3) {
    if (this.ballMesh) {
      this.ballMesh.position.copyFrom(position);
    }
  }

  updateNetPosition(position: Vector3) {
    if (this.netMesh) {
      this.netMesh.position.copyFrom(position);
    }
  }

  private createMaterial(color: Color3) {
    const mat = new StandardMaterial("debugMat", this.scene);
    mat.diffuseColor = color;
    mat.specularColor = Color3.Black();
    mat.alpha = 0.6;
    return mat;
  }

  clear() {
    this.paddleMesh?.dispose();
    this.ballMesh?.dispose();
    this.netMesh?.dispose();
    this.groundMesh?.dispose();
    this.tableMesh?.dispose();

    this.paddleMesh = undefined!;
    this.ballMesh = undefined!;
    this.netMesh = undefined!;
    this.groundMesh = undefined!;
    this.tableMesh = undefined!;
  }

  createDebugSpheres(): void {
    this.physicsDebugSphere = MeshBuilder.CreateSphere(
      "physicsDebug",
      { diameter: 0.1 },
      this.scene,
    );
    this.physicsDebugSphere.material = this.createMaterial(Color3.Red());

    this.graphicsDebugSphere = MeshBuilder.CreateSphere(
      "graphicsDebug",
      { diameter: 0.1 },
      this.scene,
    );
    this.graphicsDebugSphere.material = this.createMaterial(Color3.Blue());
  }

  updateDebugSpheres(physicsPos: Vector3, graphicsPos: Vector3): void {
    if (this.physicsDebugSphere)
      this.physicsDebugSphere.position.copyFrom(physicsPos);
    if (this.graphicsDebugSphere)
      this.graphicsDebugSphere.position.copyFrom(graphicsPos);
  }

  createTargetLines(): void {
    const tableCenter = constants.TABLE.position.z;
    const tableHalfLength = constants.TABLE.size.length / 2;
    const tableY = constants.TABLE.position.y + constants.TABLE.size.height / 2;

    const lines = [
      {
        points: [
          new Vector3(-1, tableY + 0.01, tableCenter - tableHalfLength + 0.2),
          new Vector3(1, tableY + 0.01, tableCenter - 0.3),
        ],
        color: Color3.Green(),
      },
      {
        points: [
          new Vector3(-1, tableY + 0.01, tableCenter + 0.3),
          new Vector3(1, tableY + 0.01, tableCenter + tableHalfLength - 0.2),
        ],
        color: Color3.Blue(),
      },
    ];

    lines.forEach((lineData, i) => {
      const line = MeshBuilder.CreateLines(
        `targetLine${i}`,
        { points: lineData.points },
        this.scene,
      );
      line.color = lineData.color;
      this.targetLines.push(line);
    });
  }
}
