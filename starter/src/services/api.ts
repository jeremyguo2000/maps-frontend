// services/api.ts
class ApiService {
  private baseUrl = `${import.meta.env.VITE_API_URL}`;

  // TODO: fill up this

  async chatWithLLM(prompt: string) {
    const response = await fetch(`${this.baseUrl}/gemini-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    return response.json();
  }

  async getPlaceDetails(placeId: string) {
    const response = await fetch(
      `${this.baseUrl}/place-details?place_id=${placeId}`,
    );
    return response.json();
  }
}

export const apiService = new ApiService();
