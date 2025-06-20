import React, { useState, useCallback, useMemo } from "react";
import {
  AdvancedMarker,
  Pin,
  useMap,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { Circle } from "../../components/circle";
import { usePlaceDetails } from "../../hooks/usePlaceDetails";
import { useMarkerClusterer } from "../../hooks/useMarkerClusterer";
import type { Poi } from "../../types";

const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap();
  const { setMarkerRef } = useMarkerClusterer();
  const [circleCenter, setCircleCenter] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const { selectedPlaceDetails, loadingPlaceDetails } =
    usePlaceDetails(selectedPlaceId);

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
      {infoWindowOpen && infoWindowPosition && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={() => {
            setInfoWindowOpen(false);
            setSelectedPlaceId(null);
          }}
        >
          {loadingPlaceDetails ? (
            <div>Loading place details...</div>
          ) : selectedPlaceDetails ? (
            <div>
              <h3>{selectedPlaceDetails.name}</h3>
              {selectedPlaceDetails.formatted_address && (
                <p>Address: {selectedPlaceDetails.formatted_address}</p>
              )}
              {selectedPlaceDetails.rating && (
                <p>
                  Rating: {selectedPlaceDetails.rating} (
                  {selectedPlaceDetails.user_ratings_total} reviews)
                </p>
              )}
              {selectedPlaceDetails.international_phone_number && (
                <p>Phone: {selectedPlaceDetails.international_phone_number}</p>
              )}
              {selectedPlaceDetails.website && (
                <p>
                  <a
                    href={selectedPlaceDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </a>
                </p>
              )}
              {selectedPlaceDetails.opening_hours &&
                selectedPlaceDetails.opening_hours.weekday_text && (
                  <div>
                    <h4>Opening Hours:</h4>
                    <ul>
                      {selectedPlaceDetails.opening_hours.weekday_text.map(
                        (day, index) => (
                          <li key={index}>{day}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            <div>
              <h3>
                {infoWindowPosition
                  ? `Place at Lat: ${infoWindowPosition.lat.toFixed(4)}, Lng: ${infoWindowPosition.lng.toFixed(4)}`
                  : "No Place Selected"}
              </h3>
              <p>
                No detailed information available for this place, or place ID is
                missing.
              </p>
            </div>
          )}
        </InfoWindow>
      )}
    </>
  );
};

export default PoiMarkers;
