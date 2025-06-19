export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface Poi {
  key: string;
  name: string;
  location: PlaceLocation;
  place_id: string;
}

export interface PlaceDetails {
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  // Add other fields as needed
}
