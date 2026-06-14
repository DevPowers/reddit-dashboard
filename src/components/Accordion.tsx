import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";

export function Accordion({ children }: { children: React.ReactNode }) {
	return (
		<div className="divide-y divide-[#1F3238] border-b border-[#1F3238]">
			{children}
		</div>
	);
}

export function AccordionItem({
	children,
	title,
	value,
	valueClass,
}: {
	children: React.ReactNode;
	title: string;
	value: string;
	valueClass: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="bg-[#0B1416]/50 transition-colors">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1F3238]/30 transition-all focus:outline-none cursor-pointer"
			>
				<div className="flex items-center gap-3">
					<ChevronDown
						size={18}
						className={`text-[#94A3B8] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
					<span className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wide">
						{title}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-xs text-[#94A3B8]">Avg Growth:</span>
					<span className={`text-sm font-mono font-bold ${valueClass}`}>
						{value}
					</span>
				</div>
			</button>
			{isOpen && (
				<div className="px-6 py-4 border-t border-[#1F3238]/50 bg-[#0F1C1E]">
					{children}
				</div>
			)}
		</div>
	);
}
