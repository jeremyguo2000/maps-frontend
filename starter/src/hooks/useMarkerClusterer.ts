import { useRef, useEffect, useCallback } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";

export const useMarkerClusterer = () => {
  const map = useMap();
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // Initialize MarkerClusterer when the map is available
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }

    return () => {
      if (clusterer.current) {
        clusterer.current.setMap(null);
        clusterer.current = null;
      }
    };
  }, [map]);

  // Function to add/remove markers
  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    const currentMarkers = markersRef.current;

    // If the marker exists and is already stored, do nothing
    if (marker && currentMarkers[key] === marker) {
      return;
    }

    // If the marker is null and it's not in our storage, do nothing
    if (!marker && !currentMarkers[key]) {
      return;
    }

    // Update the markers ref
    if (marker) {
      currentMarkers[key] = marker;
    } else {
      delete currentMarkers[key];
    }

    // Update the clusterer
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(Object.values(currentMarkers));
    }
  }, []);

  return { setMarkerRef };
};
