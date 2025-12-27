
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimelineData } from '../types';

interface TimelineProps {
  data: TimelineData[];
}

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  return (
    <div className="w-full h-full pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#1e293b" 
            vertical={false} 
            opacity={0.5}
          />
          
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={40}
            tick={{ fill: '#475569', fontWeight: 'bold' }}
            dy={10}
          />
          
          <YAxis 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100]} 
            tick={{ fill: '#475569', fontWeight: 'bold' }}
            width={30}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#334155', 
              fontSize: '10px', 
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              padding: '8px 12px',
              color: '#fff'
            }}
            itemStyle={{ color: '#818cf8', fontWeight: '900', textTransform: 'uppercase' }}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
            cursor={{ stroke: '#4338ca', strokeWidth: 1 }}
          />
          
          <Area 
            type="monotone" 
            dataKey="risk" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            animationDuration={800}
            activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Timeline;
