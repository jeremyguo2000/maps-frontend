import { useState } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider, GoogleMapsContext, MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { Polyline } from "@react-google-maps/api";
import "./index.css";
import LLMChatInput from "./components/Chat/LLMChatInput";
import type { Poi } from "./types";
import { MapViewData } from "./types/index"; // TODO: why is this path not the shortcut
import PoiMarkers from "./components/Map/PoiMarkers";
import MapMover from "./components/Map/MapMover";
import GoogleMap from "./components/Map/GoogleMap";
import {RoutesResponse } from "./types/route";
import { decode } from "@googlemaps/polyline-codec";
import { useMap } from "@vis.gl/react-google-maps";
import RouteViewer from "./components/Map/RouteViewer";
import TranscriptionUploader from "./components/ui/TranscriptionUploader";
import StreamingTranscriber from "./components/ui/StreamingTranscriber";

const App = () => {
  const [currentPlaces, setCurrentPlaces] = useState<Poi[]>([]);

  const handleNewSessionId = (newId: string) => {
    console.log("New session ID received:", newId);
    // Here you can update the session ID in your app state if needed
    setChatSessionId(newId);
  };

  const handleNewPlaces = (places: Poi[]) => {
    setCurrentPlaces(places);
  };

  const handleNewRoutes = (routes: RoutesResponse) => {
    setRoutes(routes);
    console.log("routes i found:", routes);
  }

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -33.8688,
    lng: 151.2093,
  });
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RoutesResponse | null>(null);

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
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}
      libraries={['geometry']}
      onLoad={() => console.log("Maps API has loaded.")}
    >
    <div style={{ width: '600px' }}>
    <LLMChatInput
      onNewPlaces={handleNewPlaces}
      onSetMapView={handleSetMapView}
      onHandleNewRoutes={handleNewRoutes}
      chatSessionId={chatSessionId}
      onNewSessionId={handleNewSessionId}
    />
    <TranscriptionUploader />
    <StreamingTranscriber/>
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
  <div style={{ width: '500px', height: '500px' }}>
    <GoogleMap onCameraChanged={handleCameraChanged}>
      <MapMover center={mapCenter} zoom={mapZoom} />
      <PoiMarkers pois={currentPlaces} />
      {routes && <RouteViewer routes={routes} />}
    </GoogleMap>
  </div>
</div>
  </div>
    </APIProvider>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
