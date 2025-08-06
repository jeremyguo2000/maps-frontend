import { PlaceDetails } from "@/types";
import { useState, useEffect } from "react";

export function usePlaceDetails(placeId: string | null) {
  const [selectedPlaceDetails, setSelectedPlaceDetails] =
    useState<PlaceDetails | null>(null); // New state for detailed info
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false); // New state for loading indicator

  useEffect(() => {
    if (!placeId) return;

    const fetchDetails = async () => {
      setLoadingPlaceDetails(true);
      setSelectedPlaceDetails(null); // Clear previous details

      try {
        // TODO: don't hardcode the URL
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/place-details?place_id=${placeId}`,
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
    };
    fetchDetails();
  }, [placeId]);

  return { selectedPlaceDetails, loadingPlaceDetails };
}
