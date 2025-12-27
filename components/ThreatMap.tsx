
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

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 300);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
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
    <div ref={containerRef} className="relative w-full h-full bg-[#020617] rounded-[1.5rem] overflow-hidden group">
      {/* Visual Mesh Placeholder */}
      <div className="absolute inset-0 opacity-[0.05] z-0" 
           style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 0)', backgroundSize: '30px 30px' }} />

      {!globeReady && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
           <div className="h-6 w-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Aligning Orbital Nodes...</span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50">
           <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
             <svg className="text-slate-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{loadError}</span>
             <p className="text-[8px] text-slate-700 mt-2 font-bold uppercase">Heuristic Data streaming via 2D Terminal</p>
           </div>
        </div>
      )}

      {globeReady && GlobeComponent && dimensions.width > 0 && (
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
      )}

      {/* Map Hud */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
         <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Live Surface View</span>
         </div>
      </div>
    </div>
  );
};

export default ThreatMap;
