#!/bin/bash

# ThreatStream Frontend Deployment Script for Google Cloud Run
# This script deploys the React frontend to Cloud Run

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="threatstream-ui"
REGION="us-central1"
MEMORY="1Gi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="5"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ThreatStream Frontend Deployment${NC}"
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

# Prompt for backend URL
read -p "Enter Backend API URL (from backend deployment): " BACKEND_URL

# Construct WebSocket URL
WS_URL="wss://${BACKEND_URL#https://}/ws/live"

echo -e "${YELLOW}Backend API URL: $BACKEND_URL${NC}"
echo -e "${YELLOW}WebSocket URL: $WS_URL${NC}"
echo ""

# Deploy to Cloud Run
echo -e "${GREEN}Deploying frontend to Cloud Run...${NC}"

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory $MEMORY \
  --cpu $CPU \
  --min-instances $MIN_INSTANCES \
  --max-instances $MAX_INSTANCES \
  --build-env-vars "VITE_BACKEND_API_URL=$BACKEND_URL" \
  --build-env-vars "VITE_BACKEND_WS_URL=$WS_URL" \
  --build-env-vars "VITE_ENVIRONMENT=production"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Update backend CORS settings${NC}"
echo "Run the following command to allow frontend access:"
echo ""
echo "gcloud run services update threatstream-api \\"
echo "  --region $REGION \\"
echo "  --update-env-vars CORS_ORIGINS=$SERVICE_URL"
echo ""
echo -e "${YELLOW}Then open your application:${NC}"
echo "$SERVICE_URL"
echo ""
