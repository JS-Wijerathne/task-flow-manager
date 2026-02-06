import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProjectAnalyticsDTO } from '@temp-ops/shared';

interface CompletionTimeChartProps {
    data: ProjectAnalyticsDTO['completionTimeDistribution'];
}

export const CompletionTimeChart = ({ data }: CompletionTimeChartProps) => {
    // Enforce specific order for x-axis
    const order = ['< 1 Day', '1-3 Days', '3-7 Days', '> 7 Days'];

    // Map data to chart format with safe defaults
    const chartData = order.map(range => ({
        range,
        count: data?.[range] || 0
    }));

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="range"
                        type="category"
                        width={80}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
