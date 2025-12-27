# ThreatStream Backend

Real-time AI-powered cybersecurity threat detection platform backend.

## Architecture

- **FastAPI** - High-performance async web framework
- **Confluent Kafka** - Real-time event streaming
- **Google Gemini AI** - Threat analysis and classification
- **Firestore** - NoSQL database for threat storage
- **WebSocket** - Real-time dashboard updates

## Prerequisites

- Python 3.11+
- Confluent Cloud account (for Kafka)
- Google Cloud Platform account (for Gemini AI & Firestore)

## Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
   - Confluent Cloud Kafka credentials
   - Google Cloud Project ID
   - Gemini API Key
   - Firestore configuration

## Running the Backend

### Development Mode

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## WebSocket Connection

Connect to real-time threat stream:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/live');
```

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes & WebSocket
│   ├── core/             # Kafka, Gemini, core infrastructure
│   ├── services/         # Business logic services
│   ├── models/           # Pydantic data models
│   ├── utils/            # Utility functions
│   ├── config.py         # Configuration management
│   └── main.py           # FastAPI application
├── simulator/            # Attack simulation engine
├── tests/                # Test suite
├── requirements.txt
├── .env.example
└── README.md
```

## Key Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `WS /ws/live` - Real-time threat stream
- `GET /api/threats/recent` - Recent threats
- `GET /api/analytics/dashboard` - Dashboard metrics
- `POST /api/simulation/start` - Start attack simulation
- `POST /api/playbooks/execute` - Execute response playbook

## Environment Variables

See `.env.example` for all configuration options.

### Required:
- `CONFLUENT_BOOTSTRAP_SERVERS` - Kafka bootstrap servers
- `CONFLUENT_API_KEY` - Kafka API key
- `CONFLUENT_API_SECRET` - Kafka API secret
- `GOOGLE_CLOUD_PROJECT` - GCP project ID
- `GEMINI_API_KEY` - Gemini API key

### Optional:
- `DEBUG` - Enable debug mode (default: false)
- `LOG_LEVEL` - Logging level (default: INFO)
- `SIMULATION_ENABLED` - Enable attack simulation (default: true)

## Testing

```bash
pytest tests/ -v
```

## Docker Deployment

```bash
# Build image
docker build -t threatstream-backend .

# Run container
docker run -p 8000:8000 --env-file .env threatstream-backend
```

## Development

### Adding a New Route

1. Create route file in `app/api/routes/`
2. Define endpoints using FastAPI decorators
3. Include router in `app/main.py`

### Adding a New Service

1. Create service file in `app/services/`
2. Implement business logic
3. Inject into routes as needed

### Adding Attack Scenarios

1. Create scenario in `simulator/scenarios/`
2. Define attack pattern with MITRE mapping
3. Register in simulation service

## Monitoring

- Logs: stdout (structured logging)
- Metrics: Available via `/api/kafka/cluster`
- Health: `/api/health`

## Support

For issues or questions, refer to the main ThreatStream documentation or CLAUDE.md file.
