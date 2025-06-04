import React, { useState, useRef, useEffect, useCallback } from 'react'; 
import {createRoot} from "react-dom/client";
import {AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, Pin, useMap, InfoWindow} from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import { Circle } from './components/circle';

type Poi ={ key: string, name: string, location: google.maps.LatLngLiteral }
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
  // Add other fields you might retrieve and want to display
}

const locations: Poi[] = [
   {key: 'operaHouse', name: 'Sydney Opera House', location: { lat: -33.8567844, lng: 151.213108 }},
  {key: 'tarongaZoo', name: 'Taronga Zoo', location: { lat: -33.8472767, lng: 151.2188164 }},
  {key: 'manlyBeach', name: 'Manly Beach', location: { lat: -33.8209738, lng: 151.2563253 }},
  {key: 'hyderPark', name: 'Hyde Park', location: { lat: -33.8690081, lng: 151.2052393 }},
  {key: 'theRocks', name: 'The Rocks', location: { lat: -33.8587568, lng: 151.2058246 }},
  {key: 'circularQuay', name: 'Circular Quay', location: { lat: -33.858761, lng: 151.2055688 }},
  {key: 'harbourBridge', name: 'Sydney Harbour Bridge', location: { lat: -33.852228, lng: 151.2038374 }},
  {key: 'kingsCross', name: 'Kings Cross', location: { lat: -33.8737375, lng: 151.222569 }},
  {key: 'botanicGardens', name: 'Royal Botanic Garden', location: { lat: -33.864167, lng: 151.216387 }},
  {key: 'museumOfSydney', name: 'Museum of Sydney', location: { lat: -33.8636005, lng: 151.2092542 }},
  {key: 'maritimeMuseum', name: 'Australian National Maritime Museum', location: { lat: -33.869395, lng: 151.198648 }},
  {key: 'kingStreetWharf', name: 'King Street Wharf', location: { lat: -33.8665445, lng: 151.1989808 }},
  {key: 'aquarium', name: 'SEA LIFE Sydney Aquarium', location: { lat: -33.869627, lng: 151.202146 }},
  {key: 'darlingHarbour', name: 'Darling Harbour', location: { lat: -33.87488, lng: 151.1987113 }},
  {key: 'barangaroo', name: 'Barangaroo Reserve', location: { lat: -33.8605523, lng: 151.1972205 }},
];


// TODO: set up agent to fetch places information
// TODO: get places information from the backend server

const App = () => (
 <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Maps API has loaded.')}>
   <h1>Hello, world!</h1>
    <Map
      defaultZoom={13}
      defaultCenter={ { lat: -33.860664, lng: 151.208138 } }
      mapId = 'test_map_id'
        onCameraChanged={ (ev: MapCameraChangedEvent) =>
        console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
      }>
    <PoiMarkers pois={locations} />
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

  const handleClick = useCallback((ev: google.maps.MapMouseEvent, poi: Poi) => {
    if(!map) return;
    if(!ev.latLng) return;
    console.log('marker clicked:', ev.latLng.toString());
    map.panTo(ev.latLng);
    setCircleCenter(ev.latLng);

    // Set InfoWindow state
    setInfoWindowContent(poi);
    setInfoWindowPosition(ev.latLng);
    setInfoWindowOpen(true);

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
      <Circle
          radius={800}
          center={circleCenter}
          strokeColor={'#0c4cb3'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={'#3b82f6'}
          fillOpacity={0.3}
        />
      {props.pois.map( (poi: Poi) => (
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

