export interface MapViewData {
  latitude: number;
  longitude: number;
  zoom_level?: number;
  place_name?: string;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface CircleOptions {
  center: google.maps.LatLngLiteral | null;
  radius: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  fillColor: string;
  fillOpacity: number;
}
