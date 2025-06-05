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

type Poi = {
  key: string;
  name: string;
  location: google.maps.LatLngLiteral;
  place_id?: string;
};
type PlaceDetails = {
  name: string;
  place_id?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text: string[];
  };
  website?: string;
  international_phone_number?: string;
  photos?: Array<{
    photo_reference: string;
    html_attributions: string[];
    height: number;
    width: number;
  }>;
};

const locations: Poi[] = [
  {
    key: "operaHouse",
    name: "Sydney Opera House",
    location: {
      lat: -33.8567844,
      lng: 151.213108,
    },
    place_id: "ChIJ3S-JXmauEmsRUcIaWtf4MzE",
  },
  {
    key: "tarongaZoo",
    name: "Taronga Zoo",
    location: {
      lat: -33.8472767,
      lng: 151.2188164,
    },
    place_id: "ChIJq6qqWiSsEmsRJuIpepyEua4",
  },
  {
    key: "manlyBeach",
    name: "Manly Beach",
    location: {
      lat: -33.8209738,
      lng: 151.2563253,
    },
    place_id: "ChIJK8ybIQmrEmsRUHjYur4mf6k",
  },
  {
    key: "hyderPark",
    name: "Hyde Park",
    location: {
      lat: -33.8690081,
      lng: 151.2052393,
    },
    place_id: "ChIJhRoYKUkFdkgRDL20SU9sr9E",
  },
  {
    key: "theRocks",
    name: "The Rocks",
    location: {
      lat: -33.8587568,
      lng: 151.2058246,
    },
    place_id: "ChIJs49dtkKuEmsRYM0yFmh9AQU",
  },
  {
    key: "circularQuay",
    name: "Circular Quay",
    location: {
      lat: -33.858761,
      lng: 151.2055688,
    },
    place_id: "ChIJra9q0mmuEmsR4Hy11eshm38",
  },
  {
    key: "harbourBridge",
    name: "Sydney Harbour Bridge",
    location: {
      lat: -33.852228,
      lng: 151.2038374,
    },
    place_id: "ChIJ49XqJV2uEmsRPsTAF7eOlGg",
  },
  {
    key: "kingsCross",
    name: "Kings Cross",
    location: {
      lat: -33.8737375,
      lng: 151.222569,
    },
    place_id: "ChIJzU08xxAbdkgRuWtd0P4Rb2E",
  },
  {
    key: "botanicGardens",
    name: "Royal Botanic Garden",
    location: {
      lat: -33.864167,
      lng: 151.216387,
    },
    place_id: "ChIJWaTdYGuuEmsRoOfx-Wh9AQ8",
  },
  {
    key: "museumOfSydney",
    name: "Museum of Sydney",
    location: {
      lat: -33.8636005,
      lng: 151.2092542,
    },
    place_id: "ChIJ_1pC8mmuEmsRrvud0Ftcoyg",
  },
  {
    key: "maritimeMuseum",
    name: "Australian National Maritime Museum",
    location: {
      lat: -33.869395,
      lng: 151.198648,
    },
    place_id: "ChIJTze93zmuEmsRhvE6T4Y9DhU",
  },
  {
    key: "kingStreetWharf",
    name: "King Street Wharf",
    location: {
      lat: -33.8665445,
      lng: 151.1989808,
    },
    place_id: "ChIJkfDzJ72vEmsR8xtYbk5f0p0",
  },
  {
    key: "aquarium",
    name: "SEA LIFE Sydney Aquarium",
    location: {
      lat: -33.869627,
      lng: 151.202146,
    },
    place_id: "ChIJYV-J-ziuEmsRIMyoFaMedU4",
  },
  {
    key: "darlingHarbour",
    name: "Darling Harbour",
    location: {
      lat: -33.87488,
      lng: 151.1987113,
    },
    place_id: "ChIJt9trB0euEmsR8NbepO14j3M",
  },
  {
    key: "barangaroo",
    name: "Barangaroo Reserve",
    location: {
      lat: -33.8605523,
      lng: 151.1972205,
    },
    place_id: "ChIJs-MWMVuuEmsRN7STbIW1hv8",
  },
];

// TODO: set up agent to fetch places information
// TODO: get places information from the backend server

const App = () => (
  <APIProvider
    apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}
    onLoad={() => console.log("Maps API has loaded.")}
  >
    <h1>Hello, world!</h1>
    <input
      type="text"
      placeholder="Command me e.g., Add a pin for Eiffel Tower and show me its details"
      style={{
        width: "100%", // Takes up 100% of parent's width
        maxWidth: "700px", // But won't exceed 700px
        margin: "10px",
        padding: "10px",
        fontSize: "1.2em",
      }}
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
      <PoiMarkers pois={locations} />
    </Map>
  </APIProvider>
);

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
          gmpClickable={true}
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
