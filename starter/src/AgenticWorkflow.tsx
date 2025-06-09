// AgenticWorkflow.tsx
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PoiMarkers from "./PoiMarkers"; // Assumes you already have this

export default function AgenticWorkflow() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pois, setPois] = useState([]);
  const [details, setDetails] = useState(null);
  const [highlightedPoi, setHighlightedPoi] = useState(null);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setMessage("");
    setPois([]);
    setDetails(null);
    setHighlightedPoi(null);

    try {
      const res = await fetch("http://localhost:5000/api/agent-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: inputText }),
      });

      const data = await res.json();

      switch (data.action) {
        case "add_and_show_details":
          setPois((prev) => [...prev, data.poi]);
          setHighlightedPoi(data.poi.place_id);
          setDetails(data.details);
          break;
        case "show_details_only":
          setDetails(data.details);
          setHighlightedPoi(null);
          break;
        case "display_message":
          setMessage(data.message);
          if (data.places) setPois(data.places);
          break;
        default:
          setMessage("Unknown response from agent.");
      }
    } catch (error) {
      setMessage("Error contacting agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ask the agent something..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={loading}>
          Send
        </Button>
      </div>

      {message && (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <p>{message}</p>
          </CardContent>
        </Card>
      )}

      <PoiMarkers pois={pois} highlight={highlightedPoi} />

      {details && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-xl font-semibold">{details.name}</h2>
            <p>{details.formatted_address}</p>
            {details.rating && <p>Rating: {details.rating} ⭐</p>}
            {details.website && (
              <a
                href={details.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Visit Website
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
