# Recommendation Service Integration

## Setup Instructions

### 1. Install axios dependency
```bash
cd backend
npm install axios
```

### 2. Start the Recommendation Service
```bash
cd ../recommendation-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The recommendation service will run on `http://localhost:8001`

### 3. Start the Backend
```bash
cd ../backend
npm run dev
```

The backend will run on `http://localhost:5000`

## API Endpoints

### Get Recommendations (Hybrid Model)
```
GET /api/recommendations/services?limit=10&model=hybrid
Authorization: Bearer <token>
```

### Get Similar Services
```
GET /api/recommendations/similar/:serviceId?limit=10
Authorization: Bearer <token>
```

### Get Personalized Recommendations
```
GET /api/recommendations/personalized?limit=10
Authorization: Bearer <token>
```

### Health Check
```
GET /api/recommendations/health
Authorization: Bearer <token>
```

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "_id": "service_id",
      "name": "Service Name",
      "description": "Service description",
      "price": 100,
      "category": "Category",
      "provider": {
        "name": "Provider Name",
        "email": "provider@example.com"
      },
      "recommendationScore": 0.95,
      "recommendationReason": "Based on your preferences"
    }
  ],
  "modelUsed": "hybrid"
}
```

## Fallback Behavior

If the recommendation service is unavailable, the system automatically falls back to:
- Popular services (sorted by booking count)
- Same category services (for similar services)
- User's booking history categories (for personalized)

## Environment Variables

Add to `backend/.env`:
```
RECOMMENDATION_SERVICE_URL=http://localhost:8001
```

## Docker Deployment

To run both services with Docker:

```bash
# Build recommendation service
cd recommendation-service
docker build -t recommendation-service .

# Run recommendation service
docker run -d -p 8001:8001 --name rec-service recommendation-service

# Update backend .env
RECOMMENDATION_SERVICE_URL=http://rec-service:8001

# Run backend (assuming you have a Dockerfile)
docker-compose up
```

## Testing

Test the recommendation service directly:
```bash
curl http://localhost:8001/health
```

Test through backend:
```bash
curl -H "Authorization: Bearer <your_token>" \
  http://localhost:5000/api/recommendations/health
```
