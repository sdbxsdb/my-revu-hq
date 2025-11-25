import { Paper, Text, Title } from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

const revenueData = [
  { rating: '3.0★', revenue: 0, displayRevenue: 0 },
  { rating: '3.5★', revenue: 7, displayRevenue: 0 },
  { rating: '4.0★', revenue: 14, displayRevenue: 0 },
  { rating: '4.5★', revenue: 28, displayRevenue: 0 },
  { rating: '5.0★', revenue: 45, displayRevenue: 0 },
];

export const ReviewRevenueChart = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const [barData, setBarData] = useState(revenueData);

  // Animate bars growing
  useEffect(() => {
    if (inView) {
      revenueData.forEach((data, index) => {
        setTimeout(() => {
          setBarData((prev) => {
            const newData = [...prev];
            newData[index] = { ...data, displayRevenue: data.revenue };
            return newData;
          });
        }, index * 200);
      });
    }
  }, [inView]);

  const getBarColor = (index: number) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'];
    return colors[index];
  };

  return (
    <div ref={ref}>
      <Paper p="lg" className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="text-center mb-6">
          <Title order={3} className="text-xl font-bold mb-2 text-white">
            Review Rating Impact on Revenue
          </Title>
          <Text size="sm" className="text-gray-400">
            Based on Harvard Business Review study of 300,000+ businesses
          </Text>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="rating" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                label={{ value: 'Revenue Increase (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 12 } }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                itemStyle={{ color: '#f3f4f6' }}
                formatter={(value: number) => [`+${value}%`, 'Revenue Increase']}
              />
              <Bar dataKey="displayRevenue" radius={[8, 8, 0, 0]} animationDuration={800}>
                {barData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
          <Text size="sm" className="text-center text-gray-400">
            <span className="text-teal-400 font-semibold">Key Insight:</span> Moving from 3.0 to 5.0
            stars can increase your revenue by up to 45%. MyRevuHQ helps you systematically collect
            more 5-star reviews from satisfied customers.
          </Text>
        </div>
      </Paper>
    </div>
  );
};

