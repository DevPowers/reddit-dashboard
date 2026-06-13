import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// We map ISO alpha-3 country codes based on the tiers
export const TIER_COUNTRIES: Record<string, string[]> = {
	high: ["United States of America", "United Kingdom", "Canada", "Germany", "France"],
	medium: ["Brazil", "Mexico", "Spain"],
	low: ["India"],
};

export default function MapChart({
	activeTier,
}: {
	activeTier: "high" | "medium" | "low" | null;
}) {
	const highlighted = activeTier ? TIER_COUNTRIES[activeTier] : [];

	return (
		<div className="w-full max-w-4xl mx-auto h-[350px] relative">
			<ComposableMap
				projection="geoMercator"
				projectionConfig={{ scale: 120 }}
				style={{ width: "100%", height: "100%" }}
			>
				<Geographies geography={geoUrl}>
					{({ geographies }) =>
						geographies.map((geo) => {
							const isHighlighted = highlighted.includes(geo.properties.name);
							return (
								<Geography
									key={geo.rsmKey}
									geography={geo}
									fill={isHighlighted ? "#FF4500" : "#1F3238"}
									stroke="#0B1416"
									strokeWidth={0.5}
									style={{
										default: { outline: "none" },
										hover: { fill: isHighlighted ? "#FF4500" : "#3B82F6", outline: "none", cursor: "pointer", transition: "fill 0.2s ease" },
										pressed: { outline: "none" },
									}}
								/>
							);
						})
					}
				</Geographies>
			</ComposableMap>
		</div>
	);
}
