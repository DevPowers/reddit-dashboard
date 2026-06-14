export const formatGrowth = (val: number) =>
	`${val > 0 ? "+" : ""}${val.toFixed(2)}%`;

export const getGrowthColorClass = (val: number) => {
	if (val > 1) return "text-success";
	if (val < -1) return "text-danger";
	return "text-white";
};
