// src/types.ts
export type Poi = {
  key: string;
  name: string;
  location: google.maps.LatLngLiteral;
  place_id?: string;
};

export type PlaceDetails = {
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

