import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PortfolioMetricsSection } from "../../src/components/dashboard/PortfolioMetricsSection";

// Mock recharts to inspect props passed to YAxis
vi.mock("recharts", async () => {
	const OriginalRechartsModule = await vi.importActual<any>("recharts");
	return {
		...OriginalRechartsModule,
		ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
		LineChart: ({ children }: any) => <div>{children}</div>,
		Line: () => <div data-testid="mock-line" />,
		XAxis: () => <div data-testid="mock-xaxis" />,
		YAxis: ({ yAxisId, domain }: any) => (
			<div
				data-testid={`mock-yaxis-${yAxisId}`}
				data-domain={JSON.stringify(domain)}
			/>
		),
		CartesianGrid: () => <div />,
		Tooltip: () => <div />,
	};
});

describe("PortfolioMetricsSection UI Math Edge Cases", () => {
	it("Scenario A: Empty State - Should format correctly with 0.00% and neutral text", () => {
		render(
			<PortfolioMetricsSection
				portfolioMetrics={{
					visitorGrowthPercent: 0,
					netNewVisitors: 0,
					contributionGrowthPercent: 0,
					netNewContributions: 0,
					weightedVelocity: 0,
				}}
				arpuAggregates={{ high: 0, medium: 0, low: 0 }}
				activeTier={null}
				setActiveTier={() => {}}
				platformHistory={[]}
			/>
		);

		// Assert Engagement Index formats exactly 0.00%
		const elements = screen.getAllByText("0.00%");
		expect(elements.length).toBeGreaterThan(0);

		// Assert Velocity formatting defaults to neutral zero (no severe decline)
		expect(screen.getByText("0.0")).toBeDefined();
		const velocityValue = screen.getByText("0.0");
		expect(velocityValue.className).toContain("text-text-muted"); // Flat styling
	});

	it("Scenario B: Single Point State - Should not classify 0 velocity as severe decline", () => {
		render(
			<PortfolioMetricsSection
				portfolioMetrics={{
					visitorGrowthPercent: 0,
					netNewVisitors: 0,
					contributionGrowthPercent: 0,
					netNewContributions: 0,
					weightedVelocity: 0,
				}}
				arpuAggregates={{ high: 0, medium: 0, low: 0 }}
				activeTier={null}
				setActiveTier={() => {}}
				platformHistory={[
					{
						id: 1,
						recordedAt: "2026-06-18T10:00:00Z",
						totalWeeklyVisitors: 1000000,
						visitorGrowthPercent: 0,
						netNewWeeklyVisitors: 0,
						totalWeeklyContributions: 10000,
						contributionGrowthPercent: 0,
						netNewWeeklyContributions: 0,
						velocityIndexScore: 0,
					},
				]}
			/>
		);

		// Assert neutral colors instead of red decline
		const velocityElement = screen.getByText("0.0");
		expect(velocityElement.className).toContain("text-text-muted");
		expect(velocityElement.className).not.toContain("text-red-500");
	});

	it("Scenario C: Multiple Points - Dual-Axis Chart Domain Constraints", () => {
		render(
			<PortfolioMetricsSection
				portfolioMetrics={{
					visitorGrowthPercent: 10,
					netNewVisitors: 10000,
					contributionGrowthPercent: 10,
					netNewContributions: 1000,
					weightedVelocity: 2.5,
				}}
				arpuAggregates={{ high: 0, medium: 0, low: 0 }}
				activeTier={null}
				setActiveTier={() => {}}
				platformHistory={[
					{
						id: 1,
						recordedAt: "2026-06-17T10:00:00Z",
						totalWeeklyVisitors: 100000,
						visitorGrowthPercent: 0,
						netNewWeeklyVisitors: 0,
						totalWeeklyContributions: 1000,
						contributionGrowthPercent: 0,
						netNewWeeklyContributions: 0,
						velocityIndexScore: 0,
					},
					{
						id: 2,
						recordedAt: "2026-06-18T10:00:00Z",
						totalWeeklyVisitors: 110000,
						visitorGrowthPercent: 10,
						netNewWeeklyVisitors: 10000,
						totalWeeklyContributions: 1100,
						contributionGrowthPercent: 10,
						netNewWeeklyContributions: 100,
						velocityIndexScore: 2.5,
					},
				]}
			/>
		);

		// Open the modal to render the charts
		const velocityButton = screen.getByText("ARPU Velocity Index").closest('button');
		act(() => {
			velocityButton?.click();
		});

		// Check the Left Y-Axis (Velocity)
		const leftAxis = screen.getByTestId("mock-yaxis-left");
		// The domain should be strictly locked to [-10, 10]
		expect(leftAxis.getAttribute("data-domain")).toBe('[-10,10]');

		// Close the modal
		const closeButton = screen.getByLabelText("Close modal");
		act(() => {
			closeButton.click();
		});

		const dauButton = screen.getByText("Weekly Visitor Growth").closest('button');
		act(() => {
			dauButton?.click();
		});

		// Check the Right Y-Axis (Percentage Growth)
		const rightAxis = screen.getByTestId("mock-yaxis-right");
		// The domain should be loosely locked around data points to prevent Recharts from snapping 0s
		expect(rightAxis.getAttribute("data-domain")).toBe('["dataMin - 2","dataMax + 2"]');
	});
});
