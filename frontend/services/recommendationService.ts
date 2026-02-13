import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RecommendationResponse {
  success: boolean;
  data: any[];
  modelUsed?: string;
  message?: string;
}

class RecommendationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async getRecommendations(limit: number = 10, model: string = 'hybrid'): Promise<RecommendationResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/recommendations/services`,
        {
          params: { limit, model },
          ...this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  async getSimilarServices(serviceId: string, limit: number = 10): Promise<RecommendationResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/recommendations/similar/${serviceId}`,
        {
          params: { limit },
          ...this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching similar services:', error);
      throw error;
    }
  }

  async getPersonalizedRecommendations(limit: number = 10): Promise<RecommendationResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/recommendations/personalized`,
        {
          params: { limit },
          ...this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/recommendations/health`,
        this.getAuthHeader()
      );
      return response.data;
    } catch (error) {
      console.error('Error checking recommendation service health:', error);
      throw error;
    }
  }
}

export default new RecommendationService();
