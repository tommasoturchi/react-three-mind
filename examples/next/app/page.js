import dynamic from 'next/dynamic';

// Dynamically import the FaceTrackingScene component with no SSR
const FaceTrackingScene = dynamic(
  () => import('./components/FaceTrackingScene'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <FaceTrackingScene />
    </main>
  );
} 