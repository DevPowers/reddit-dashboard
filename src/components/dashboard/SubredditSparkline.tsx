import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
	data: any[];
	dataKey: string;
	color: string;
}

export function SubredditSparkline({ data, dataKey, color }: Props) {
	return (
		<div className="h-[200px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
					<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
					<XAxis dataKey="date" hide />
					<Tooltip
						contentStyle={{
							backgroundColor: "#1f2937",
							borderColor: "#374151",
							borderRadius: "8px",
							color: "#fff",
						}}
						itemStyle={{ color: "#fff" }}
						formatter={(value: any) => [Number(value).toLocaleString(), "Visitors"]}
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
