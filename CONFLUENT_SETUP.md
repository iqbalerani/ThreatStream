# Confluent Cloud Setup Guide for ThreatStream

**Purpose:** This guide walks you through setting up Confluent Cloud Kafka for production-like event streaming in ThreatStream.

**Estimated Time:** 30-45 minutes
**Cost:** Free tier available (400 credits, ~$400 value)

---

## 🎯 Overview

After completing this setup, your ThreatStream architecture will be:

```
┌──────────────────┐
│ Event Producers  │  Security logs, simulations, etc.
│ (External/Script)│
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│         CONFLUENT CLOUD (KAFKA)             │
│                                             │
│  Topic: security.raw.logs                   │
│  ├─> Backend Consumer                       │
│  │   └─> Process → Analyze → Store          │
│  │                                           │
│  Topic: security.analyzed.threats           │
│  ├─> Published by Backend                   │
│  │                                           │
│  Topic: security.critical.alerts            │
│  └─> Published by Backend                   │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Backend Services│  Threat Processor, WebSocket, APIs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Frontend     │  Real-time threat visualization
└─────────────────┘
```

---

## 📋 Prerequisites

- Email address for Confluent Cloud account
- Credit card (for account verification, won't be charged during free trial)
- Backend running locally (already done ✅)
- 30-45 minutes of time

---

## 🚀 Step 1: Create Confluent Cloud Account

### 1.1 Sign Up

1. Go to https://confluent.cloud
2. Click **"Start Free"** or **"Try Free"**
3. Fill out registration form:
   - Email address
   - Password
   - Company name (can use "Personal" or your name)
   - Use case: Select "Real-time Data Streaming"

4. **Verify email** (check inbox for verification link)

5. **Add payment method** (required for verification, free tier won't charge)
   - Credit/debit card
   - Will receive **$400 free credits**
   - Free credits last 30 days

### 1.2 Complete Onboarding

- Skip tutorial if prompted
- You'll land on the Confluent Cloud dashboard

---

## 🏗️ Step 2: Create Kafka Cluster

### 2.1 Create Environment

1. In Confluent Cloud dashboard, click **"Environments"** in left sidebar
2. Click **"Create environment"**
3. Name it: `ThreatStream-Dev`
4. Click **"Create"**

### 2.2 Create Cluster

1. Inside the `ThreatStream-Dev` environment, click **"Create cluster"**

2. **Choose cluster type:**
   - Select **"Basic"** (free tier eligible)
   - Click **"Begin configuration"**

3. **Configure cluster:**
   - **Region:** Select closest to you (e.g., `us-central1` for GCP, `us-east-1` for AWS)
   - **Cloud Provider:** Choose `Google Cloud` (recommended) or `AWS`
   - **Cluster name:** `threatstream-cluster`

4. Click **"Launch cluster"**

5. **Wait 5-10 minutes** for cluster to provision
   - Status will change from "Provisioning" to "Active"
   - ☕ Good time for coffee!

---

## 📡 Step 3: Create Kafka Topics

### 3.1 Navigate to Topics

1. Once cluster is **Active**, click on **`threatstream-cluster`**
2. Click **"Topics"** in left sidebar
3. Click **"Create topic"**

### 3.2 Create Raw Logs Topic

1. **Topic name:** `security.raw.logs`
2. **Partitions:** `3` (can handle ~30-60 MB/s)
3. **Retention:** `7 days` (1 week)
4. Click **"Create with defaults"**

### 3.3 Create Analyzed Threats Topic

Repeat for each topic:

| Topic Name | Partitions | Retention | Purpose |
|------------|------------|-----------|---------|
| `security.analyzed.threats` | 3 | 7 days | Processed threats from backend |
| `security.critical.alerts` | 1 | 14 days | Critical alerts only |
| `security.system.metrics` | 1 | 3 days | System metrics |

**Your Topics should look like:**
```
✅ security.raw.logs (3 partitions)
✅ security.analyzed.threats (3 partitions)
✅ security.critical.alerts (1 partition)
✅ security.system.metrics (1 partition)
```

---

## 🔑 Step 4: Create API Keys

### 4.1 Generate API Key

1. In your cluster (`threatstream-cluster`), click **"API keys"** in left sidebar
2. Click **"Create key"**

3. **Scope:** Select **"Global access"**
   - This allows the key to access all topics

4. Click **"Next"**

5. **IMPORTANT:** Copy both values immediately (won't be shown again!)
   - **API Key:** `ABCDEFGH123456789`
   - **API Secret:** `abcdef123456789ABCDEFGHIJK/1234567890abcdefgh`

6. **Save these securely!** You'll need them for backend configuration.

7. Give the key a description: `ThreatStream Backend`

8. Click **"Save"**

### 4.2 Get Cluster Details

1. In cluster view, click **"Cluster settings"**

2. Copy these values:
   - **Bootstrap server:** `pkc-xxxxx.us-central1.gcp.confluent.cloud:9092`
   - **Cluster ID:** `lkc-xxxxx`

---

## ⚙️ Step 5: Configure ThreatStream Backend

### 5.1 Update .env File

Edit `backend/.env`:

```bash
# =============================================================================
# CONFLUENT CLOUD (KAFKA)
# =============================================================================
CONFLUENT_BOOTSTRAP_SERVERS=pkc-xxxxx.us-central1.gcp.confluent.cloud:9092  # Your bootstrap server
CONFLUENT_API_KEY=ABCDEFGH123456789  # Your API key
CONFLUENT_API_SECRET=abcdef123456789ABCDEFGHIJK/1234567890abcdefgh  # Your API secret
CONFLUENT_CLUSTER_ID=lkc-xxxxx  # Your cluster ID

# Kafka Topics (already correct)
KAFKA_RAW_TOPIC=security.raw.logs
KAFKA_ANALYZED_TOPIC=security.analyzed.threats
KAFKA_ALERTS_TOPIC=security.critical.alerts
KAFKA_METRICS_TOPIC=security.system.metrics

# Consumer Configuration (already correct)
KAFKA_CONSUMER_GROUP=threatstream-processor-group
KAFKA_AUTO_OFFSET_RESET=latest
KAFKA_ENABLE_AUTO_COMMIT=false
```

### 5.2 Verify Configuration

```bash
cd backend
cat .env | grep CONFLUENT
```

Should show your actual values, not `pkc-xxxxx` or `your-confluent-api-key`.

---

## 🔧 Step 6: Update Backend Code

### 6.1 Update main.py

We need to initialize and start the Kafka consumer on backend startup.

**File:** `backend/app/main.py`

Add after line 36 (after `threat_processor = get_threat_processor()`):

```python
# Initialize Kafka consumer
from app.core.kafka_consumer import ThreatStreamConsumer

if settings.confluent_bootstrap_servers and settings.confluent_api_key:
    logger.info("🔌 Initializing Kafka consumer...")
    kafka_consumer = ThreatStreamConsumer(
        topic=settings.kafka_raw_topic,
        group_id=settings.kafka_consumer_group
    )
    kafka_consumer.add_handler(threat_processor.process_event)
    consumer_task = asyncio.create_task(kafka_consumer.start())
    logger.info(f"✅ Kafka consumer started for topic: {settings.kafka_raw_topic}")
else:
    logger.warning("⚠️  Kafka credentials not configured - running without Kafka consumer")
    kafka_consumer = None
    consumer_task = None
```

And in the shutdown section (after line 54), add:

```python
if consumer_task:
    consumer_task.cancel()
if kafka_consumer:
    kafka_consumer.stop()
```

### 6.2 Restart Backend

```bash
cd backend
# Stop current backend (Ctrl+C)
uvicorn app.main:app --reload
```

**Expected startup logs:**
```
🚀 Starting ThreatStream Backend...
🔌 Initializing Kafka consumer...
✅ Kafka consumer started for topic: security.raw.logs
✅ ThreatStream Backend started successfully
📡 Kafka: security.raw.logs
```

If you see errors, check your `.env` configuration.

---

## 🧪 Step 7: Create Event Producer Script

Create a script to send test events to Kafka.

**File:** `backend/scripts/kafka_producer_test.py`

```python
#!/usr/bin/env python3
"""
Kafka Event Producer Test Script
Sends test security events to Confluent Cloud
"""
import json
import time
from datetime import datetime
from confluent_kafka import Producer
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings

def delivery_report(err, msg):
    """Callback for message delivery reports."""
    if err is not None:
        print(f'❌ Message delivery failed: {err}')
    else:
        print(f'✅ Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

def create_producer():
    """Create Kafka producer."""
    config = settings.kafka_config.copy()

    # Remove consumer-specific configs
    config.pop('group.id', None)
    config.pop('auto.offset.reset', None)
    config.pop('enable.auto.commit', None)

    return Producer(config)

def create_test_event(event_type='brute_force'):
    """Create a test security event."""
    events = {
        'brute_force': {
            'event_id': f'test-bf-{int(time.time())}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'brute_force',
            'source_ip': '185.234.72.91',
            'destination_ip': '10.0.0.100',
            'destination_port': 22,
            'protocol': 'TCP',
            'payload': {'attempts': 150, 'usernames': ['admin', 'root']},
            'metadata': {'source': 'kafka_test_script'}
        },
        'sql_injection': {
            'event_id': f'test-sqli-{int(time.time())}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'sql_injection',
            'source_ip': '201.45.123.88',
            'destination_ip': '10.0.0.200',
            'destination_port': 443,
            'protocol': 'HTTPS',
            'payload': {'query': "' OR '1'='1' --", 'endpoint': '/api/users'},
            'metadata': {'source': 'kafka_test_script'}
        },
        'ddos': {
            'event_id': f'test-ddos-{int(time.time())}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'ddos',
            'source_ip': '103.42.67.123',
            'destination_ip': '10.0.0.1',
            'destination_port': 80,
            'protocol': 'UDP',
            'payload': {'packets_per_sec': 8500, 'attack_vector': 'amplification'},
            'metadata': {'source': 'kafka_test_script'}
        }
    }

    return events.get(event_type, events['brute_force'])

def main():
    print("🚀 Kafka Event Producer Test")
    print("=" * 50)

    # Create producer
    print("\n📡 Creating Kafka producer...")
    producer = create_producer()

    # Send test events
    event_types = ['brute_force', 'sql_injection', 'ddos']

    for event_type in event_types:
        event = create_test_event(event_type)

        print(f"\n📤 Sending {event_type} event...")
        print(f"   Event ID: {event['event_id']}")

        producer.produce(
            topic=settings.kafka_raw_topic,
            key=event['event_id'].encode('utf-8'),
            value=json.dumps(event).encode('utf-8'),
            callback=delivery_report
        )

        # Flush to ensure delivery
        producer.flush(timeout=10)

        time.sleep(2)  # Wait between events

    print("\n✅ All events sent!")
    print("\nCheck your backend logs to see events being processed.")
    print("Check your frontend to see threats appearing in real-time!")

if __name__ == '__main__':
    main()
```

### 7.2 Make Script Executable

```bash
chmod +x backend/scripts/kafka_producer_test.py
```

---

## ✅ Step 8: Test End-to-End

### 8.1 Ensure Backend is Running

```bash
cd backend
uvicorn app.main:app --reload
```

**Look for:**
```
✅ Kafka consumer started for topic: security.raw.logs
INFO:     Kafka consumer initialized for topic: security.raw.logs
```

### 8.2 Ensure Frontend is Running

```bash
npm run dev
```

Frontend should be at http://localhost:3000

### 8.3 Send Test Events to Kafka

```bash
cd backend
python3 scripts/kafka_producer_test.py
```

**Expected output:**
```
🚀 Kafka Event Producer Test
==================================================

📡 Creating Kafka producer...

📤 Sending brute_force event...
   Event ID: test-bf-1735328400
✅ Message delivered to security.raw.logs [0] at offset 12

📤 Sending sql_injection event...
   Event ID: test-sqli-1735328402
✅ Message delivered to security.raw.logs [1] at offset 8

📤 Sending ddos event...
   Event ID: test-ddos-1735328404
✅ Message delivered to security.raw.logs [2] at offset 5

✅ All events sent!
```

### 8.4 Verify in Backend Logs

Backend should show:
```
INFO: Kafka consumer processing event: test-bf-1735328400
INFO: Threat created: THR-XXXXXXXX
INFO: Alert created: ALT-XXXXXXXX
INFO: Broadcasting to 1 WebSocket clients
```

### 8.5 Verify in Frontend

- Events should appear in the event stream in real-time
- Risk score should update
- Threat map should show attack vectors
- AI Reasoning panel should update

---

## 🎯 Step 9: Monitor in Confluent Cloud

### 9.1 View Topic Activity

1. Go to Confluent Cloud dashboard
2. Click on `threatstream-cluster`
3. Click on **"Topics"**
4. Click on `security.raw.logs`

You should see:
- **Messages:** Increasing count (3 messages from test)
- **Throughput:** Data being written
- **Consumer lag:** Should be 0 (backend consuming in real-time)

### 9.2 View Messages

1. In topic view, click **"Messages"** tab
2. Select **partition** (0, 1, or 2)
3. Click **"Jump to offset"** → Enter `0` → Click **"Go"**
4. You should see your test events!

---

## 🔍 Troubleshooting

### Issue 1: "Failed to initialize Kafka consumer"

**Cause:** Invalid credentials or network issue

**Fix:**
1. Double-check `CONFLUENT_BOOTSTRAP_SERVERS` in `.env`
2. Verify `CONFLUENT_API_KEY` and `CONFLUENT_API_SECRET`
3. Ensure bootstrap server format: `pkc-xxxxx.region.gcp.confluent.cloud:9092`
4. Test connectivity: `ping pkc-xxxxx.us-central1.gcp.confluent.cloud`

### Issue 2: "Producer not connecting"

**Cause:** Firewall or incorrect bootstrap server

**Fix:**
1. Ensure port 9092 is not blocked by firewall
2. Verify cluster is in "Active" state in Confluent Cloud
3. Check API key has "Global access" permissions

### Issue 3: "Events not appearing in frontend"

**Cause:** WebSocket not connected or consumer not processing

**Fix:**
1. Check backend logs for "Kafka consumer processing event"
2. Verify WebSocket connection in browser console
3. Check frontend is connected to backend WebSocket
4. Restart both backend and frontend

### Issue 4: "Consumer lag increasing"

**Cause:** Backend processing slower than event rate

**Fix:**
1. Reduce event rate from producer
2. Increase backend resources
3. Check for errors in backend logs

---

## 📊 Monitoring & Management

### View Consumer Groups

In Confluent Cloud:
1. Click **"Consumers"** in left sidebar
2. You should see `threatstream-processor-group`
3. Click on it to see:
   - Consumer lag (should be 0 or very low)
   - Partitions assigned
   - Current offset position

### View Cluster Metrics

1. Click **"Cluster overview"**
2. You'll see:
   - Throughput (MB/s)
   - Request rate (requests/s)
   - Storage used
   - Active connections

---

## 💰 Cost Management

### Free Tier Limits

- **$400 credits** (usually lasts 30 days)
- **Basic cluster:** ~$1-2/day
- Monitor usage in **"Billing"** section

### When Free Trial Ends

1. **Option A:** Delete cluster to stop charges
2. **Option B:** Continue with paid plan (pay-as-you-go)
3. **Option C:** Switch back to REST API mode (no Confluent)

### Delete Cluster (When Done Testing)

1. Go to cluster settings
2. Click **"Delete cluster"**
3. Confirm deletion
4. Update `backend/.env` to remove Confluent credentials
5. Backend will automatically fall back to REST API mode

---

## ✅ Success Checklist

- [ ] Confluent Cloud account created
- [ ] Kafka cluster provisioned and active
- [ ] 4 topics created (raw.logs, analyzed.threats, critical.alerts, metrics)
- [ ] API key and secret generated
- [ ] Backend `.env` updated with credentials
- [ ] Backend shows "Kafka consumer started" in logs
- [ ] Test script sends events successfully
- [ ] Backend processes events from Kafka
- [ ] Frontend shows events in real-time
- [ ] Confluent Cloud shows messages in topics
- [ ] Consumer lag is 0 or near-0

---

## 🎉 You're Done!

Your ThreatStream backend is now connected to Confluent Cloud Kafka for production-like event streaming!

**Next Steps:**
- Create more sophisticated event producers
- Integrate with real security log sources
- Scale up event rate for stress testing
- Monitor performance in Confluent Cloud dashboard

---

**Questions or Issues?** Check the troubleshooting section or review backend logs for detailed error messages.
