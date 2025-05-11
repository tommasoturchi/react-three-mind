'use client';

import { ARFaceMesh, ARView } from "react-three-mind";

export default function FaceTrackingScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ARView
        filterMinCF={1}
        filterBeta={10000}
        missTolerance={0}
        warmupTolerance={0}
        flipUserCamera={false}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <ARFaceMesh>
          <meshBasicMaterial color="hotpink" wireframe />
        </ARFaceMesh>
      </ARView>
    </div>
  );
} 