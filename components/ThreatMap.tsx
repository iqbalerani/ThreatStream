
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { SecurityEvent, Severity } from '../types';

// Global reference for the component to avoid re-imports
let GlobeComponent: any = null;

interface ThreatMapProps {
  events: SecurityEvent[];
}

const TARGET_COORDS = { lat: 38.8951, lng: -77.0364 };

const ThreatMap: React.FC<ThreatMapProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [globeReady, setGlobeReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initGlobe = async () => {
      try {
        const mod = await import('react-globe.gl');
        if (isMounted) {
          GlobeComponent = mod.default || mod;
          setGlobeReady(true);
        }
      } catch (err) {
        console.warn("WebGL Library Load Failed - Falling back to Static Grid", err);
        if (isMounted) setLoadError("Spatial Engine Offline");
      }
    };

    initGlobe();

    // ResizeObserver is much more accurate for layout transitions than window resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
    };
  }, []);

  const arcData = useMemo(() => {
    return events
      .filter(e => e.severity === Severity.CRITICAL || e.severity === Severity.HIGH)
      .slice(0, 15)
      .map(event => ({
        startLat: event.coordinates[0],
        startLng: event.coordinates[1],
        endLat: TARGET_COORDS.lat,
        endLng: TARGET_COORDS.lng,
        color: event.severity === Severity.CRITICAL ? ['#ef4444', '#f87171'] : ['#f97316', '#fb923c'],
      }));
  }, [events]);

  const ringsData = useMemo(() => {
    return events
      .filter(e => e.severity === Severity.CRITICAL)
      .slice(0, 5)
      .map(event => ({
        lat: event.coordinates[0],
        lng: event.coordinates[1],
      }));
  }, [events]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#020617] overflow-hidden group">
      {/* Visual Mesh Placeholder */}
      <div className="absolute inset-0 opacity-[0.05] z-0 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 0)', backgroundSize: '30px 30px' }} />

      {!globeReady && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#020617]">
           <div className="h-6 w-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Aligning Orbital Nodes...</span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50">
           <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl">
             <svg className="text-slate-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{loadError}</span>
             <p className="text-[8px] text-slate-700 mt-2 font-bold uppercase">Heuristic Data streaming via 2D Terminal</p>
           </div>
        </div>
      )}

      {globeReady && GlobeComponent && dimensions.width > 0 && (
        <div className="w-full h-full animate-in fade-in duration-1000">
          <GlobeComponent
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            atmosphereColor="#4338ca"
            atmosphereAltitude={0.15}
            
            onGlobeReady={(globe: any) => {
              globe.controls().autoRotate = true;
              globe.controls().autoRotateSpeed = 0.5;
              globe.pointOfView({ lat: 20, lng: -40, altitude: 2.3 }, 0);
            }}

            arcsData={arcData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}

            ringsData={ringsData}
            ringColor={() => "#ef4444"}
            ringMaxRadius={8}
            ringPropagationSpeed={2.5}
            ringRepeatPeriod={1000}
          />
        </div>
      )}

      {/* Map Hud */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
         <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 shadow-2xl">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Orbital Stream Verified</span>
         </div>
      </div>
    </div>
  );
};

export default ThreatMap;
