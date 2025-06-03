import React, { useState, useRef, useEffect, useCallback } from 'react'; 
import {createRoot} from "react-dom/client";
import {AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, Pin, useMap, InfoWindow} from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import { Circle } from './components/circle';

type Poi ={ key: string, name: string, location: google.maps.LatLngLiteral, place_id?: string }
type PlaceDetails = {
  name: string;
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
  place_id?: string;
  // Add other fields you might retrieve and want to display
}

const initialLocations: Poi[] = [
   {key: 'operaHouse', name: 'Sydney Opera House', location: { lat: -33.8567844, lng: 151.213108 }, place_id: 'ChIJ33bq_dKuEmsRaQZBx63f2J0'},
  {key: 'tarongaZoo', name: 'Taronga Zoo', location: { lat: -33.8472767, lng: 151.2188164 }, place_id: 'ChIJP-JzOsqvEmsReA4B952Xh8k'},
  {key: 'manlyBeach', name: 'Manly Beach', location: { lat: -33.8209738, lng: 151.2563253 }, place_id: 'ChIJXQJ1MsiuEmsRm7R352Xh8k'},
  {key: 'hyderPark', name: 'Hyde Park', location: { lat: -33.8690081, lng: 151.2052393 }, place_id: 'ChIJl-F5J72uEmsREjR0B952Xh8k'},
  {key: 'theRocks', name: 'The Rocks', location: { lat: -33.8587568, lng: 151.2058246 }, place_id: 'ChIJr-E4KrmuEmsRL6NfB952Xh8k'},
  {key: 'circularQuay', name: 'Circular Quay', location: { lat: -33.858761, lng: 151.2055688 }, place_id: 'ChIJr-E4KrmuEmsR_d4fB952Xh8k'},
  {key: 'harbourBridge', name: 'Sydney Harbour Bridge', location: { lat: -33.852228, lng: 151.2038374 }, place_id: 'ChIJ96YgB_uuEmsRXK1fB952Xh8k'},
  {key: 'kingsCross', name: 'Kings Cross', location: { lat: -33.8737375, lng: 151.222569 }, place_id: 'ChIJyR940eCvEmsR_t3eB952Xh8k'},
  {key: 'botanicGardens', name: 'Royal Botanic Garden', location: { lat: -33.864167, lng: 151.216387 }, place_id: 'ChIJbQ8L7OmuEmsROJ8_B952Xh8k'},
  {key: 'museumOfSydney', name: 'Museum of Sydney', location: { lat: -33.8636005, lng: 151.2092542 }, place_id: 'ChIJfQ959um2EmsR_v_B952Xh8k'},
  {key: 'maritimeMuseum', name: 'Australian National Maritime Museum', location: { lat: -33.869395, lng: 151.198648 }, place_id: 'ChIJVf_k_dKuEmsRVBbx63f2J0'},
  {key: 'kingStreetWharf', name: 'King Street Wharf', location: { lat: -33.8665445, lng: 151.1989808 }, place_id: 'ChIJX4g8VfiuEmsRvj0fB952Xh8k'},
  {key: 'aquarium', name: 'SEA LIFE Sydney Aquarium', location: { lat: -33.869627, lng: 151.202146 }, place_id: 'ChIJVf_k_dKuEmsRVBbx63f2J0'},
  {key: 'darlingHarbour', name: 'Darling Harbour', location: { lat: -33.87488, lng: 151.1987113 }, place_id: 'ChIJ9_b67fuvEmsR_k5gB952Xh8k'},
  {key: 'barangaroo', name: 'Barangaroo Reserve', location: { lat: -33.8605523, lng: 151.1972205 }, place_id: 'ChIJx_t3ePuuEmsRAz9eB952Xh8k'},
];


// TODO: set up agent to fetch places information
// TODO: get places information from the backend server

const App = () => (
 <APIProvider apiKey={'nil'} onLoad={() => console.log('Maps API has loaded.')}>
   <h1>Hello, world!</h1>
    <Map
      defaultZoom={13}
      defaultCenter={ { lat: -33.860664, lng: 151.208138 } }
      mapId = 'test_map_id'
        onCameraChanged={ (ev: MapCameraChangedEvent) =>
        console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
      }>
    <PoiMarkers pois={initialLocations} />
</Map>
 </APIProvider>
);

const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap();
  const [markers, setMarkers] = useState({} as {[key: string]: Marker});
