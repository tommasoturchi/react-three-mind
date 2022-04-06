# react-three-mind

React Components adding Augmented Reality capabilities to [react-three-fiber](https://github.com/pmndrs/react-three-fiber), thanks to [MindAR](https://github.com/hiukim/mind-ar-js).

```
npm i react-three-mind
```

## Usage

Provide a [targets]("https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.mind") file to toggle image tracking mode. See the [examples](./examples).

```jsx
import ReactDOM from "react-dom";
import React from "react";

import { ARView, ARFaceMesh } from "react-three-mind";

ReactDOM.render(
  <ARView
    filterMinCF={1}
    filterBeta={10000}
    missTolerance={0}
    warmupTolerance={0}
  >
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <ARFaceMesh />
  </ARView>,
  document.getElementById("root")
);
```

## API

### ARView
AR Wrapper over @react-three/fiber Canvas, managing the live video background and the 3D scene alignment.

```jsx
<ARView
  children 
  autoplay
  targets
  maxTrack
  filterMinCF
  filterBeta
  warmupTolerance
  missTolerance
/>
```

### ARAnchor

```jsx
<ARAnchor
  children
  target
  onAnchorFound // callback invoked when anchor has been found
  onAnchorLost // callback invoked when previously found anchor has been lost
/>
```

### ARFaceMesh

```jsx
<ARFaceMesh
  children
  target
  occluder
/>
```

## TODO
- [ ] Add Error Handling
- [ ] Improve Documentation
- [ ] Add Showcase Video
- [ ] Fix CI Build
