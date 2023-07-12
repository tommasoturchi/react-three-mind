import { Canvas, useThree } from "@react-three/fiber";
import {
  faces as FaceMeshFaces,
  uvs as FaceMeshUVs,
} from "mind-ar/src/face-target/face-geometry/face-data";
import { Matrix4, Quaternion, Vector3 } from "three";
import React, {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";

import { Controller as FaceTargetController } from "mind-ar/src/face-target/controller";
import { Html } from "@react-three/drei";
import { Controller as ImageTargetController } from "mind-ar/src/image-target/controller";
import Webcam from "react-webcam";
import { useWindowSize } from "./hooks";

const modeAtom = atom(false);
const anchorsAtom = atom({});
const faceMeshAtom = atom();
const flipUserCameraAtom = atom(true);

const ARProvider = forwardRef(
  (
    {
      children,
      autoplay,
      imageTargets,
      maxTrack,
      filterMinCF = null,
      filterBeta = null,
      warmupTolerance = null,
      missTolerance = null,
      flipUserCamera = true,
      onReady = null,
      onError = null,
    },
    ref
  ) => {
    const [isWebcamFacingUser, switchCamera] = useState(!Boolean(imageTargets));
    const webcamRef = useRef(null);
    const [ready, setReady] = useState(false);
    const controllerRef = useRef(null);
    const { camera } = useThree();
    const setMode = useSetAtom(modeAtom);
    const setAnchors = useSetAtom(anchorsAtom);
    const setFaceMesh = useSetAtom(faceMeshAtom);
    const setFlipUserCamera = useSetAtom(flipUserCameraAtom);

    const { width, height } = useWindowSize();

    useEffect(
      () => setFlipUserCamera(flipUserCamera),
      [flipUserCamera, setFlipUserCamera]
    );

    useEffect(() => {
      setMode(Boolean(imageTargets));
    }, [imageTargets, setMode]);

    const handleStream = useCallback(() => {
      if (webcamRef.current) {
        webcamRef.current.video.addEventListener("loadedmetadata", () => {
          console.log('loadedmetadata');
          setReady(true)
  
        }
        );
      }
    }, [webcamRef]);

    const startTracking = useCallback(async () => {
      console.log('startTracking');
      if (ready) {
        console.log(`ready`);
        let controller;
        if (imageTargets) {
          console.log(imageTargets);
          controller = new ImageTargetController({
            inputWidth: webcamRef.current.video.videoWidth,
            inputHeight: webcamRef.current.video.videoHeight,
            debugMode: true,
            maxTrack,
            filterMinCF,
            filterBeta,
            missTolerance,
            warmupTolerance,
          });

          const { dimensions: imageTargetDimensions } =
            await controller.addImageTargets(imageTargets);

          const postMatrices = imageTargetDimensions.map(
            ([markerWidth, markerHeight]) =>
              new Matrix4().compose(
                new Vector3(
                  markerWidth / 2,
                  markerWidth / 2 + (markerHeight - markerWidth) / 2
                ),
                new Quaternion(),
                new Vector3(markerWidth, markerWidth, markerWidth)
              )
          );

          const ARprojectionMatrix = controller.getProjectionMatrix();
          camera.fov =
            (2 * Math.atan(1 / ARprojectionMatrix[5]) * 180) / Math.PI;
          camera.near = ARprojectionMatrix[14] / (ARprojectionMatrix[10] - 1.0);
          camera.far = ARprojectionMatrix[14] / (ARprojectionMatrix[10] + 1.0);
          camera.updateProjectionMatrix();

          controller.onUpdate = ({ type, targetIndex, worldMatrix }) => {
            if (type === "updateMatrix") {
              setAnchors((anchors) => ({
                ...anchors,
                [targetIndex]:
                  worldMatrix !== null
                    ? new Matrix4()
                        .fromArray([...worldMatrix])
                        .multiply(postMatrices[targetIndex])
                        .toArray()
                    : null,
              }));
            }
          };
        } else {
          controller = new FaceTargetController({
            filterMinCF,
            filterBeta,
          });

          controller.onUpdate = ({ hasFace, estimateResult }) =>
            setFaceMesh(hasFace ? estimateResult : null);

          controller.onInputResized(webcamRef.current.video);
          await controller.setup(flipUserCamera);

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

        onReady && onReady();
      }
    }, [
      ready,
      imageTargets,
      onReady,
      maxTrack,
      filterMinCF,
      filterBeta,
      missTolerance,
      warmupTolerance,
      camera,
      setAnchors,
      setFaceMesh,
    ]);

    const stopTracking = useCallback(() => {
      if (controllerRef.current) {
        controllerRef.current.stopProcessVideo();
      }
    }, [controllerRef]);

    useImperativeHandle(
      ref,
      () => ({
        startTracking,
        stopTracking,
        switchCamera: () => {
          const wasTracking =
            controllerRef.current && controllerRef.current.processingVideo;
          wasTracking && stopTracking();
          setReady(false);
          switchCamera((isWebcamFacingUser) => !isWebcamFacingUser);
          wasTracking && startTracking();
        },
      }),
      [startTracking, stopTracking]
    );

    useEffect(() => {
      if (ready && autoplay) {
        startTracking();
      }
    }, [autoplay, ready, startTracking]);

    const feedStyle = useMemo(
      () => ({
        width: "auto",
        maxWidth: "none",
        height: "inherit",
        marginLeft: `${
          webcamRef.current?.video?.clientWidth > 0 && ready
            ? parseInt((width - webcamRef.current.video.clientWidth) / 2)
            : 0
        }px`,
      }),
      [width, ready, webcamRef]
    );

    return (
      <>
        <Html
          fullscreen
          zIndexRange={[-1, -1]}
          calculatePosition={() => [0, 0]}
          style={{
            top: 0,
            left: 0,
          }}
        >
          <Webcam
            ref={webcamRef}
            onUserMedia={handleStream}
            onUserMediaError={(e) => {
              onError && onError(e);
            }}
            height={height}
            width={width}
            videoConstraints={{
              facingMode: isWebcamFacingUser ? "user" : "environment",
            }}
            style={feedStyle}
            mirrored={isWebcamFacingUser && flipUserCamera}
          />
        </Html>
        {children}
      </>
    );
  }
);

const ARView = forwardRef(
  (
    {
      children,
      autoplay = true,
      imageTargets,
      maxTrack = 1,
      filterMinCF,
      filterBeta,
      warmupTolerance,
      missTolerance,
      flipUserCamera = true,
      onReady,
      onError,
      ...rest
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const ARRef = useRef(null);
    useImperativeHandle(ref, () => ({
      startTracking: () => ARRef?.current?.startTracking(),
      stopTracking: () => ARRef?.current?.stopTracking(),
      switchCamera: () => ARRef?.current?.switchCamera(),
      current: canvasRef.current,
    }));

    return (
      <Canvas
        style={{ position: "absolute", minWidth: "100vw", minHeight: "100vh" }}
        {...rest}
        ref={canvasRef}
      >
        <Suspense fallback={null}>
          <ARProvider
            {...{
              autoplay,
              imageTargets,
              maxTrack,
              filterMinCF,
              filterBeta,
              warmupTolerance,
              missTolerance,
              flipUserCamera,
              onReady,
              onError,
            }}
            ref={ARRef}
          >
            {children}
          </ARProvider>
        </Suspense>
      </Canvas>
    );
  }
);

const ARAnchor = ({
  children,
  target = 0,
  onAnchorFound,
  onAnchorLost,
  ...rest
}) => {
  const ref = useRef();
  const anchor = useAtomValue(anchorsAtom);
  const mode = useAtomValue(modeAtom);
  const faceMesh = useAtomValue(faceMeshAtom);
  const flipUserCamera = useAtomValue(flipUserCameraAtom);

  useEffect(() => {
    if (ref.current) {
      if (mode) {
        if (anchor[target]) {
          if (ref.current.visible !== true && onAnchorFound) onAnchorFound();
          ref.current.visible = true;
          ref.current.matrix = new Matrix4().fromArray(anchor[target]);
        } else {
          if (ref.current.visible !== false && onAnchorLost) onAnchorLost();
          ref.current.visible = false;
        }
      } else {
        if (faceMesh) {
          if (ref.current.visible !== true && onAnchorFound) onAnchorFound();
          ref.current.visible = true;
          const fm = faceMesh.faceMatrix;
          const s = faceMesh.faceScale;
          const t = [
            faceMesh.metricLandmarks[target][0],
            faceMesh.metricLandmarks[target][1],
            faceMesh.metricLandmarks[target][2],
          ];
          ref.current.matrix.set(
            ...[
              fm[0] * s,
              fm[1] * s,
              fm[2] * s,
              fm[0] * t[0] + fm[1] * t[1] + fm[2] * t[2] + fm[3],
              fm[4] * s,
              fm[5] * s,
              fm[6] * s,
              fm[4] * t[0] + fm[5] * t[1] + fm[6] * t[2] + fm[7],
              fm[8] * s,
              fm[9] * s,
              fm[10] * s,
              fm[8] * t[0] + fm[9] * t[1] + fm[10] * t[2] + fm[11],
              fm[12] * s,
              fm[13] * s,
              fm[14] * s,
              fm[12] * t[0] + fm[13] * t[1] + fm[14] * t[2] + fm[15],
            ]
          );
        } else {
          if (ref.current.visible !== false && onAnchorLost) onAnchorLost();
          ref.current.visible = false;
        }
      }
    }
  }, [anchor, target, onAnchorFound, onAnchorLost, mode, faceMesh]);

  return (
    <group scale={[flipUserCamera ? -1 : 1, 1, 1]}>
      <group ref={ref} visible={false} matrixAutoUpdate={false} {...rest}>
        {children}
      </group>
    </group>
  );
};

const ARFaceMesh = ({ children, onFaceFound, onFaceLost, ...rest }) => {
  const ref = useRef();
  const faceMesh = useAtomValue(faceMeshAtom);
  const flipUserCamera = useAtomValue(flipUserCameraAtom);

  const [positions, uvs, indexes] = useMemo(() => {
    const positions = new Float32Array(FaceMeshUVs.length * 3);
    const uvs = new Float32Array(FaceMeshUVs.length * 2);
    const indexes = new Uint32Array(FaceMeshFaces);
    for (let i = 0; i < FaceMeshUVs.length; i++) {
      uvs[i * 2] = FaceMeshUVs[i][0];
      uvs[i * 2 + 1] = FaceMeshUVs[i][1];
    }

    return [positions, uvs, indexes];
  }, []);

  useEffect(() => {
    if (ref.current) {
      if (faceMesh) {
        if (ref.current.visible !== true && onFaceFound) onFaceFound();
        ref.current.visible = true;
        ref.current.matrix.set(...faceMesh.faceMatrix);
        for (let i = 0; i < FaceMeshUVs.length; i++)
          ref.current.geometry.attributes.position.set(
            faceMesh.metricLandmarks[i],
            i * 3
          );

        ref.current.geometry.attributes.position.needsUpdate = true;
        ref.current.geometry.computeVertexNormals();
      } else {
        if (ref.current.visible !== false && onFaceLost) onFaceLost();
        ref.current.visible = false;
      }
    }
  }, [onFaceFound, onFaceLost, faceMesh]);

  return (
    <group scale={[flipUserCamera ? -1 : 1, 1, 1]}>
      <mesh ref={ref} visible={false} matrixAutoUpdate={false} {...rest}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="index"
            array={indexes}
            count={indexes.length}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            itemSize={3}
            array={positions}
          />
          <bufferAttribute
            attach="attributes-uv"
            count={uvs.length / 2}
            itemSize={2}
            array={uvs}
          />
        </bufferGeometry>
        {children}
      </mesh>
    </group>
  );
};

export { ARView, ARAnchor, ARFaceMesh };
