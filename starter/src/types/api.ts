import type { MapViewData, Poi } from "./";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export interface LLMChatResponse extends ApiResponse {
  places?: Poi[];
  map_view?: MapViewData;
  display_on_map_place_ids?: string[];
}

export interface PlaceSearchRequest {
  textQuery: string;
}

export interface PlaceDetailsRequest {
  place_id: string;
}
