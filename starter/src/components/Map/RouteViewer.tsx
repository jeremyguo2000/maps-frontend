import { RoutesResponse } from "@/types/route";
import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

const RouteViewer = ({
  routes,
}: {
  routes: RoutesResponse;
}) => {
  const map = useMap(); // Get the map instance
  const polylinesRef = useRef<google.maps.Polyline[]>([]); // Store polyline references

  useEffect(() => {
    if (!map || !routes?.routes?.length) return;

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // Draw all routes
    routes.routes.forEach((route, index) => {
      if (route.polyline?.encodedPolyline) {
        const path = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
        
        const polyline = new google.maps.Polyline({
          path: path,
          strokeColor: getRouteColor(index),
          strokeWeight: 4,
        });

        polyline.setMap(map);
        polylinesRef.current.push(polyline);

        // Add to bounds
        path.forEach(point => bounds.extend(point));
      }
    });

    // Fit map to show all routes
    if (polylinesRef.current.length > 0) {
      map.fitBounds(bounds);
    }

    return () => {
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routes]);

  return null; // This component doesn't render anything visible
};

// Helper function to get different colors for different routes
const getRouteColor = (index: number): string => {
  const colors = ['#FF0000', '#0000FF', '#00FF00', '#FF8C00', '#8A2BE2', '#00CED1'];
  return colors[index % colors.length];
};

export default RouteViewer;