import { useEffect, useState } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh, Vector3 } from "@babylonjs/core";
import { TrailMesh } from "@babylonjs/core/Meshes/trailMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";

export function useBall(scene: Scene | null) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null);
  const [mesh, setMesh] = useState<AbstractMesh | null>(null);

  useEffect(() => {
    if (!scene) return;

    let mounted = true;
    let group: TransformNode | null = null;

    async function load() {
      try {
        const container = await LoadAssetContainerAsync("/Models/ball.glb", scene!);
        if (!mounted) return;

        container.addAllToScene();

        group = new TransformNode("BallGroup", scene);
        let ballMesh: AbstractMesh | null = null;

        container.meshes.forEach((m) => {
          if (m.name !== "__root__") {
            m.parent = group!;
            ballMesh = m as AbstractMesh;
          }
        });

        if (ballMesh) {
          // ✅ Add trail
          const trail = new TrailMesh("ballTrail", ballMesh, scene!, 0.03, 10, true);
          const trailMat = new StandardMaterial("trailMat", scene!);
          trailMat.emissiveColor = new Color3(1, 1, 1); // glowing white
          trail.material = trailMat;

          // ✅ Glow layer (optional, might stack if multiple balls exist)
          const glow = new GlowLayer("glow", scene!);
          glow.intensity = 0;

          setMesh(ballMesh);
        }

        setMeshGroup(group);
      } catch (err) {
        console.error("Error loading ball model:", err);
      }
    }

    load();

    return () => {
      mounted = false;
      group?.dispose();
      mesh?.dispose();
    };
  }, [scene]);

  // === API like your class ===
  const setMeshPosition = (pos: Vector3) => {
    if (mesh) mesh.position.copyFrom(pos);
  };

  const getMeshPosition = () => {
    if (!mesh) return Vector3.Zero();
    return mesh.position.clone();
  };

  const reset = () => {
    setMeshPosition(Vector3.Zero());
  };

  return { meshGroup, mesh, setMeshPosition, getMeshPosition, reset };
}
