# 🚀 ThreatStream Deployment Guide

Complete guide for deploying ThreatStream to Google Cloud Run for the hackathon competition.

## 📋 Prerequisites

1. **Google Cloud Platform Account**
   - Active GCP project
   - Billing enabled
   - Project ID ready

2. **APIs Enabled** (you should already have these enabled)
   - ✅ Cloud Run Admin API
   - ✅ Cloud Build API
   - ✅ Artifact Registry API
   - ✅ Vertex AI API

3. **Tools Installed**
   - `gcloud` CLI ([install](https://cloud.google.com/sdk/docs/install))
   - Git

4. **Confluent Cloud Credentials**
   - Bootstrap server URL
   - API key
   - API secret

---

## 🎯 Quick Deployment (Automated)

### Step 1: Set Your GCP Project

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud auth login
```

### Step 2: Deploy Backend

```bash
./deploy-backend.sh
```

You'll be prompted for:
- GCP Project ID (for Vertex AI)
- Confluent bootstrap server
- Confluent API key
- Confluent API secret

**Save the backend URL** that's printed at the end!

### Step 3: Deploy Frontend

```bash
./deploy-frontend.sh
```

You'll be prompted for:
- Backend API URL (from Step 2)

### Step 4: Update CORS

Copy and run the command shown at the end of frontend deployment to allow cross-origin requests.

---

## 📦 Manual Deployment

If you prefer manual control:

### Backend Deployment

```bash
cd backend

gcloud run deploy threatstream-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
  --set-env-vars "CONFLUENT_BOOTSTRAP_SERVERS=pkc-xxx.us-east1.gcp.confluent.cloud:9092" \
  --set-env-vars "CONFLUENT_API_KEY=YOUR_KEY" \
  --set-env-vars "CONFLUENT_API_SECRET=YOUR_SECRET"
```

### Frontend Deployment

```bash
cd ..  # Back to root

gcloud run deploy threatstream-ui \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --build-env-vars "VITE_BACKEND_API_URL=https://threatstream-api-xxx.run.app" \
  --build-env-vars "VITE_BACKEND_WS_URL=wss://threatstream-api-xxx.run.app/ws/live"
```

---

## 🔐 Security & Permissions

### Service Account Permissions

Your Cloud Run service needs these IAM roles:
- **Vertex AI User** (`roles/aiplatform.user`) - For Gemini AI
- **Firestore User** (`roles/datastore.user`) - For database access

Grant permissions:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## ✅ Testing Your Deployment

### 1. Test Backend Health

```bash
curl https://threatstream-api-xxxxx.run.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-XX-XX...",
  "services": {...}
}
```

### 2. Test Frontend

Open in browser:
```
https://threatstream-ui-xxxxx.run.app
```

You should see the ThreatStream dashboard load.

### 3. Test AI Analysis

In the ThreatStream UI:
1. Click "Demo Controls"
2. Select "Brute Force Attack" scenario
3. Click "Start Stream"
4. Watch for AI-generated analysis in the "AI Reasoning" panel

---

## 🐛 Troubleshooting

### Backend Won't Deploy

**Issue**: Build fails with "permission denied"
**Fix**: Enable Cloud Build API
```bash
gcloud services enable cloudbuild.googleapis.com
```

**Issue**: "Vertex AI not initialized"
**Fix**: Check project ID is set correctly
```bash
gcloud run services update threatstream-api \
  --region us-central1 \
  --update-env-vars GOOGLE_CLOUD_PROJECT=YOUR_ACTUAL_PROJECT_ID
```

### Frontend Can't Connect to Backend

**Issue**: CORS errors in browser console
**Fix**: Update backend CORS_ORIGINS
```bash
gcloud run services update threatstream-api \
  --region us-central1 \
  --update-env-vars CORS_ORIGINS=https://threatstream-ui-xxxxx.run.app
```

**Issue**: WebSocket connection fails
**Fix**: Ensure WS URL uses `wss://` not `ws://`

### Kafka Connection Issues

**Issue**: "Failed to connect to Kafka"
**Fix**: Verify Confluent credentials
```bash
gcloud run services update threatstream-api \
  --region us-central1 \
  --update-env-vars CONFLUENT_BOOTSTRAP_SERVERS=your-server \
  --update-env-vars CONFLUENT_API_KEY=your-key \
  --update-env-vars CONFLUENT_API_SECRET=your-secret
```

---

## 💰 Cost Estimation

**Expected costs for hackathon demo:**

| Service | Free Tier | Demo Cost |
|---------|-----------|-----------|
| Cloud Run (backend) | 2M requests/month | $0 |
| Cloud Run (frontend) | 2M requests/month | $0 |
| Vertex AI (Gemini) | Pay per use | ~$2-5 |
| Cloud Build | 120 min/day | $0 |
| **Total** | | **~$2-5** |

---

## 🎓 For Hackathon Judges

### Live URLs

After deployment, add these to your Devpost submission:

- **Frontend**: `https://threatstream-ui-xxxxx.run.app`
- **Backend API**: `https://threatstream-api-xxxxx.run.app/docs` (Swagger)
- **GitHub**: `https://github.com/iqbalerani/ThreatStream`

### Tech Stack Highlights

✅ **Google Cloud Run** - Serverless container deployment
✅ **Vertex AI (Gemini)** - AI-powered threat analysis
✅ **Confluent Kafka** - Real-time event streaming
✅ **Firestore** - NoSQL database
✅ **FastAPI** - High-performance Python backend
✅ **React 19** - Modern frontend framework

---

## 📞 Support

If you encounter issues:
1. Check Cloud Run logs: `gcloud run services logs read threatstream-api --region us-central1`
2. Check build logs: `gcloud builds list --limit=5`
3. Verify environment variables: `gcloud run services describe threatstream-api --region us-central1`

---

**Ready to deploy?** Start with `./deploy-backend.sh` 🚀
