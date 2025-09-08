import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
  Plane,
  Camera,
  Vector3,
} from "@babylonjs/core";

import { StandardMaterial, MeshBuilder, Color3 } from "@babylonjs/core";

interface Boundaries {
  x: { min: number; max: number };
  z: { min: number; max: number };
}
type PaddleSide = -1 | 1;

export function usePaddle(scene: Scene, side: PaddleSide = 1) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null); // full paddle mesh group
  const [mainMesh, setMainMesh] = useState<AbstractMesh | null>(null); // the paddle hitbox

  useEffect(() => {
    if (!scene) return;

    let group: TransformNode | null = null;
    let mounted = true;

    async function load() {
      try {
        const container = await LoadAssetContainerAsync(
          "/models/paddle.glb",
          scene
        );
        if (!mounted) return;

        container.addAllToScene();
        group = new TransformNode("PaddleGroup", scene);

        container.meshes.forEach((m) => {
          if (m.name !== "__root__") {
            m.parent = group!;
            if (m.name === "Paddle_primitive0") setMainMesh(m as AbstractMesh);
          }
        });
        setMeshGroup(group);
      } catch (err) {
        console.error("Failed to load paddle:", err);
      }
    }
    load();

    return () => {
      mounted = false;
      group?.dispose();
      mainMesh?.dispose();
    };
  }, [scene]);

  useEffect(() => {
    if (meshGroup) {
      posInit();
    }
  }, [meshGroup]);

  function posInit(): void {
    if (!meshGroup) return;
    const zPos = side === -1 ? -2.8 : 2.8;
    meshGroup.position.set(0, 1.8, zPos);

    meshGroup.rotationQuaternion = null;
    meshGroup.rotation.set(0, 0, 0);
  }
  return { meshGroup, mainMesh };
}
