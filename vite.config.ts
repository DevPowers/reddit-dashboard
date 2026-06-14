import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vitest/config";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		process.env.VITEST ? null : tanstackStart(),
		nitro(),
		viteReact(),
	],
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.tsx"],
		globals: true,
	},
});

export default config;
