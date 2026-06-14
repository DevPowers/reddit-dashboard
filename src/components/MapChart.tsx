import { useState } from "react";
import {
	ComposableMap,
	Geographies,
	Geography,
	Marker,
	ZoomableGroup,
} from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// We map ISO alpha-3 country names based on the tiers
export const TIER_COUNTRIES: Record<string, string[]> = {
	high: [
		"United States of America",
		"United Kingdom",
		"Canada",
		"Germany",
		"France",
		"Japan",
		"Australia",
	],
	medium: ["Brazil", "Mexico", "Spain", "Italy"],
	low: ["India", "Philippines"],
};

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

export default function MapChart({
	activeTier,
}: {
	activeTier: "high" | "medium" | "low" | null;
}) {
	const highlighted = activeTier ? TIER_COUNTRIES[activeTier] : [];
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
											hover: {
												fill: isHighlighted ? "#FF4500" : "#3B82F6",
												outline: "none",
												cursor: "pointer",
												transition: "fill 0.2s ease",
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
								fill="#FFF"
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
					className="bg-[#162428] border border-[#1F3238] text-[#E2E8F0] w-8 h-8 rounded flex items-center justify-center hover:bg-[#1F3238] transition-colors focus:outline-none"
				>
					+
				</button>
				<button
					type="button"
					onClick={handleZoomOut}
					className="bg-[#162428] border border-[#1F3238] text-[#E2E8F0] w-8 h-8 rounded flex items-center justify-center hover:bg-[#1F3238] transition-colors focus:outline-none"
				>
					-
				</button>
			</div>
		</div>
	);
}
