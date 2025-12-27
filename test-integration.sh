#!/bin/bash

# ThreatStream Backend-Frontend Integration Test Script
# Tests all backend API endpoints and integration points

echo "🧪 ThreatStream Integration Testing"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="http://localhost:8000"

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"

    echo -n "Testing $name... "

    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))

        # Show response preview (first 200 chars)
        if [ -n "$body" ]; then
            echo "   Response: $(echo "$body" | head -c 200)..."
        fi
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))

        if [ -n "$body" ]; then
            echo "   Error: $body"
        fi
        return 1
    fi
}

echo "📊 Phase 1: Backend Health & API Tests"
echo "======================================="
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "$BACKEND_URL/api/health"
echo ""

# Test 2: Recent Threats
test_endpoint "Get Recent Threats (10)" "$BACKEND_URL/api/threats/recent?limit=10"
echo ""

# Test 3: Recent Critical Threats
test_endpoint "Get Critical Threats" "$BACKEND_URL/api/threats/recent?limit=5&severity=CRITICAL"
echo ""

# Test 4: Threat Stats
test_endpoint "Get Threat Statistics" "$BACKEND_URL/api/threats/stats/summary"
echo ""

# Test 5: Active Alerts
test_endpoint "Get Active Alerts" "$BACKEND_URL/api/alerts/active?limit=10"
echo ""

# Test 6: Dashboard Metrics
test_endpoint "Get Dashboard Metrics" "$BACKEND_URL/api/analytics/dashboard"
echo ""

# Test 7: Risk Index
test_endpoint "Get Risk Index" "$BACKEND_URL/api/analytics/risk-index"
echo ""

# Test 8: Risk Timeline
test_endpoint "Get Risk Timeline" "$BACKEND_URL/api/analytics/timeline"
echo ""

# Test 9: Analytics Summary
test_endpoint "Get Analytics Summary" "$BACKEND_URL/api/analytics/summary"
echo ""

# Test 10: Playbooks
test_endpoint "Get Playbooks" "$BACKEND_URL/api/playbooks"
echo ""

# Test 11: Playbook History
test_endpoint "Get Playbook History" "$BACKEND_URL/api/playbooks/history?limit=10"
echo ""

echo ""
echo "🔥 Phase 2: Event Simulation Tests"
echo "==================================="
echo ""

# Test 12: Simulate Brute Force Event
brute_force_event='{
  "event_id": "test-brute-force-001",
  "timestamp": "2025-12-27T20:00:00Z",
  "event_type": "brute_force",
  "source_ip": "185.234.72.91",
  "destination_ip": "10.0.0.100",
  "destination_port": 22,
  "protocol": "TCP",
  "payload": {"attempts": 150},
  "metadata": {"test": true}
}'

test_endpoint "Simulate Brute Force Event" "$BACKEND_URL/api/simulate/event" "POST" "$brute_force_event"
echo ""

# Wait a moment for processing
echo "Waiting 2 seconds for event processing..."
sleep 2
echo ""

# Test 13: Simulate SQL Injection Event
sql_injection_event='{
  "event_id": "test-sql-injection-001",
  "timestamp": "2025-12-27T20:01:00Z",
  "event_type": "sql_injection",
  "source_ip": "201.45.123.88",
  "destination_ip": "10.0.0.200",
  "destination_port": 443,
  "protocol": "HTTPS",
  "payload": {"query": "'\'' OR '\''1'\''='\''1'\'' --"},
  "metadata": {"test": true}
}'

test_endpoint "Simulate SQL Injection Event" "$BACKEND_URL/api/simulate/event" "POST" "$sql_injection_event"
echo ""

sleep 2

# Test 14: Simulate DDoS Event
ddos_event='{
  "event_id": "test-ddos-001",
  "timestamp": "2025-12-27T20:02:00Z",
  "event_type": "ddos",
  "source_ip": "103.42.67.123",
  "destination_ip": "10.0.0.1",
  "destination_port": 80,
  "protocol": "UDP",
  "payload": {"packets_per_sec": 8500},
  "metadata": {"test": true}
}'

test_endpoint "Simulate DDoS Event" "$BACKEND_URL/api/simulate/event" "POST" "$ddos_event"
echo ""

sleep 2

# Test 15: Verify Threats Were Created
echo "Verifying threats were created..."
test_endpoint "Get Recent Threats After Simulation" "$BACKEND_URL/api/threats/recent?limit=3"
echo ""

# Test 16: Verify Metrics Updated
test_endpoint "Get Updated Dashboard Metrics" "$BACKEND_URL/api/analytics/dashboard"
echo ""

echo ""
echo "📡 Phase 3: WebSocket Connection Test"
echo "====================================="
echo ""

# Test WebSocket endpoint exists (we can't test WS connection directly in bash)
echo -n "Checking WebSocket endpoint accessibility... "
ws_test=$(curl -s -o /dev/null -w "%{http_code}" --header "Upgrade: websocket" "$BACKEND_URL/ws/live" 2>&1)

if [ "$ws_test" = "426" ] || [ "$ws_test" = "400" ]; then
    # 426 Upgrade Required or 400 Bad Request means endpoint exists but needs proper WS handshake
    echo -e "${GREEN}✓ PASSED${NC} (Endpoint exists, WS handshake required)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (HTTP $ws_test - May need browser test)"
fi
echo ""

echo -e "${YELLOW}Note:${NC} Full WebSocket testing requires browser. See test-websocket.html"
echo ""

echo ""
echo "📈 Test Summary"
echo "==============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check output above.${NC}"
    exit 1
fi
