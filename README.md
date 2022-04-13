# react-three-mind

React Components adding Augmented Reality capabilities to [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), thanks to [MindAR](https://github.com/hiukim/mind-ar-js).

```
npm i react-three-mind
```

## 📍 Motivation

There's no easy and ready-to-use way of developing AR experiences whilst leveraging on the amazing ecosystem around [@react-three/fiber](https://github.com/pmndrs/react-three-fiber). [MindAR](https://github.com/hiukim/mind-ar-js) is a performance-oriented and easy to use library managing image and face tracking, but only supports [AFrame](https://aframe.io) or vanilla [Three.js](https://threejs.org). This library aims to bridge the two worlds, while waiting for the new [WebXR Standard](https://caniuse.com/webxr) to include image and face tracking.

## 📚 Usage

Provide an [imageTargets]("https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.mind") url to toggle image tracking mode. See the [examples](./examples) and the original [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/quick-start/compile) to find out how to compile your own image targets.

```jsx
import ReactDOM from "react-dom";
import React from "react";

import { ARView, ARFaceMesh } from "react-three-mind";

ReactDOM.render(
  <ARView>
    <ARFaceMesh>
      <meshBasicMaterial color="hotpink" wireframe />
    </ARFaceMesh>
  </ARView>,
  document.getElementById("root")
);
```

## 👩‍💻 API

### ARView

AR Wrapper over [@react-three/fiber Canvas](https://docs.pmnd.rs/react-three-fiber/api/canvas) managing the live video background and the 3D scene alignment.

```jsx
const ref = useRef();
const startTracking = ref.current.startTracking(); // Starts tracking
const stopTracking = ref.current.stopTracking(); // Stops tracking
const switchCamera = ref.current.switchCamera(); // Switches between environment and user camera

<ARView
  ref={ref}
  autoplay // Automatically starts tracking once the camera stream is ready
  imageTargets={`url`} // URL of the generated image targets features
  maxTrack={1} // Maximum number of targets tracked simultaneously
  filterMinCF={0.1} // Cutoff Frequency, decrease to reduce jittering
  filterBeta={1000} // Speed Coefficient, increase to reduce delay
  warmupTolerance={5} // Number of continuous frames required for a target being detected to be marked as tracked
  missTolerance={5} // Number of continuous frames required for a target not being detected to be marked as lost
  {...canvasProps} // All @react-three/fiber Canvas props are valid
>
  <Scene />
</ARView>
```

### ARAnchor

An Object3D anchor linking it to a tracked target. Can be used both for image and face targets.

```jsx
<ARAnchor
  target={0} // Target (image or face) to be anchored to
  onAnchorFound={() => console.log(🥳)} // Callback invoked when anchor was found
  onAnchorLost={() => console.log(😢)} // Callback invoked when previously found anchor was lost
  {...groupProps} // All @react-three/fiber Group props are valid
>
  <mesh />
</ARAnchor>
```

### ARFaceMesh

A Mesh Object representing a tracked face (see the original [MindAR example](https://hiukim.github.io/mind-ar-js-doc/more-examples/threejs-face-facemesh)).

```jsx
<ARFaceMesh
  onFaceFound={() => console.log(🥳)} // Callback invoked when face was found
  onFaceLost={() => console.log(😢)} // Callback invoked when previously found face was lost
  {...meshProps} // All @react-three/fiber Mesh props are valid
>
  <meshBasicMaterial color="hotpink" wireframe />
</ARFaceMesh>
```

## 📮 TODO

- [ ] Add Showcase Video
- [ ] Fix CI Build
