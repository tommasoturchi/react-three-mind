import { ARFaceMesh, ARView } from "react-three-mind";

function App() {
  return (
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
  );
}

export default App;
