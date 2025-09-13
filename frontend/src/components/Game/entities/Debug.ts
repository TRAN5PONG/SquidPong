import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { GridMaterial } from "@babylonjs/materials/grid";
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";

import "@babylonjs/inspector";
import { PhysicsImpostor } from "@babylonjs/core";

export class Debug {
  private scene: Scene;
  private engine: Engine;

  constructor(scene: Scene, engine: Engine) {
    this.engine = engine;
    this.scene = scene;
  }

  ShowGroundGrid() {
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 100, height: 100 },
      this.scene
    );
    const gridMaterial = new GridMaterial("gridMaterial", this.scene);
    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.45;
    gridMaterial.gridRatio = 1;
    gridMaterial.backFaceCulling = false;
    gridMaterial.mainColor = new Color3(1, 1, 1);
    gridMaterial.lineColor = new Color3(0.75, 0.75, 0.75);
    gridMaterial.opacity = 0.98;
    ground.material = gridMaterial;
  }
  ShowAxisLines() {
    const size = 5;
    const axisX = MeshBuilder.CreateLines(
      "axisX",
      {
        points: [Vector3.Zero(), new Vector3(size, 0, 0)],
      },
      this.scene
    );
    axisX.color = new Color3(1, 0, 0); // Red X

    const axisY = MeshBuilder.CreateLines(
      "axisY",
      {
        points: [Vector3.Zero(), new Vector3(0, size, 0)],
      },
      this.scene
    );
    axisY.color = new Color3(0, 1, 0); // Green Y

    const axisZ = MeshBuilder.CreateLines(
      "axisZ",
      {
        points: [Vector3.Zero(), new Vector3(0, 0, size)],
      },
      this.scene
    );
    axisZ.color = new Color3(0, 0, 1); // Blue Z
  }
  ShowDebuger() {
    this.scene.debugLayer.show();
    this.engine.resize();
  }
}