import * as THREE from "three";

import { Canvas, useThree } from "@react-three/fiber";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { atom, useAtom } from "jotai";

import { Controller as FaceTargetController } from "mind-ar/src/face-target/controller";
import { Html } from "@react-three/drei";
import { Controller as ImageTargetController } from "mind-ar/src/image-target/controller";
import Webcam from "react-webcam";
import { useUpdateAtom } from "jotai/utils";
import { useWindowSize } from "./hooks";

const anchorsAtom = atom([]);
const faceMeshesAtom = atom([]);

const ARProvider = ({
  children,
  autoplay,
  targets,
  maxTrack,
  filterMinCF = null,
  filterBeta = null,
  warmupTolerance = null,
  missTolerance = null,
}) => {
  const webcamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const controllerRef = useRef(null);
  const { camera } = useThree();
  const [anchors] = useAtom(anchorsAtom);
  const [faceMeshes] = useAtom(faceMeshesAtom);

  const { width, height } = useWindowSize();
  const isLandscape = useMemo(() => height <= width, [height, width]);
  const ratio = useMemo(
    () => (isLandscape ? width / height : height / width),
    [isLandscape, width, height]
  );

  useEffect(() => {
    if (controllerRef.current) {
      if (targets) {
        const ARprojectionMatrix = controllerRef.current.getProjectionMatrix();
        camera.fov = (2 * Math.atan(1 / ARprojectionMatrix[5]) * 180) / Math.PI;
        camera.near = ARprojectionMatrix[14] / (ARprojectionMatrix[10] - 1.0);
        camera.far = ARprojectionMatrix[14] / (ARprojectionMatrix[10] + 1.0);
        camera.updateProjectionMatrix();
      }
    }
  }, [width, height, camera, targets]);

  const handleStream = useCallback(() => {
    if (webcamRef.current) {
      webcamRef.current.video.addEventListener("loadedmetadata", () =>
        setReady(true)
      );
    }
  }, [webcamRef]);

  const startAR = useCallback(async () => {
    let controller;
    if (targets) {
      controller = new ImageTargetController({
        inputWidth: webcamRef.current.video.videoWidth,
        inputHeight: webcamRef.current.video.videoHeight,
        maxTrack,
        filterMinCF,
        filterBeta,
        missTolerance,
        warmupTolerance,
      });

      const { dimensions: imageTargetDimensions } =
        await controller.addImageTargets(targets);

      const postMatrices = imageTargetDimensions.map(
        ([markerWidth, markerHeight]) =>
          new THREE.Matrix4().compose(
            new THREE.Vector3(
              markerWidth / 2,
              markerWidth / 2 + (markerHeight - markerWidth) / 2
            ),
            new THREE.Quaternion(),
            new THREE.Vector3(markerWidth, markerWidth, markerWidth)
          )
      );

      const ARprojectionMatrix = controller.getProjectionMatrix();
      camera.fov = (2 * Math.atan(1 / ARprojectionMatrix[5]) * 180) / Math.PI;
      camera.near = ARprojectionMatrix[14] / (ARprojectionMatrix[10] - 1.0);
      camera.far = ARprojectionMatrix[14] / (ARprojectionMatrix[10] + 1.0);
      camera.updateProjectionMatrix();

      controller.onUpdate = (data) => {
        if (data.type === "updateMatrix") {
          const { targetIndex, worldMatrix } = data;

          anchors.forEach(({ anchor, target, onAnchorFound, onAnchorLost }) => {
            if (target === targetIndex) {
              if (!anchor.visible && worldMatrix !== null && onAnchorFound)
                onAnchorFound();
              else if (anchor.visible && worldMatrix === null && onAnchorLost)
                onAnchorLost();

              anchor.visible = worldMatrix !== null;

              if (worldMatrix !== null) {
                anchor.matrix = new THREE.Matrix4()
                  .fromArray([...worldMatrix])
                  .multiply(postMatrices[targetIndex]);
              }
            }
          });
        }
      };
    } else {
      controller = new FaceTargetController({
        filterMinCF,
        filterBeta,
      });

      faceMeshes.forEach((anchor) =>
        anchor.add(
          new THREE.Mesh(
            controller.createThreeFaceGeometry(THREE),
            anchor.material ??
              new THREE.MeshStandardMaterial({
                color: 0xffffff,
                wireframe: true,
              })
          )
        )
      );

      controller.onUpdate = ({ hasFace, estimateResult }) => {
        faceMeshes.forEach((anchor) => (anchor.visible = hasFace));

        anchors.forEach(({ anchor, target, onAnchorFound, onAnchorLost }) => {
          if (!anchor.visible && hasFace && onAnchorFound) onAnchorFound();
          else if (anchor.visible && !hasFace && onAnchorLost) onAnchorLost();

          anchor.visible = hasFace;
          if (hasFace)
            anchor.matrix.set(...controller.getLandmarkMatrix(target));
        });

        if (hasFace)
          faceMeshes.forEach((anchor) =>
            anchor.matrix.set(...estimateResult.faceMatrix)
          );
      };

      await controller.setup(webcamRef.current.video);

      const { fov, aspect, near, far } = controller.getCameraParams();
      camera.fov = fov;
      camera.aspect = aspect;
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }

    await controller.dummyRun(webcamRef.current.video);

    controller.processVideo(webcamRef.current.video);

    controllerRef.current = controller;
  }, [
    targets,
    maxTrack,
    filterMinCF,
    filterBeta,
    missTolerance,
    warmupTolerance,
    camera,
    anchors,
    faceMeshes,
  ]);

  useEffect(() => {
    if (ready && autoplay) {
      startAR();
    }
  }, [autoplay, ready, startAR]);

  return (
    <>
      <Html
        fullscreen
        zIndexRange={[-1, -1]}
        calculatePosition={() => [0, 0]}
        style={{ top: 0, left: 0 }}
      >
        <Webcam
          ref={webcamRef}
          onUserMedia={handleStream}
          height={height}
          width={width}
          videoConstraints={{
            facingMode: targets ? "environment" : "user",
            aspectRatio: ratio,
          }}
        />
      </Html>
      {children}
    </>
  );
};

