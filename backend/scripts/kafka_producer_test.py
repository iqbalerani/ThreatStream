#!/usr/bin/env python3
"""
Kafka Event Producer Test Script
Sends test security events to Confluent Cloud Kafka topics
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
    timestamp = int(time.time())

    events = {
        'brute_force': {
            'event_id': f'test-bf-{timestamp}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'brute_force',
            'source_ip': '185.234.72.91',
            'destination_ip': '10.0.0.100',
            'destination_port': 22,
            'protocol': 'TCP',
            'payload': {
                'attempts': 150,
                'usernames': ['admin', 'root', 'user'],
                'duration_seconds': 300
            },
            'metadata': {
                'source': 'kafka_test_script',
                'test': True
            }
        },
        'sql_injection': {
            'event_id': f'test-sqli-{timestamp}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'sql_injection',
            'source_ip': '201.45.123.88',
            'destination_ip': '10.0.0.200',
            'destination_port': 443,
            'protocol': 'HTTPS',
            'payload': {
                'query': "' OR '1'='1' --",
                'endpoint': '/api/users',
                'method': 'POST'
            },
            'metadata': {
                'source': 'kafka_test_script',
                'test': True
            }
        },
        'ddos': {
            'event_id': f'test-ddos-{timestamp}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'ddos',
            'source_ip': '103.42.67.123',
            'destination_ip': '10.0.0.1',
            'destination_port': 80,
            'protocol': 'UDP',
            'payload': {
                'packets_per_sec': 8500,
                'attack_vector': 'amplification',
                'duration_seconds': 120
            },
            'metadata': {
                'source': 'kafka_test_script',
                'test': True
            }
        },
        'ransomware': {
            'event_id': f'test-ransomware-{timestamp}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'ransomware',
            'source_ip': '10.0.5.42',
            'destination_ip': '10.0.0.250',
            'destination_port': 445,
            'protocol': 'SMB',
            'payload': {
                'encrypted_files': 1247,
                'file_extensions': ['.docx', '.xlsx', '.pdf'],
                'ransom_note': 'Your files have been encrypted'
            },
            'metadata': {
                'source': 'kafka_test_script',
                'test': True
            }
        },
        'malware': {
            'event_id': f'test-malware-{timestamp}',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': 'malware',
            'source_ip': '10.0.3.15',
            'destination_ip': '185.234.72.91',
            'destination_port': 4444,
            'protocol': 'TCP',
            'payload': {
                'signature': 'Trojan.Generic.12345',
                'behavior': 'Command and Control Communication',
                'file_hash': 'a3b2c1d4e5f6...'
            },
            'metadata': {
                'source': 'kafka_test_script',
                'test': True
            }
        }
    }

    return events.get(event_type, events['brute_force'])

def send_event(producer, event_type='brute_force'):
    """Send a single test event to Kafka."""
    event = create_test_event(event_type)

    print(f"\n📤 Sending {event_type} event...")
    print(f"   Event ID: {event['event_id']}")
    print(f"   Source IP: {event['source_ip']}")

    producer.produce(
        topic=settings.kafka_raw_topic,
        key=event['event_id'].encode('utf-8'),
        value=json.dumps(event).encode('utf-8'),
        callback=delivery_report
    )

    # Flush to ensure delivery
    producer.flush(timeout=10)

def main():
    print("=" * 60)
    print("🚀 ThreatStream Kafka Event Producer Test")
    print("=" * 60)

    # Check configuration
    if not settings.confluent_bootstrap_servers or not settings.confluent_api_key:
        print("\n❌ ERROR: Kafka credentials not configured!")
        print("\nPlease update backend/.env with:")
        print("  - CONFLUENT_BOOTSTRAP_SERVERS")
        print("  - CONFLUENT_API_KEY")
        print("  - CONFLUENT_API_SECRET")
        print("\nSee CONFLUENT_SETUP.md for setup instructions.")
        sys.exit(1)

    print(f"\n📡 Kafka Configuration:")
    print(f"   Bootstrap: {settings.confluent_bootstrap_servers}")
    print(f"   Topic: {settings.kafka_raw_topic}")
    print(f"   API Key: {settings.confluent_api_key[:8]}***")

    # Create producer
    print("\n🔧 Creating Kafka producer...")
    try:
        producer = create_producer()
        print("✅ Producer created successfully")
    except Exception as e:
        print(f"❌ Failed to create producer: {e}")
        sys.exit(1)

    # Send test events
    event_types = ['brute_force', 'sql_injection', 'ddos', 'ransomware', 'malware']

    print(f"\n📨 Sending {len(event_types)} test events...")
    print("-" * 60)

    for event_type in event_types:
        try:
            send_event(producer, event_type)
            time.sleep(1)  # Wait 1 second between events
        except Exception as e:
            print(f"❌ Error sending {event_type}: {e}")

    print("\n" + "=" * 60)
    print("✅ All events sent!")
    print("=" * 60)
    print("\n📋 Next steps:")
    print("   1. Check your backend logs to see events being processed")
    print("   2. Open your frontend to see threats appearing in real-time")
    print("   3. Go to Confluent Cloud dashboard to see messages in topics")
    print("\n💡 Tip: Monitor consumer lag in Confluent Cloud to ensure")
    print("   the backend is consuming events in real-time.")
    print("")

if __name__ == '__main__':
    main()
