# Feature: 3D Global Threat Map

**Component:** `ThreatMap.tsx`
**Visualization Library:** `react-globe.gl`
**Data Source:** Real-time threat stream

---

## Overview

The 3D Threat Map visualizes security threats on an interactive 3D globe, showing attack vectors as arcs from source locations to target infrastructure. The map updates in real-time as new threats are detected and supports fullscreen tactical view.

---

## UI Component

### Component: `ThreatMap`

**Location:** `components/ThreatMap.tsx`

**Props:**
```typescript
interface ThreatMapProps {
  events: SecurityEvent[];  // Threat data with coordinates
}
```

**Features:**
- 3D rotating Earth globe
- Real-time attack vector arcs
- Source location rings (for CRITICAL threats)
- Auto-rotation
- Interactive controls (zoom, pan, rotate)
- Fullscreen toggle
- Fallback to 2D grid if WebGL unavailable

---

## Visualization Elements

### 1. Attack Arcs

Visual representation of attack vectors:

```typescript
const arcData = useMemo(() => {
  return events
    .filter(e => e.severity === Severity.CRITICAL || e.severity === Severity.HIGH)
    .slice(0, 15)  // Limit to 15 arcs for performance
    .map(event => ({
      startLat: event.coordinates[0],
      startLng: event.coordinates[1],
      endLat: TARGET_COORDS.lat,     // 38.8951 (Washington DC)
      endLng: TARGET_COORDS.lng,     // -77.0364
      color: event.severity === Severity.CRITICAL
        ? ['#ef4444', '#f87171']  // Red gradient
        : ['#f97316', '#fb923c']  // Orange gradient
    }));
}, [events]);
```

### 2. Source Rings

Pulsing rings at threat source locations:

```typescript
const ringsData = useMemo(() => {
  return events
    .filter(e => e.severity === Severity.CRITICAL)
    .slice(0, 5)  // Top 5 critical threats
    .map(event => ({
      lat: event.coordinates[0],
      lng: event.coordinates[1],
    }));
}, [events]);
```

---

## Data Requirements

### Coordinate Mapping

**File:** `typeMappers.ts`

```typescript
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'US': [37.0902, -95.7129],
  'CN': [35.8617, 104.1954],
  'RU': [61.5240, 105.3188],
  'DE': [51.1657, 10.4515],
  'GB': [55.3781, -3.4360],
  'IN': [20.5937, 78.9629],
  'BR': [-14.2350, -51.9253],
  'KP': [40.3399, 127.5101],  // North Korea
  'IR': [32.4279, 53.6880]    // Iran
};

function getCoordinates(countryCode?: string): [number, number] {
  if (!countryCode) return [0, 0];
  return COUNTRY_COORDS[countryCode] || [0, 0];
}
```

### Backend Requirements

Each threat must include:

```json
{
  "source_country_code": "KP",      // ISO 2-letter country code
  "source_country": "North Korea",   // Full country name (optional)
  "severity": "CRITICAL"             // For filtering
}
```

Frontend maps `source_country_code` to coordinates.

---

## Globe Configuration

### react-globe.gl Props

```typescript
<GlobeComponent
  width={dimensions.width}
  height={dimensions.height}
  backgroundColor="rgba(0,0,0,0)"                    // Transparent
  globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
  atmosphereColor="#4338ca"                          // Indigo atmosphere
  atmosphereAltitude={0.15}

  onGlobeReady={(globe: any) => {
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.3 }, 0);
  }}

  // Attack arcs
  arcsData={arcData}
  arcColor="color"
  arcDashLength={0.4}
  arcDashGap={2}
  arcDashAnimateTime={2000}
  arcStroke={0.5}

  // Source rings
  ringsData={ringsData}
  ringColor={() => "#ef4444"}
  ringMaxRadius={8}
  ringPropagationSpeed={2.5}
  ringRepeatPeriod={1000}
/>
```

---

## Fullscreen Mode

### Toggle Implementation

**File:** `Dashboard.tsx` (lines 102-112)

```typescript
<button
  onClick={() => setIsMapFullscreen(!isMapFullscreen)}
  className={`p-2 rounded-xl transition-all shadow-xl ${
    isMapFullscreen
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
  }`}
>
  {isMapFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
</button>
```

**Behavior:**
- Fullscreen: Map expands to cover entire viewport
- Exit: Returns to normal dashboard layout
- Tactical overlay shows active threats, source nodes, threat level

---

## Performance Optimizations

### 1. Limit Rendered Elements

```typescript
.slice(0, 15)  // Max 15 attack arcs
.slice(0, 5)   // Max 5 source rings
```

### 2. Lazy Loading

```typescript
const [GlobeComponent, setGlobeComponent] = useState(null);

useEffect(() => {
  import('react-globe.gl').then(mod => {
    setGlobeComponent(() => mod.default || mod);
  });
}, []);
```

### 3. Responsive Sizing

```typescript
const resizeObserver = new ResizeObserver((entries) => {
  const { width, height } = entries[0].contentRect;
  setDimensions({ width, height });
});
```

---

## Fallback Rendering

### WebGL Not Available

```typescript
if (loadError) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <svg><!-- Globe icon --></svg>
        <span>Spatial Engine Offline</span>
        <p>Heuristic Data streaming via 2D Terminal</p>
      </div>
    </div>
  );
}
```

---

## Backend Requirements

### Must Provide

1. ✅ **Country Code:** `source_country_code` field in threats
2. ✅ **Severity Level:** For filtering (CRITICAL/HIGH shown on map)
3. ✅ **Real-time Updates:** Via WebSocket for live map updates

### Optional

1. **Destination Coordinates:** Could support multiple target locations
2. **Attack Type Icons:** Different visual styles per threat type
3. **Historical Playback:** Time-based replay of past attacks

---

## Testing

### Manual Testing

1. Start backend and frontend
2. Trigger multiple threats from different countries
3. Verify:
   - Arcs appear from source to target
   - Colors match severity (red for CRITICAL, orange for HIGH)
   - Rings pulse at source locations
   - Globe rotates automatically
   - Fullscreen toggle works

### Performance Testing

1. Trigger 50+ events
2. Verify only 15 arcs rendered
3. Check frame rate (should be 30+ FPS)
4. Monitor memory usage

---

## Related Features

- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Event data source
- [FEATURE_ANALYTICS.md](./FEATURE_ANALYTICS.md) - Geographic analysis

---

**Last Updated:** December 27, 2025