const ARView = ({
  children,
  autoplay = true,
  targets,
  maxTrack = 1,
  filterMinCF,
  filterBeta,
  warmupTolerance,
  missTolerance,
  ...rest
}) => {
  return (
    <Canvas
      style={{ position: "absolute", minWidth: "100vw", minHeight: "100vh" }}
      {...rest}
    >
      <Suspense fallback={null}>
        <ARProvider
          {...{
            autoplay,
            targets,
            maxTrack,
            filterMinCF,
            filterBeta,
            warmupTolerance,
            missTolerance,
          }}
        >
          {children}
        </ARProvider>
      </Suspense>
    </Canvas>
  );
};

const ARAnchor = ({ children, target, onAnchorFound, onAnchorLost }) => {
  const ref = useRef();
  const setAnchors = useUpdateAtom(anchorsAtom);

  useEffect(() => {
    if (ref.current)
      setAnchors((anchors) => [
        ...anchors,
        { target, anchor: ref.current, onAnchorFound, onAnchorLost },
      ]);
  }, [onAnchorFound, onAnchorLost, ref, setAnchors, target]);

  return (
    <group ref={ref} visible={false} matrixAutoUpdate={false}>
      {children}
    </group>
  );
};

const ARFaceMesh = ({ children, target, occluder = false }) => {
  const ref = useRef();
  const setFaceMeshes = useUpdateAtom(faceMeshesAtom);

  useEffect(() => {
    if (ref.current)
      setFaceMeshes((faceMeshes) => [...faceMeshes, ref.current]);
  }, [ref, setFaceMeshes, target]);

  return (
    <group ref={ref} visible={false} matrixAutoUpdate={false}>
      {children}
      {occluder && <meshStandardMaterial colorWrite={false} />}
    </group>
  );
};

export { ARView, ARAnchor, ARFaceMesh };
