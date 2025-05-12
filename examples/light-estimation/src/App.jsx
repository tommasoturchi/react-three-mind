import { ARFaceMesh, ARView } from "react-three-mind";

function App() {
  const handleLightUpdate = (lightData) => {
    console.log("Light estimation updated:", lightData);
  };

  return (
    <ARView
      lightEstimation
      lightUpdateFrequency={100}
      onLightUpdate={handleLightUpdate}
      filterMinCF={1}
      filterBeta={10000}
      missTolerance={0}
      warmupTolerance={0}
      flipUserCamera={false}
    >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <ARFaceMesh>
        <meshPhongMaterial color="darkslategray" />
      </ARFaceMesh>
    </ARView>
  );
}

export default App;
