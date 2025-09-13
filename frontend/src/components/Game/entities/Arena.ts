import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
} from "@babylonjs/core";

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { GridMaterial } from "@babylonjs/materials/grid";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import "@babylonjs/inspector"; // For Babylon.js built-in inspector

export function useArena(scene: Scene, enableDebug: boolean = false) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null);

  useEffect(() => {
    if (!scene) return;
    let group: TransformNode | null = null;
    let isMounted = true;

    async function load() {
      // Load GLB arena model
      const container = await LoadAssetContainerAsync(
        "/models/Lobby.glb",
        scene
      );
      if (!isMounted) return;

      container.addAllToScene();
      group = new TransformNode("ArenaGroup", scene);

      // Assign parent group to all meshes except __root__
      for (const mesh of container.meshes) {
        if (mesh.name !== "__root__") {
          mesh.parent = group;
        }


      }

      setMeshGroup(group);

      // Enable debug tools if requested
      if (enableDebug) {
        setupDebug(scene);
      }
    }

    load();

    return () => {
      isMounted = false;
      if (group) {
        group.dispose();
      }
    };
  }, [scene, enableDebug]);

  return { meshGroup };
}

/**
 * Adds debugging visuals & Babylon Inspector to the scene.
 */
function setupDebug(scene: Scene) {
  // 1. Show ground grid
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100 },
    scene
  );
  const gridMaterial = new GridMaterial("gridMaterial", scene);
  gridMaterial.majorUnitFrequency = 10;
  gridMaterial.minorUnitVisibility = 0.45;
  gridMaterial.gridRatio = 1;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new Color3(1, 1, 1);
  gridMaterial.lineColor = new Color3(0.75, 0.75, 0.75);
  gridMaterial.opacity = 0.98;
  ground.material = gridMaterial;

  // 2. Show axis lines
  const size = 5;
  const axisX = MeshBuilder.CreateLines(
    "axisX",
    {
      points: [Vector3.Zero(), new Vector3(size, 0, 0)],
    },
    scene
  );
  axisX.color = new Color3(1, 0, 0); // Red X

  const axisY = MeshBuilder.CreateLines(
    "axisY",
    {
      points: [Vector3.Zero(), new Vector3(0, size, 0)],
    },
    scene
  );
  axisY.color = new Color3(0, 1, 0); // Green Y

  const axisZ = MeshBuilder.CreateLines(
    "axisZ",
    {
      points: [Vector3.Zero(), new Vector3(0, 0, size)],
    },
    scene
  );
  axisZ.color = new Color3(0, 0, 1); // Blue Z

  // 3. Enable Babylon inspector
  scene.debugLayer.show({ embedMode: false });
}