// Create a ref to hold the MarkerClusterer instance
  const clusterer = useRef(null);
  const [circleCenter, setCircleCenter] = useState(null)

  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [infoWindowContent, setInfoWindowContent] = useState<Poi | null>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // search states
  const [searchText, setSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Combine initial and search results for displaying markers
  const allPois = [...initialLocations, ...searchResults];
  
  const fetchPlaceDetails = useCallback(async (placeId: string) => {
      setIsLoadingDetails(true);
      setErrorDetails(null);
      try {
        const response = await fetch(`http://localhost:5000/api/place-details?place_id=${placeId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: PlaceDetails = await response.json();
        return data;
      } catch (error: any) {
        console.error("Error fetching place details:", error);
        setErrorDetails(error.message || "Failed to fetch details.");
        return null;
      } finally {
        setIsLoadingDetails(false);
      }
    }, []);

    const fetchSearchResults = useCallback(async (query: string) => {
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]); // Clear previous search results
        setInfoWindowOpen(false); // Close info window during new search

        try {
            const response = await fetch(`http://localhost:5000/api/search-places`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ textQuery: query }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.places && data.places.length > 0) {
                setSearchResults(data.places);
                // Optionally, pan map to first result or bounding box of results
                if (map && data.places[0] && data.places[0].location) {
                    map.panTo(data.places[0].location);
                }
            } else {
                setSearchError("No places found for your query.");
            }
        } catch (error: any) {
            console.error("Error searching places:", error);
            setSearchError(error.message || "Failed to perform search.");
        } finally {
            setIsSearching(false);
        }
    }, [map]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (searchText.trim()) {
        fetchSearchResults(searchText);
    }
  }, [searchText, fetchSearchResults]);

  const handleClick = useCallback(async (ev: google.maps.MapMouseEvent, poi: Poi) => {
    if(!map) return;
    if(!ev.latLng) return;
    console.log('marker clicked:', ev.latLng.toString());
    map.panTo(ev.latLng);
    setCircleCenter(ev.latLng);

    // Set InfoWindow state
    setInfoWindowContent(poi);
    setInfoWindowPosition(ev.latLng);
    setInfoWindowOpen(true);

    // search
    setIsLoadingDetails(false);
    setErrorDetails(null);

    // TODO: figure out what new shit is coming from ur api

    if (poi.place_id) {
        const details = await fetchPlaceDetails(poi.place_id);
        if (details) {
          setInfoWindowContent(details);
        }
      } else {
        setErrorDetails("No Place ID available for this location (initial static markers might not have one).");
      }

  }, [map]);

  // Initialize MarkerClusterer, if the map has changed
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({map});
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

    setMarkers(prev => {
      if (marker) {
        return {...prev, [key]: marker};
      } else {
        const newMarkers = {...prev};
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  return (
    <>        
        {/*<div style={{ padding: '10px', background: 'white', borderBottom: '1px solid #ccc', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search for places..."
                    style={{ flexGrow: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button type="submit" disabled={isSearching} style={{ padding: '8px 15px', background: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </form>
            {searchError && <p style={{ color: 'red', marginTop: '5px' }}>{searchError}</p>}
            {searchResults.length > 0 && (
                <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9' }}>
                    <p style={{ margin: '5px', fontWeight: 'bold' }}>Search Results:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {searchResults.map(poi => (
                            <li
                                key={poi.key}
                                onClick={(ev) => handleClick(ev as google.maps.MapMouseEvent, poi)} // Re-use handleClick for search results
                                style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                            >
                                <strong>{poi.name}</strong><br/>
                                <small>{poi.formatted_address}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div> */}
      <Circle
          radius={800}
          center={circleCenter}
          strokeColor={'#0c4cb3'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={'#3b82f6'}
          fillOpacity={0.3}
        />
      {allPois.map( (poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          clickable={true}
          onClick={(ev) => handleClick(ev, poi)} // Pass both event and poi
          ref={marker => setMarkerRef(marker, poi.key)}
          >
            <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
        </AdvancedMarker>
      ))}
      {infoWindowOpen && infoWindowPosition && infoWindowContent && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={() => setInfoWindowOpen(false)}>
          <h3>{infoWindowContent.name}</h3>
          <p>Lat: {infoWindowContent.location.lat.toFixed(4)}, Lng: {infoWindowContent.location.lng.toFixed(4)}</p>
        </InfoWindow>
      )}
    </>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App />);

export default App;

