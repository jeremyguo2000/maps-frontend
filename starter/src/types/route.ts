export interface Polyline {
  encodedPolyline: string;
}

export interface Route {
  distanceMeters: number;
  duration: string;
  polyline: Polyline;
}

// This interface represents the full API response body
export interface RoutesResponse {
  routes: Route[];
}