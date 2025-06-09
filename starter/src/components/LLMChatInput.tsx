// components/LLMChatInput.jsx
import React, { useState } from 'react';

// You can define this function directly in this file, or import it if it's in utils.js
// For simplicity in this new component, I'll put it here.
const callLLM = async ({
  prompt,
  setLlmResponse,
  setIsLoading,
  clearInput, // New prop to allow clearing input from parent
}: {
  prompt: string;
  setLlmResponse: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearInput: () => void;
}) => {
  if (!prompt.trim()) {
    return;
  }

  setIsLoading(true);
  setLlmResponse('');
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/gemini-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
        signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from server.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      accumulatedResponse += chunk;
      setLlmResponse(accumulatedResponse);
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'AbortError') {
      console.log('Fetch aborted');
    } else {
      console.error('Error fetching LLM response:', error);
      setLlmResponse(`Error: ${(error as any)?.message || 'Could not get response from LLM.'}`);
    }
  } finally {
    setIsLoading(false);
    clearInput(); // Call the clearInput function passed from parent
  }
};


const LLMChatInput = () => {
  const [inputValue, setInputValue] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearInput = () => {
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      callLLM({
        prompt: inputValue,
        setLlmResponse,
        setIsLoading,
        clearInput: handleClearInput, // Pass the function to clear input
      });
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '10px auto' }}>
      <input
        type="text"
        placeholder="Command me e.g., Add a pin for Eiffel Tower and show me its details"
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '1.2em',
          marginBottom: '10px',
        }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />

      {isLoading && <p>Loading LLM response...</p>}
      {llmResponse && (
        <div style={{
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f9f9f9',
          marginTop: '10px'
        }}>
          <strong>LLM Response:</strong> {llmResponse}
        </div>
      )}
    </div>
  );
};

export default LLMChatInput;