import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";

export function Accordion({ children }: { children: React.ReactNode }) {
	return (
		<div className="divide-y divide-obsidian-border border-b border-obsidian-border">
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
		<div className="bg-obsidian/50 transition-colors">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-6 py-4 hover:bg-obsidian-border/30 transition-all focus:outline-none cursor-pointer"
			>
				<div className="flex items-center gap-3">
					<ChevronDown
						size={18}
						className={`text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
					<span className="text-sm font-bold text-text-main uppercase tracking-wide">
						{title}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-xs text-text-muted">Avg Growth:</span>
					<span className={`text-sm font-mono font-bold ${valueClass}`}>
						{value}
					</span>
				</div>
			</button>
			{isOpen && (
				<div className="px-6 py-4 border-t border-obsidian-border/50 bg-obsidian-light">
					{children}
				</div>
			)}
		</div>
	);
}
