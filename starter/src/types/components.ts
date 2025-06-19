import { Poi, MapViewData } from "./";

export interface LLMChatInputProps {
  onNewPlaces: (places: Poi[]) => void;
  onSetMapView: (mapView: MapViewData | null) => void;
}

export interface PoiMarkersProps {
  pois: Poi[];
}

export interface MapMoverProps {
  center: { lat: number; lng: number };
  zoom: number;
}
