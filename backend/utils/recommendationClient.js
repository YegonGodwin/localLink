import axios from 'axios';

class RecommendationClient {
  constructor() {
    this.baseURL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8001';
    this.timeout = 5000; // 5 seconds timeout
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Recommendation service health check failed:', error.message);
      return { status: 'unavailable', error: error.message };
    }
  }

  async getServiceRecommendations(userId, limit = 10, modelType = 'hybrid') {
    try {
      const response = await this.client.get(
        `/api/recommendations/services/${userId}`,
        { params: { limit, model: modelType } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get service recommendations:', error.message);
      throw error;
    }
  }

  async getSimilarServices(serviceId, limit = 10) {
    try {
      const response = await this.client.get(
        `/api/recommendations/similar/${serviceId}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get similar services:', error.message);
      throw error;
    }
  }

  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      const response = await this.client.get(
        `/api/recommendations/personalized/${userId}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error.message);
      throw error;
    }
  }
}

export default new RecommendationClient();
