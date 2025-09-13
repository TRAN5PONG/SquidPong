import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  Vector3,
  Plane,
  Camera,
  AbstractMesh,
} from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";

type PaddleSide = -1 | 1;

export function usePaddle(
  scene: Scene | null,
  camera: Camera | null,
  side: PaddleSide,
  isLocal: boolean = false
) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null);
  const [mainMesh, setMainMesh] = useState<AbstractMesh | null>(null);

  // tracking state
  const [paddlePlane, setPaddlePlane] = useState<Plane | null>(null);
  const [clamped, setClamped] = useState({ x: 0, z: 0 });
  const [previousPos, setPreviousPos] = useState<Vector3 | null>(null);

  // === Load model ===
  useEffect(() => {
    if (!scene) return;
    let mounted = true;
    let group: TransformNode | null = null;

    async function load() {
      try {
        const container = await LoadAssetContainerAsync("/models/paddle.glb", scene!);
        if (!mounted) return;

        container.addAllToScene();

        group = new TransformNode("PaddleGroup", scene);

        container.meshes.forEach((m) => {
          if (!m) return;

          if (isLocal) m.renderingGroupId = 2; // always on top
          if (m.name !== "__root__") m.parent = group!;
          if (m.name === "Paddle_primitive0") setMainMesh(m as AbstractMesh);

          m.isPickable = true;
        });

        // initial pos
        const zPos = side === -1 ? -2.8 : 2.8;
        group.position.set(0, 2, zPos);
        group.rotationQuaternion = null;
        group.rotation.set(0, 0, 0);

        setMeshGroup(group);

        // setup plane if local
        if (isLocal) {
          const planePosition = new Vector3(0, group.position.y, 0);
          const planeNormal = new Vector3(0, 1, 0);
          setPaddlePlane(Plane.FromPositionAndNormal(planePosition, planeNormal));
        }
      } catch (err) {
        console.error("Error loading paddle:", err);
      }
    }

    load();

    return () => {
      mounted = false;
      group?.dispose();
      mainMesh?.dispose();
    };
  }, [scene, side, isLocal]);

  // === Live mouse tracking (only local) ===
  useEffect(() => {
    if (!scene || !camera || !isLocal || !meshGroup || !paddlePlane) return;

    const observer = scene.onBeforeRenderObservable.add(() => {
      const pointerX = scene.pointerX;
      const pointerY = scene.pointerY;
      if (pointerX === undefined || pointerY === undefined) return;

      const ray = scene.createPickingRay(pointerX, pointerY, null, camera);
      const distance = ray.intersectsPlane(paddlePlane);
      if (distance === null) return;

      const boundaries = {
        x: { min: -2, max: 2 },
        z: side === -1 ? { min: -3.5, max: -1.5 } : { min: 1.5, max: 3.5 },
      };

      const point = ray.origin.add(ray.direction.scale(distance));

      const x = Math.max(boundaries.x.min, Math.min(boundaries.x.max, point.x));
      const z = Math.max(boundaries.z.min, Math.min(boundaries.z.max, point.z));

      setClamped({ x, z });

      // rotation effect
      const currPaddleX = meshGroup.position.x;
      const MaxRotation = Math.PI / 2;
      const gapPercent = 0.1;

      let rotationPct = (boundaries.x.max - currPaddleX) / (boundaries.x.max - boundaries.x.min);
      const effectZone = 1 - 2 * gapPercent;
      rotationPct = (rotationPct - gapPercent) / effectZone;
      rotationPct = Math.max(0, Math.min(1, rotationPct));

      meshGroup.rotation.z = -MaxRotation + rotationPct * (2 * MaxRotation);

      // smooth interpolation
      const interpolated = Vector3.Lerp(
        meshGroup.position,
        new Vector3(x, meshGroup.position.y, z),
        0.5
      );
      meshGroup.position.copyFrom(interpolated);

      // velocity tracking
      const currentPos = meshGroup.position.clone();
      setPreviousPos((prev) => {
        if (!prev) return currentPos;
        return currentPos;
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, [scene, camera, isLocal, meshGroup, paddlePlane, side]);

  // === API ===
  const getMeshPosition = () => {
    if (!meshGroup) return Vector3.Zero();
    return meshGroup.position.clone();
  };

  const getMeshRotation = () => {
    if (!meshGroup) return Vector3.Zero();
    return meshGroup.rotation.clone();
  };

  const getPaddleVelocity = () => {
    if (!meshGroup || !previousPos) return Vector3.Zero();
    const curr = meshGroup.position.clone();
    return curr.subtract(previousPos);
  };

  return { meshGroup, mainMesh, getMeshPosition, getMeshRotation, getPaddleVelocity };
}
