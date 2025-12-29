#!/bin/bash

# ThreatStream Backend Deployment Script for Google Cloud Run
# This script deploys the FastAPI backend to Cloud Run with Vertex AI integration

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="threatstream-api"
REGION="us-central1"
MEMORY="2Gi"
CPU="2"
MIN_INSTANCES="0"
MAX_INSTANCES="10"
TIMEOUT="300"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ThreatStream Backend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project selected${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}Service: $SERVICE_NAME${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Prompt for Confluent credentials if not set
read -p "Enter your GCP Project ID (for Vertex AI): " GCP_PROJECT_ID
read -p "Enter Confluent Bootstrap Server: " CONFLUENT_SERVER
read -p "Enter Confluent API Key: " CONFLUENT_KEY
read -sp "Enter Confluent API Secret: " CONFLUENT_SECRET
echo ""

# Deploy to Cloud Run
echo -e "${GREEN}Deploying backend to Cloud Run...${NC}"

cd backend

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory $MEMORY \
  --cpu $CPU \
  --min-instances $MIN_INSTANCES \
  --max-instances $MAX_INSTANCES \
  --timeout $TIMEOUT \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "DEBUG=false" \
  --set-env-vars "API_PORT=8080" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$GCP_PROJECT_ID" \
  --set-env-vars "GCP_REGION=$REGION" \
  --set-env-vars "GEMINI_MODEL=gemini-1.5-flash" \
  --set-env-vars "CONFLUENT_BOOTSTRAP_SERVERS=$CONFLUENT_SERVER" \
  --set-env-vars "CONFLUENT_API_KEY=$CONFLUENT_KEY" \
  --set-env-vars "CONFLUENT_API_SECRET=$CONFLUENT_SECRET" \
  --set-env-vars "KAFKA_RAW_TOPIC=security.raw.logs" \
  --set-env-vars "KAFKA_ANALYZED_TOPIC=security.analyzed.threats" \
  --set-env-vars "CORS_ORIGINS=*"

cd ..

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backend Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}Test the deployment:${NC}"
echo "curl $SERVICE_URL/api/health"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the API health check"
echo "2. Deploy the frontend with this backend URL"
echo "3. Update CORS_ORIGINS with actual frontend URL"
echo ""
