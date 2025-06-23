// components/LLMChatInput.jsx
import React, { useState } from "react";
import type { Poi } from "@/types";
import { MapViewData } from "@/types/map";

type LLMChatInputProps = {
  onNewPlaces: (places: Poi[]) => void; // Callback to pass places to App
  // onNewMessage: (message: string) => void; // Callback for LLM text messages
  onSetMapView: (mapView: MapViewData | null) => void; // New callback for map view
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
};

const callLLM = async ({
  prompt,
  setLlmResponse,
  setIsLoading,
  clearInput, // New prop to allow clearing input from parent
  onNewPlaces,
  onSetMapView,
}: CallLLMParams) => {
  if (!prompt.trim()) {
    return;
  }

  setIsLoading(true);
  setLlmResponse("");
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch("http://127.0.0.1:5000/api/gemini-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: prompt }),
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

    if (data.status === "success") {
      const places: Poi[] = data.places || [];
      const mapView: MapViewData | undefined = data.map_view;

      setLlmResponse(data.message || "No message received from LLM.");

      if (mapView) {
        onSetMapView(mapView);
      } else {
        onSetMapView(null);
      }
      // TODO:there seem to be more pins on the map than would be expected by the LLM response

      console.log("LLM Response:", data.message);

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
}) => {
  const [inputValue, setInputValue] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClearInput = () => {
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      callLLM({
        prompt: inputValue,
        setLlmResponse,
        setIsLoading,
        clearInput: handleClearInput, // Pass the function to clear input
        onNewPlaces,
        onSetMapView, // Pass the onNewPlaces callback
      });
    }
  };

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
    </div>
  );
};

export default LLMChatInput;
