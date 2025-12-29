
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimelineData } from '../types';

interface TimelineProps {
  data: TimelineData[];
}

const Timeline: React.FC<TimelineProps> = ({ data }) => {
  return (
    <div className="w-full h-full pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
            opacity={0.3}
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
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: '#475569', fontWeight: 'bold' }}
            width={35}
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

          <Line
            type="monotone"
            dataKey="risk"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            animationDuration={800}
            activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Timeline;
