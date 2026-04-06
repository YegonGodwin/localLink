import { Review } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

class ReviewService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private mapReview(review: any): Review {
    return {
      id: review._id,
      bookingId: review.booking?._id || review.booking,
      serviceId: review.service?._id || review.service,
      providerId: review.provider?._id || review.provider,
      consumerId: review.consumer?._id || review.consumer,
      consumerName: review.consumer?.name || 'Customer',
      consumerAvatar: review.consumer?.avatar || '',
      rating: review.rating,
      comment: review.comment || '',
      createdAt: review.createdAt,
    };
  }

  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to submit review');
    }

    return this.mapReview(data);
  }

  async getServiceReviews(serviceId: string): Promise<Review[]> {
    const res = await fetch(`${API_URL}/reviews/service/${serviceId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to load reviews');
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((review) => this.mapReview(review));
  }
}

export default new ReviewService();
