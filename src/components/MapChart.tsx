import { useState, useMemo } from "react";
import {
	ComposableMap,
	Geographies,
	Geography,
	Marker,
	ZoomableGroup,
} from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";



// Coordinate mapping for markers [longitude, latitude]
const COUNTRY_MARKERS = [
	{ name: "US", coordinates: [-95.7129, 37.0902] as [number, number] },
	{ name: "UK", coordinates: [-3.4359, 55.3781] as [number, number] },
	{ name: "CA", coordinates: [-106.3468, 56.1304] as [number, number] },
	{ name: "DE", coordinates: [10.4515, 51.1657] as [number, number] },
	{ name: "FR", coordinates: [2.2137, 46.2276] as [number, number] },
	{ name: "JP", coordinates: [138.2529, 36.2048] as [number, number] },
	{ name: "AU", coordinates: [133.7751, -25.2744] as [number, number] },
	{ name: "IT", coordinates: [12.5674, 41.8719] as [number, number] },
	{ name: "BR", coordinates: [-51.9253, -14.235] as [number, number] },
	{ name: "MX", coordinates: [-102.5528, 23.6345] as [number, number] },
	{ name: "ES", coordinates: [-3.7492, 40.4637] as [number, number] },
	{ name: "IN", coordinates: [78.9629, 20.5937] as [number, number] },
	{ name: "PH", coordinates: [121.7740, 12.8797] as [number, number] },
];

interface MapChartProps {
	countryData?: { name: string; growth: number }[];
}

// Map our DB names to world-atlas names if they differ
const COUNTRY_NAME_MAP: Record<string, string> = {
	"United States": "United States of America",
};

// Interpolate colors based on growth
const getGrowthColor = (growth: number) => {
	if (growth === undefined || growth === null) return "var(--color-obsidian-border)";
	
	// Negative growth: fade to danger (red)
	if (growth < 0) {
		const opacity = Math.max(0.1, Math.min(1, Math.abs(growth) / 10));
		return `rgba(239, 68, 68, ${opacity})`;
	}
	
	// Positive growth: fade to orangered
	const opacity = Math.max(0.2, Math.min(1, growth / 10));
	return `rgba(255, 69, 0, ${opacity})`;
};

export default function MapChart({ countryData = [] }: MapChartProps) {
	// Create a quick lookup map for O(1) checks during render
	const growthMap = useMemo(() => {
		const map = new Map<string, number>();
		for (const d of countryData) {
			const mapName = COUNTRY_NAME_MAP[d.name] || d.name;
			map.set(mapName, d.growth);
		}
		return map;
	}, [countryData]);
	const [position, setPosition] = useState({
		coordinates: [0, 20] as [number, number],
		zoom: 1,
	});

	const handleZoomIn = () => {
		if (position.zoom >= 4) return;
		setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
	};

	const handleZoomOut = () => {
		if (position.zoom <= 1) return;
		setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
	};

	const handleMoveEnd = (position: any) => {
		setPosition(position);
	};

	return (
		<div className="w-full max-w-4xl mx-auto h-[350px] relative">
			<ComposableMap
				projection="geoMercator"
				projectionConfig={{ scale: 120 }}
				style={{ width: "100%", height: "100%" }}
			>
				<ZoomableGroup
					zoom={position.zoom}
					center={position.coordinates}
					onMoveEnd={handleMoveEnd}
				>
					<Geographies geography={geoUrl}>
						{({ geographies }) =>
							geographies.map((geo) => {
								const geoName = geo.properties.name;
								const growth = growthMap.get(geoName);
								const hasData = growth !== undefined;
								const fillColor = hasData ? getGrowthColor(growth) : "var(--color-obsidian-border)";

								return (
									<Geography
										key={geo.rsmKey}
										geography={geo}
										fill={fillColor}
										stroke="var(--color-obsidian)"
										strokeWidth={0.5}
										style={{
											default: { outline: "none", transition: "all 0.3s ease" },
											hover: {
												fill: hasData ? "var(--color-orangered)" : "var(--color-chart-8)",
												outline: "none",
												cursor: hasData ? "pointer" : "default",
											},
											pressed: { outline: "none" },
										}}
									/>
								);
							})
						}
					</Geographies>
					{COUNTRY_MARKERS.map(({ name, coordinates }) => (
						<Marker key={name} coordinates={coordinates}>
							<text
								textAnchor="middle"
								fill="var(--color-text-main)"
								fontSize={10}
								fontWeight="bold"
								style={{
									pointerEvents: "none",
									textShadow: "0px 0px 3px rgba(0,0,0,0.8)",
								}}
							>
								{name}
							</text>
						</Marker>
					))}
				</ZoomableGroup>
			</ComposableMap>

			{/* Zoom Controls */}
			<div className="absolute bottom-4 right-4 flex flex-col gap-2">
				<button
					type="button"
					onClick={handleZoomIn}
					className="bg-obsidian-light border border-obsidian-border text-text-main w-8 h-8 rounded flex items-center justify-center hover:bg-obsidian-border transition-colors focus:outline-none cursor-pointer"
				>
					+
				</button>
				<button
					type="button"
					onClick={handleZoomOut}
					className="bg-obsidian-light border border-obsidian-border text-text-main w-8 h-8 rounded flex items-center justify-center hover:bg-obsidian-border transition-colors focus:outline-none cursor-pointer"
				>
					-
				</button>
			</div>
		</div>
	);
}
