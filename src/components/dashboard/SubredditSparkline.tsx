import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
	data: any[];
	dataKey: string;
	color: string;
}

export function SubredditSparkline({ data, dataKey, color }: Props) {
	if (!data || data.length === 0) return null;
	
	const formatDetailed = (num: number) => {
		if (num >= 1_000_000_000) return parseFloat((num / 1_000_000_000).toFixed(3)) + 'B';
		if (num >= 1_000_000) return parseFloat((num / 1_000_000).toFixed(3)) + 'M';
		if (num >= 1_000) return parseFloat((num / 1_000).toFixed(1)) + 'K';
		return num.toLocaleString();
	};

	if (data.length === 1) {
		return (
			<div className="h-[200px] w-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg bg-[#161b1d]/50">
				<div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: color }} />
				<p className="text-zinc-400 text-sm font-medium">Insufficient Data</p>
				<p className="text-zinc-500 text-xs mt-1 max-w-[250px] text-center">
					Check back tomorrow for trend lines. Currently tracking {formatDetailed(data[0][dataKey])} visitors.
				</p>
			</div>
		);
	}

	return (
		<div className="h-[200px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
					<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
					<YAxis 
						hide 
						domain={[
							(dataMin: number) => dataMin - (Math.abs(dataMin) * 0.02), 
							(dataMax: number) => dataMax + (Math.abs(dataMax) * 0.02)
						]} 
					/>
					<XAxis dataKey="date" hide />
					<Tooltip
						contentStyle={{
							backgroundColor: "#1f2937",
							borderColor: "#374151",
							borderRadius: "8px",
							color: "#fff",
						}}
						itemStyle={{ color: "#fff" }}
						formatter={(value: any) => [formatDetailed(Number(value)), "Visitors"]}
					/>
					<Line
						type="monotone"
						dataKey={dataKey}
						stroke={color}
						strokeWidth={2}
						dot={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
