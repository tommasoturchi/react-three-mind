import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { AmbientLight, DirectionalLight, HemisphereLight } from "three";
import { atom, useAtom } from "jotai";

// Atoms to store light estimation data
const ambientIntensityAtom = atom(0.5);
const directionalIntensityAtom = atom(0.8);
const lightDirectionAtom = atom([0, 1, 0]);
const lightColorAtom = atom("#ffffff");

const ARLightEstimation = ({
  enabled = true,
  updateFrequency = 100, // ms between updates
  onLightUpdate,
  children,
  ...props
}) => {
  const { scene } = useThree();
  const videoRef = useRef(null);
  const [ambientIntensity, setAmbientIntensity] = useAtom(ambientIntensityAtom);
  const [directionalIntensity, setDirectionalIntensity] = useAtom(
    directionalIntensityAtom
  );
  const [lightDirection, setLightDirection] = useAtom(lightDirectionAtom);
  const [lightColor, setLightColor] = useAtom(lightColorAtom);

  // Create canvas for image analysis
  const canvasRef = useRef(document.createElement("canvas"));
  const ctxRef = useRef(canvasRef.current.getContext("2d"));

  useEffect(() => {
    if (!enabled) return;

    // Create lights
    const ambientLight = new AmbientLight(lightColor, ambientIntensity);
    const directionalLight = new DirectionalLight(
      lightColor,
      directionalIntensity
    );
    const hemisphereLight = new HemisphereLight(lightColor, "#404040", 0.5);

    directionalLight.position.set(...lightDirection);
    scene.add(ambientLight, directionalLight, hemisphereLight);

    // Function to estimate lighting from video frame
    const estimateLighting = () => {
      if (!videoRef.current || !ctxRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness and color
      let totalBrightness = 0;
      let totalR = 0,
        totalG = 0,
        totalB = 0;
      const sampleSize = 1000; // Number of pixels to sample
      const step = Math.floor(data.length / (4 * sampleSize));

      for (let i = 0; i < data.length; i += 4 * step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness using perceived brightness formula
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        totalBrightness += brightness;

        totalR += r;
        totalG += g;
        totalB += b;
      }

      // Calculate averages
      const avgBrightness = totalBrightness / sampleSize;
      const avgR = totalR / sampleSize;
      const avgG = totalG / sampleSize;
      const avgB = totalB / sampleSize;

      // Update light properties
      const newAmbientIntensity = Math.max(0.2, Math.min(1, avgBrightness));
      const newDirectionalIntensity = Math.max(
        0.3,
        Math.min(1, avgBrightness * 1.5)
      );

      // Estimate light direction based on brightness distribution
      // This is a simplified version - could be enhanced with more sophisticated analysis
      const direction = [
        (avgR - 128) / 128,
        (avgG - 128) / 128,
        (avgB - 128) / 128,
      ].map((v) => Math.max(-1, Math.min(1, v)));

      // Update atoms
      setAmbientIntensity(newAmbientIntensity);
      setDirectionalIntensity(newDirectionalIntensity);
      setLightDirection(direction);
      setLightColor(`rgb(${avgR}, ${avgG}, ${avgB})`);

      // Update Three.js lights
      ambientLight.intensity = newAmbientIntensity;
      directionalLight.intensity = newDirectionalIntensity;
      directionalLight.position.set(...direction);
      ambientLight.color.setStyle(`rgb(${avgR}, ${avgG}, ${avgB})`);
      directionalLight.color.setStyle(`rgb(${avgR}, ${avgG}, ${avgB})`);

      // Call user callback if provided
      onLightUpdate?.({
        ambientIntensity: newAmbientIntensity,
        directionalIntensity: newDirectionalIntensity,
        direction,
        color: `rgb(${avgR}, ${avgG}, ${avgB})`,
      });
    };

    // Set up video reference
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoRef.current = videoElement;
    }

    // Start periodic updates
    const intervalId = setInterval(estimateLighting, updateFrequency);

    return () => {
      clearInterval(intervalId);
      scene.remove(ambientLight, directionalLight, hemisphereLight);
    };
  }, [enabled, updateFrequency, scene, onLightUpdate]);

  return children;
};

export {
  ARLightEstimation,
  ambientIntensityAtom,
  directionalIntensityAtom,
  lightDirectionAtom,
  lightColorAtom,
};
