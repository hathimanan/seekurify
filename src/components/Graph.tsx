import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const FixedResponsiveContainer = ResponsiveContainer as unknown as React.FC<any>;
const FixedLineChart = LineChart as unknown as React.FC<any>;
const FixedXAxis = XAxis as unknown as React.FC<any>;
const FixedYAxis = YAxis as unknown as React.FC<any>;
const FixedBarChart = BarChart as unknown as React.FC<any>;
const FixedLegend = Legend as unknown as React.FC<any>;
const FixedLine = Line as unknown as React.FC<any>;
const FixedBar = Bar as unknown as React.FC<any>;



interface GraphProps {
  title: string;
  data: { date: string; value: number }[];
  type?: 'line' | 'bar';
}

const Graph: React.FC<GraphProps> = ({ title, data, type = 'line' }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gray-700 text-white p-4 rounded-2xl shadow-lg w-full h-64 flex flex-col justify-between">
      <div className="text-center">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-xl font-semibold">Total: {total}</p>
      </div>

      <FixedResponsiveContainer width="100%" height="80%">
        {type === 'line' ? (
          <FixedLineChart data={data}>
            <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
            <FixedXAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
            <FixedYAxis />
            <Tooltip />
            <FixedLegend />
            <FixedLine type="monotone" dataKey="value" stroke="#00bcd4" strokeWidth={2} dot />
          </FixedLineChart>
        ) : (
          <FixedBarChart data={data}>
            <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
            <FixedXAxis dataKey="date" />
            <FixedYAxis />
            <Tooltip />
            <FixedLegend />
            <FixedBar dataKey="value" fill="#82ca9d" />
          </FixedBarChart>
        )}
      </FixedResponsiveContainer>
    </div>
  );
};

export default Graph;
