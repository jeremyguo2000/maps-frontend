import React, { useState, useRef } from "react";

const StreamingTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    setFinalTranscripts([]);
    setInterimTranscript("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/api/transcribe_stream`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.is_final) {
        setFinalTranscripts((prev) => [...prev, data.transcript]);
        setInterimTranscript("");
      } else {
        setInterimTranscript(data.transcript);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onopen = () => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        // console.log("Chunk size:", event.data.size); // Too noisy
        
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer();
          ws.send(buffer);
        }
      };

      recorder.start(250); // send 250ms chunks
      setIsRecording(true);
    };
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    wsRef.current?.close();
    setIsRecording(false);
  };

  return (
    <div style={{ marginTop: 20 }}>
      {!isRecording ? (
        <button onClick={startRecording}>🎙 Start Recording</button>
      ) : (
        <button onClick={stopRecording}>⏹ Stop Recording</button>
      )}
      <div style={{ marginTop: 15, whiteSpace: "pre-wrap" }}>
        <strong>Transcript:</strong>
        <p>
          {finalTranscripts.join(" ")} {interimTranscript}
        </p>
      </div>
    </div>
  );
};

export default StreamingTranscriber;
