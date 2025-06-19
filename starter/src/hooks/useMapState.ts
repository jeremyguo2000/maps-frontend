// hooks/useMapState.ts;
import { Poi, MapViewData } from "@/types/index";
import { useState, useCallback } from "react";

export const useMapState = () => {
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 });
  const [mapZoom, setMapZoom] = useState(10);
  const [currentPlaces, setCurrentPlaces] = useState<Poi[]>([]);

  const handleSetMapView = useCallback((mapViewData: MapViewData | null) => {
    if (mapViewData?.latitude && mapViewData?.longitude) {
      setMapCenter({ lat: mapViewData.latitude, lng: mapViewData.longitude });
      setMapZoom(mapViewData.zoom_level || 12);
    }
  }, []);

  return {
    mapCenter,
    mapZoom,
    currentPlaces,
    setCurrentPlaces,
    handleSetMapView,
  };
};
