import React, { useState, useCallback, useMemo } from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { Circle } from "../../components/circle";
import { useMarkerClusterer } from "../../hooks/useMarkerClusterer";
import type { Poi } from "../../types";
import PlaceDetailsInfoWindow from "./PlaceDetailsInfoWindow";

const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap();
  const { setMarkerRef } = useMarkerClusterer();
  const [circleCenter, setCircleCenter] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const handleClick = useCallback(
    (ev: google.maps.MapMouseEvent, poi: Poi) => {
      if (!map) return;
      if (!ev.latLng) return;
      console.log("marker clicked:", ev.latLng.toString());
      map.panTo(ev.latLng);
      setCircleCenter({ lat: ev.latLng.lat(), lng: ev.latLng.lng() });
      setInfoWindowPosition({ lat: ev.latLng.lat(), lng: ev.latLng.lng() });
      setInfoWindowOpen(true);

      if (poi.place_id) {
        setSelectedPlaceId(poi.place_id);
      } else {
        setSelectedPlaceId(null);
        console.warn(
          `No place_id available for ${poi.name}. Cannot fetch details.`,
        );
      }
    },
    [map],
  );
  const handleInfoWindowClose = useCallback(() => {
    setInfoWindowOpen(false);
    setSelectedPlaceId(null);
  }, []);

  // Create a stable map of ref callbacks, only recreating when poi keys change
  const refCallbacks = useMemo(() => {
    const callbacks = new Map<string, (marker: any) => void>();

    props.pois.forEach((poi) => {
      if (!callbacks.has(poi.key)) {
        callbacks.set(poi.key, (marker) => setMarkerRef(marker, poi.key));
      }
    });

    return callbacks;
  }, [props.pois.map((poi) => poi.key).join(","), setMarkerRef]);

  return (
    <>
      <Circle
        radius={800}
        center={circleCenter}
        strokeColor={"#0c4cb3"}
        strokeOpacity={1}
        strokeWeight={3}
        fillColor={"#3b82f6"}
        fillOpacity={0.3}
      />
      {props.pois.map((poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          onClick={(ev) => handleClick(ev, poi)}
          ref={refCallbacks.get(poi.key)}
        >
          <Pin
            background={"#FBBC04"}
            glyphColor={"#000"}
            borderColor={"#000"}
          />
        </AdvancedMarker>
      ))}
      {infoWindowOpen && (
        <PlaceDetailsInfoWindow
          position={infoWindowPosition}
          placeId={selectedPlaceId}
          onClose={handleInfoWindowClose}
        />
      )}
    </>
  );
};

export default PoiMarkers;
