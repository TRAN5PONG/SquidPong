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

  private paddles: Map<string, Mesh> = new Map();
  private ballMesh!: Mesh;
  private netMesh!: Mesh;
  private groundMesh!: Mesh;
  private tableMesh!: Mesh;
  private physicsDebugSphere!: Mesh;
  private graphicsDebugSphere!: Mesh;
  private sessionId: string = "";
  private targetLines: LinesMesh[] = [];

  setSessionId(id: string) {
    this.sessionId = id;
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

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createMeshes(playerIds: string[]) {
    // Paddles
    playerIds.forEach((id) => {
      if (!this.paddles.has(id)) {

        const isMe = id === this.sessionId;
        const paddle = MeshBuilder.CreateBox(id, this.paddleSize, this.scene);
        const color = isMe ? Color3.Green() : Color3.Red();

        paddle.material = this.createMaterial(color);
        this.paddles.set(id, paddle);
      }
    });

    // Ball
    if (!this.ballMesh) {
      this.ballMesh = MeshBuilder.CreateSphere(
        "ball",
        { diameter: this.ballDiameter},
        this.scene,
      );
      this.ballMesh.material = this.createMaterial(Color3.Red());
    }

    // Net
    // if (!this.netMesh) {
    //   this.netMesh = MeshBuilder.CreateBox("net", this.netSize, this.scene);
    //   this.netMesh.material = this.createMaterial(Color3.Red());
    //   this.netMesh.position = new Vector3(
    //     constants.NET.position.x,
    //     constants.NET.position.y,
    //     constants.NET.position.z,
    //   );

    //   // At the end of createMeshes()
    //   this.createTargetLines();
    // }

    // // Table
    // if (!this.tableMesh) {
    //   this.tableMesh = MeshBuilder.CreateBox(
    //     "table",
    //     this.tableSize,
    //     this.scene,
    //   );
    //   this.tableMesh.material = this.createMaterial(Color3.Blue());
    //   this.tableMesh.position = new Vector3(
    //     constants.TABLE.position.x,
    //     constants.TABLE.position.y,
    //     constants.TABLE.position.z,
    //   );
    // }

    // // Ground
    // if (!this.groundMesh) {
    //   this.groundMesh = MeshBuilder.CreateBox(
    //     "ground",
    //     this.groundSize,
    //     this.scene,
    //   );
    //   this.groundMesh.material = this.createMaterial(Color3.Black());
    //   this.groundMesh.position = new Vector3(
    //     constants.FLOOR.position.x,
    //     constants.FLOOR.position.y,
    //     constants.FLOOR.position.z,
    //   );
    // }
  }

  updatePaddle(id: string, position: Vector3, rotation: Vector3) {
    const paddle = this.paddles.get(id);
    if (paddle) {
      paddle.position.copyFrom(position);
      // Update rotation
      // paddle.rotationQuaternion = null; // Reset quaternion
      paddle.rotation.x = rotation.x;
      paddle.rotation.y = rotation.y;
      paddle.rotation.z = rotation.z;
    }
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
    this.paddles.forEach((mesh) => mesh.dispose());
    this.paddles.clear();

    this.ballMesh?.dispose();
    this.netMesh?.dispose();
    this.groundMesh?.dispose();
    this.tableMesh?.dispose();

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
  removePaddleMesh(sessionId: string) {
    const mesh = this.paddles.get(sessionId);
    if (mesh) {
      mesh.dispose(); // Remove from scene
      this.paddles.delete(sessionId); // Remove from map
    }
  }

  createTargetLines(): void {
    const tableCenter = constants.TABLE.position.z;
    const tableHalfLength = constants.TABLE.size.length / 2;
    const tableY = constants.TABLE.position.y + (constants.TABLE.size.height / 2);

    // Left side range (when hit from right)
    const leftStart = tableCenter - tableHalfLength + 0.2;  // 20cm from edge
    const leftEnd = tableCenter - 0.3;  // before net

    // Right side range (when hit from left)
    const rightStart = tableCenter + 0.3;  // after net
    const rightEnd = tableCenter + tableHalfLength - 0.2;  // 20cm from edge

    // Create 4 lines
    const lines = [
      { points: [new Vector3(-1, tableY + 0.01, leftStart), new Vector3(1, tableY + 0.01, leftStart)], color: Color3.Green() },
      { points: [new Vector3(-1, tableY + 0.01, leftEnd), new Vector3(1, tableY + 0.01, leftEnd)], color: Color3.Green() },
      { points: [new Vector3(-1, tableY + 0.01, rightStart), new Vector3(1, tableY + 0.01, rightStart)], color: Color3.Blue() },
      { points: [new Vector3(-1, tableY + 0.01, rightEnd), new Vector3(1, tableY + 0.01, rightEnd)], color: Color3.Blue() }
    ];

    lines.forEach((lineData, i) => {
      const line = MeshBuilder.CreateLines(`targetLine${i}`, { points: lineData.points }, this.scene);
      line.color = lineData.color;
      this.targetLines.push(line);
    });
  }
}