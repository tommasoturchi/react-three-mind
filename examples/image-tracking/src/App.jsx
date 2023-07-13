import { ARAnchor, ARView } from "react-three-mind";

function Plane(props) {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function App() {
  return (
    <ARView
      imageTargets="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.3/examples/image-tracking/assets/card-example/card.mind"
      filterMinCF={0.001}
      filterBeta={1000}
      missTolerance={5}
      warmupTolerance={5}
      flipUserCamera={false}
    >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <ARAnchor target={0}>
        <Plane />
      </ARAnchor>
    </ARView>
  );
}

export default App;
