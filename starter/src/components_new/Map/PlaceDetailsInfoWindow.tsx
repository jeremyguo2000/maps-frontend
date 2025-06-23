// components/PlaceDetailsInfoWindow.tsx
import React from "react";
import { InfoWindow } from "@vis.gl/react-google-maps";
// TODO: use the simpler path
import { usePlaceDetails } from "../../hooks/usePlaceDetails";

interface PlaceDetailsInfoWindowProps {
  position: google.maps.LatLngLiteral | null;
  placeId: string | null;
  onClose: () => void;
}

const PlaceDetailsInfoWindow: React.FC<PlaceDetailsInfoWindowProps> = ({
  position,
  placeId,
  onClose,
}) => {
  const { selectedPlaceDetails, loadingPlaceDetails } =
    usePlaceDetails(placeId);

  if (!position) return null; // Don't render if there's no position

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
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
                    (day: string, index: number) => (
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
            {position
              ? `Place at Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`
              : "No Place Selected"}
          </h3>
          <p>
            No detailed information available for this place, or place ID is
            missing.
          </p>
        </div>
      )}
    </InfoWindow>
  );
};

export default PlaceDetailsInfoWindow;
