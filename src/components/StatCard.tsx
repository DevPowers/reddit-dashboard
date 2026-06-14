import type { ReactNode } from "react";

interface StatCardProps {
	title: string;
	value: ReactNode;
	subtitle: ReactNode;
	iconColor: string;
	borderColor: string;
	textColor: string;
	isPulse?: boolean;
	titleElement?: ReactNode; // Optional completely custom title element
}

export function StatCard({
	title,
	value,
	subtitle,
	iconColor,
	borderColor,
	textColor,
	isPulse = false,
	titleElement,
}: StatCardProps) {
	return (
		<div
			className={`dash-card p-6 border-t-4 text-left transition-all hover:-translate-y-1 ${borderColor}`}
		>
			<h3 className="dash-title flex items-center gap-2">
				<span
					className={`w-2.5 h-2.5 rounded-full ${iconColor} ${isPulse ? "animate-pulse" : ""}`}
				/>
				{titleElement || title}
			</h3>
			<div className={`mt-2 text-2xl font-bold tracking-tight ${textColor}`}>
				{value}
			</div>
			<p className="text-xs text-[#94A3B8] mt-2 truncate" title={typeof subtitle === 'string' ? subtitle : undefined}>
				{subtitle}
			</p>
		</div>
	);
}
