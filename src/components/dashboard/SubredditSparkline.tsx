import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";

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
					<XAxis dataKey="date" hide />
					<Tooltip
						contentStyle={{
							backgroundColor: "var(--color-surface-elevated)",
							borderColor: "var(--color-surface-border)",
							borderRadius: "8px",
							color: "var(--color-text-main)",
						}}
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
