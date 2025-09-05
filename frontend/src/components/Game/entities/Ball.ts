import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
} from "@babylonjs/core";

export function useBall(scene: Scene) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null);
  const [mesh, setMesh] = useState<AbstractMesh | null>(null);

  useEffect(() => {
	if (!scene) return;
    let group: TransformNode | null = null;
    let isMounted = true;

    async function load() {
      const container = await LoadAssetContainerAsync(
        "/models/ball.glb",
        scene
      );
	  
      if (!isMounted) return;

      container.addAllToScene();
      group = new TransformNode("BallGroup", scene);

      container.meshes.forEach((mesh) => {
        if (mesh.name !== "__root__") {
          mesh.parent = group!;
          setMesh(mesh);
        }
      });

      setMeshGroup(group);
    }

    load();

    return () => {
      isMounted = false;
      if (group) {
        group.dispose();
      }
    };
  }, [scene]);

  return { meshGroup, mesh };
}
