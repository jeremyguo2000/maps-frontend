import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { ReactNode } from "react";

interface GoogleMapProps {
  children?: ReactNode;
  onCameraChanged?: (ev: MapCameraChangedEvent) => void;
}

const GoogleMap = ({ children, onCameraChanged }: GoogleMapProps) => {
  return (
    <APIProvider
      apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      <Map
        defaultZoom={15}
        defaultCenter={{ lat: -33.8688, lng: 151.2093 }}
        mapId="test_map_id"
        onCameraChanged={onCameraChanged} // Pass the handler if needed
      >
        {children}
      </Map>
    </APIProvider>
  );
};

export default GoogleMap;
