import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
  StandardMaterial,
  Color3,
  Texture,
} from "@babylonjs/core";

export function useArena(scene: Scene) {
  const [meshGroup, setMeshGroup] = useState<TransformNode | null>(null);
  const [meshPlane, setmeshPlane] = useState<AbstractMesh | null>(null);

  useEffect(() => {
    if (!scene) return;
    let group: TransformNode | null = null;
    let isMounted = true;

    async function load() {
      const container = await LoadAssetContainerAsync(
        "/models/scene2.glb",
        scene
      );
      if (!isMounted) return;

      container.addAllToScene();
      group = new TransformNode("ArenaGroup", scene);

      // let plane: AbstractMesh | null = null;

      for (const mesh of container.meshes) {
        if (mesh.name !== "__root__") {
          mesh.parent = group;
        }

        if (!(mesh instanceof AbstractMesh)) continue;

        if (mesh.name === "Plane") {
          // mesh.receiveShadows = true;
          setmeshPlane(mesh);
        }

        if (mesh.name === "TableBase" || mesh.name === "TableBorders" || mesh.name === "TableStand")
        {
          // (scene as any).shadowGenerator?.addShadowCaster(mesh);
        }

        // if (mesh.name === "Plane" && mesh instanceof AbstractMesh) {
        //   plane = mesh;
        // }
      }

      // if (plane) {
      //   const planeMaterial = new StandardMaterial("planeMaterial", scene);
      //   planeMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);

      //   const shadowTexture = new Texture("/models/floor_baked.png", scene);
      //   shadowTexture.hasAlpha = true;
      //   // shadowTexture.vScale = -1;

      //   planeMaterial.diffuseTexture = shadowTexture;
      //   planeMaterial.useAlphaFromDiffuseTexture = true;

      //   plane.material = planeMaterial;
      //   setmeshPlane(plane);
      // }

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

  return { meshGroup, meshPlane };
}
