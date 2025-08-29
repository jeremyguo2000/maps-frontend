// components/LLMChatInput.jsx
import React, { useState } from "react";
import type { Poi } from "@/types";
import { MapViewData } from "@/types/map";
import { RoutesResponse } from "@/types/route";

type LLMChatInputProps = {
  onNewPlaces: (places: Poi[]) => void; // Callback to pass places to App
  // onNewMessage: (message: string) => void; // Callback for LLM text messages
  onSetMapView: (mapView: MapViewData | null) => void; // New callback for map view
  chatSessionId: string | null;
  onNewSessionId: (newId: string) => void; // Callback to update sessionId in app.tsx
  onHandleNewRoutes: (routes: RoutesResponse) => void; // Callback to pass route data to App
};

type CallLLMParams = {
  prompt: string;
  setLlmResponse: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearInput: () => void;
  // You might also add onNewPlaces and onNewMessage here if callLLM itself
  // needs to trigger these parent callbacks directly.
  // For now, let's assume LLMChatInput will handle passing LLM's response
  // to onNewMessage after callLLM finishes.
  onNewPlaces: (places: Poi[]) => void;
  onSetMapView: (mapView: MapViewData | null) => void; // New callback for map view
  chatSessionId: string | null;
  onNewSessionId: (newId: string) => void; // Callback to update sessionId in app.tsx
  setPictureUrl: React.Dispatch<React.SetStateAction<string | null>>;
  onHandleNewRoutes: (routes: RoutesResponse) => void; // Callback to pass route data to App
};

const callLLM = async ({
  prompt,
  setLlmResponse,
  setIsLoading,
  clearInput, // New prop to allow clearing input from parent
  onNewPlaces,
  onSetMapView,
  chatSessionId,
  onNewSessionId,
  setPictureUrl,
  onHandleNewRoutes,
}: CallLLMParams) => {
  if (!prompt.trim()) {
    return;
  }

  setIsLoading(true);
  setLlmResponse("");
  const controller = new AbortController();
  const signal = controller.signal;

  const requestBody: { prompt: string; session_id?: string } = {
    prompt: prompt,
  };

  if (chatSessionId) {
    requestBody.session_id = chatSessionId;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gemini-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error("No response body received from server.");
    }

    const data = await response.json();

    if (data.session_id && data.session_id !== chatSessionId) {
      onNewSessionId(data.session_id); // Update the session ID in App.tsx state
    }

    if (data.status === "success") {
      const places: Poi[] = data.places || [];
      const mapView: MapViewData | undefined = data.map_view;
      const routes: RoutesResponse | undefined = data.route;

      setLlmResponse(data.message || "No message received from LLM.");

      if (mapView) {
        onSetMapView(mapView);
      } else {
        onSetMapView(null);
      }
      // TODO:there seem to be more pins on the map than would be expected by the LLM response

      console.log("LLM Response:", data.message);
      
      // test polyline
      // TODO: data is there, but display the route on the map
      console.log("route data:", routes);

      if (routes) {
        onHandleNewRoutes(routes);
      }

      // TODO: why so janky
      if (data.picture_url) {
        console.log("Picture URL received:", data.picture_url.url);
        setPictureUrl(data.picture_url.url);
      }

      if (places.length > 0) {
        const formattedPlaces = places.map((p) => ({
          key: p.place_id ?? "",
          name: p.name,
          location: {
            lat: p.location.lat,
            lng: p.location.lng,
          },
          place_id: p.place_id ?? "",
        }));
        console.log("Formatted Places: ", formattedPlaces);
        // Call the onNewPlaces callback to pass the places to the parent component
        onNewPlaces(formattedPlaces);
      }
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as any).name === "AbortError"
    ) {
      console.log("Fetch aborted");
    } else {
      console.error("Error fetching LLM response:", error);
      setLlmResponse(
        `Error: ${(error as any)?.message || "Could not get response from LLM."}`,
      );
    }
  } finally {
    setIsLoading(false);
    clearInput(); // Call the clearInput function passed from parent
  }
};

const LLMChatInput: React.FC<LLMChatInputProps> = ({
  onNewPlaces,
  onSetMapView,
  chatSessionId,
  onNewSessionId,
  onHandleNewRoutes
}) => {
  const [inputValue, setInputValue] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  const handleClearInput = () => {
    setInputValue("");
  };

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === "Enter") {
      callLLM({
        prompt: inputValue,
        setLlmResponse,
        setIsLoading,
        clearInput: handleClearInput, // Pass the function to clear input
        onNewPlaces,
        onSetMapView, // Pass the onNewPlaces callback
        chatSessionId,
        onNewSessionId,
        setPictureUrl,
        onHandleNewRoutes
      });
    }
  };

  // TODO: add picture display functionality

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto" }}>
      <input
        type="text"
        placeholder="e.g. Show me the best places to go in Sydney"
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "1.2em",
          marginBottom: "10px",
        }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />

      {isLoading && <p>Loading LLM response...</p>}
      {llmResponse && (
        <div
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            whiteSpace: "pre-wrap",
            backgroundColor: "#f9f9f9",
            marginTop: "10px",
          }}
        >
          <strong>LLM Response:</strong> {llmResponse}
        </div>
      )}
      {pictureUrl && (
        <img
          src={pictureUrl}
          alt="LLM provided"
          style={{ maxWidth: "100%", marginTop: "10px" }}
        />
      )}
    </div>
  );
};

export default LLMChatInput;
