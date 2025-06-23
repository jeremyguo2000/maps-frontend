import { useState } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider, MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import "./index.css";
import LLMChatInput from "./components/Chat/LLMChatInput";
import type { Poi } from "./types";
import { MapViewData } from "./types/index"; // TODO: why is this path not the shortcut
import PoiMarkers from "./components/Map/PoiMarkers";
import MapMover from "./components/Map/MapMover";
import GoogleMap from "./components/Map/GoogleMap";

const App = () => {
  const [currentPlaces, setCurrentPlaces] = useState<Poi[]>([]);
  const handleNewPlaces = (places: Poi[]) => {
    setCurrentPlaces(places);
  };

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -33.8688,
    lng: 151.2093,
  });
  const [mapZoom, setMapZoom] = useState<number>(10);

  const handleSetMapView = (mapViewData: MapViewData | null) => {
    if (
      mapViewData &&
      typeof mapViewData.latitude === "number" &&
      typeof mapViewData.longitude === "number"
    ) {
      setMapCenter({ lat: mapViewData.latitude, lng: mapViewData.longitude });
      if (
        mapViewData.zoom_level &&
        typeof mapViewData.zoom_level === "number"
      ) {
        setMapZoom(mapViewData.zoom_level);
      } else {
        // Fallback zoom if LLM doesn't provide one (e.g., default to city-level)
        setMapZoom(12);
      }
      console.log(
        `Map view updated to: Lat ${mapViewData.latitude}, Lng ${mapViewData.longitude}, Zoom ${mapViewData.zoom_level || "default (12)"}`,
      );
    } else if (mapViewData === null) {
      // Optionally reset to default view or do nothing if null is passed
      // For now, if null, it means no new instruction, so keep current view.
      console.log("No new map view instruction.");
    }
  };

  const handleCameraChanged = (ev: MapCameraChangedEvent) => {
    console.log("camera changed:", ev.detail.center, "zoom:", ev.detail.zoom);
  };

  return (
    <APIProvider
      apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      <LLMChatInput
        onNewPlaces={handleNewPlaces}
        onSetMapView={handleSetMapView}
      />
      <GoogleMap onCameraChanged={handleCameraChanged}>
        <MapMover center={mapCenter} zoom={mapZoom} />
        <PoiMarkers pois={currentPlaces} />
      </GoogleMap>
    </APIProvider>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
