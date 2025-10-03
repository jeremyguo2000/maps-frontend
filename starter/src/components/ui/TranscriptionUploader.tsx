import React, { useState } from "react";

const TranscriptionUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        setTranscript(`Error: ${data.error}`);
      } else {
        setTranscript(data.transcript);
      }
    } catch (err) {
      setTranscript("Error uploading file.");
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload & Transcribe
      </button>
      {transcript && (
        <div style={{ marginTop: "15px", whiteSpace: "pre-wrap" }}>
          <strong>Transcript:</strong>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionUploader;
