import React from 'react';
import styled from 'styled-components';
import {
  BarChart,
  Bar,
  LineChart, 
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const ChartContainer = styled.div`
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
`;

function LineChartComponent({ data }) {
  return (
    <ChartContainer>
      <LineChart width={400} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="accuracy" stroke="#8884d8" />
      </LineChart>
    </ChartContainer>
  );
}

function BarChartComponent({ data }) {
  return (
    <ChartContainer>
      <BarChart width={400} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="accuracy" fill="#8884d8" />
      </BarChart>
    </ChartContainer>
  );
}

function PieChartComponent() {
  // Sample data - will be replaced by actual props later
  const data = [
    { name: 'Flashcards', value: 400 },
    { name: 'Spelling', value: 300 },
    { name: 'Match Game', value: 200 }
  ];

  return (
    <ChartContainer>
      <PieChart width={400} height={300}>
        <Pie 
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label
        />
        <Tooltip />
      </PieChart>
    </ChartContainer>
  );
}

export { LineChartComponent as LineChart, BarChartComponent as BarChart, PieChartComponent as PieChart };
