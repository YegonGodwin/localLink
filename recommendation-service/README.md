# Recommendation Service

FastAPI-based recommendation service for the booking platform.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Place your trained models in the `models/` directory:
   - `content_based.pkl`
   - `collaborative.pkl`
   - `hybrid.pkl`

4. Run the service:
```bash
python app.py
```

The service will run on `http://localhost:8001`

## API Endpoints

- `GET /` - Service status
- `GET /health` - Health check with model status
- `GET /api/recommendations/services/{user_id}` - Get recommendations (hybrid by default)
- `GET /api/recommendations/similar/{service_id}` - Get similar services
- `GET /api/recommendations/personalized/{user_id}` - Get personalized recommendations

## Docker

Build and run:
```bash
docker build -t recommendation-service .
docker run -p 8001:8001 recommendation-service
```

## Next Steps

1. Replace placeholder logic in `recommender.py` with your actual model inference code
2. Add database connection for fetching user/service data
3. Implement caching with Redis
4. Add logging and monitoring
