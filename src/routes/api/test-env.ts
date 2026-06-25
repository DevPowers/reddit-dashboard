import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-env")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          zenrows: !!process.env.ZENROWS_API_KEY,
          zenrowsLen: process.env.ZENROWS_API_KEY?.length || 0,
          scraper1: !!process.env.SCRAPER_API_KEY_1,
        });
      },
    },
  },
});
