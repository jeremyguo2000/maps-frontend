import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const MapMover = ({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) => {
  const map = useMap(); // Get the map instance

  // Effect to move the map when center or zoom state variables change
  useEffect(() => {
    if (map) {
      // Create a CameraOptions object
      const cameraOptions: google.maps.CameraOptions = {
        center: center,
        zoom: zoom,
      };
      map.moveCamera(cameraOptions);
    }
  }, [map, center, zoom]); // Re-run effect when map, center, or zoom changes

  return null; // This component doesn't render anything visible
};

export default MapMover;
