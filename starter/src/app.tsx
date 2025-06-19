import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  MapCameraChangedEvent,
  Pin,
  useMap,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { Circle } from "./components/circle";
import "./index.css";
import LLMChatInput from "./components/LLMChatInput";
import type { Poi, PlaceDetails } from "./types";

interface MapViewData {
  latitude: number;
  longitude: number;
  zoom_level?: number;
  place_name?: string;
}

const App = () => {
  const [currentPlaces, setCurrentPlaces] = useState<Poi[]>([]);
  const handleNewPlaces = (places: Poi[]) => {
    setCurrentPlaces(places);
  };

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 1.3521,
    lng: 103.8198,
  });
  const [mapZoom, setMapZoom] = useState<number>(10); //

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

  return (
    <APIProvider
      apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      <LLMChatInput
        onNewPlaces={handleNewPlaces}
        onSetMapView={handleSetMapView}
      />
      <Map
        defaultZoom={13}
        defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
        mapId="test_map_id"
        onCameraChanged={(ev: MapCameraChangedEvent) =>
          console.log(
            "camera changed:",
            ev.detail.center,
            "zoom:",
            ev.detail.zoom,
          )
        }
      >
        <MapMover center={mapCenter} zoom={mapZoom} />
        <PoiMarkers pois={currentPlaces} />
      </Map>
    </APIProvider>
  );
};

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

const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap();
  const [markers, setMarkers] = useState({} as { [key: string]: Marker });
  // Create a ref to hold the MarkerClusterer instance
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [circleCenter, setCircleCenter] =
    useState<google.maps.LatLngLiteral | null>(null);

  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] =
    useState<PlaceDetails | null>(null); // New state for detailed info
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false); // New state for loading indicator

  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    setLoadingPlaceDetails(true);
    setSelectedPlaceDetails(null); // Clear previous details
    try {
      // TODO: don't hardcode the URL
      const response = await fetch(
        `http://127.0.0.1:5000/api/place-details?place_id=${placeId}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PlaceDetails = await response.json();
      setSelectedPlaceDetails(data);
    } catch (error) {
      console.error("Failed to fetch place details:", error);
      // Handle error, maybe display a message in the InfoWindow
    } finally {
      setLoadingPlaceDetails(false);
    }
  }, []);

  const handleClick = useCallback(
    (ev: google.maps.MapMouseEvent, poi: Poi) => {
      if (!map) return;
      if (!ev.latLng) return;
      console.log("marker clicked:", ev.latLng.toString());
      map.panTo(ev.latLng);
      setCircleCenter({ lat: ev.latLng.lat(), lng: ev.latLng.lng() });
      setInfoWindowPosition({ lat: ev.latLng.lat(), lng: ev.latLng.lng() });
      setInfoWindowOpen(true);

      // TODO: fetch place details from the backend server
      if (poi.place_id) {
        fetchPlaceDetails(poi.place_id);
      } else {
        setSelectedPlaceDetails(null); // Clear details if no place_id
        console.warn(
          `No place_id available for ${poi.name}. Cannot fetch details.`,
        );
      }
    },
    [map, fetchPlaceDetails],
  );

  // Initialize MarkerClusterer, if the map has changed
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update markers, if the markers array has changed
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;

    setMarkers((prev) => {
      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

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
          onClick={(ev) => handleClick(ev, poi)} // Pass both event and poi
          ref={(marker) => setMarkerRef(marker, poi.key)}
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
            setSelectedPlaceDetails(null); // Clear details when closing
          }}
        >
          {loadingPlaceDetails ? (
            <div>Loading place details...</div>
          ) : selectedPlaceDetails ? (
            // Display detailed information from selectedPlaceDetails
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
              {/* You can add more fields here based on your PlaceDetails type */}
            </div>
          ) : (
            // Fallback if no details are fetched or place_id is missing
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

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
