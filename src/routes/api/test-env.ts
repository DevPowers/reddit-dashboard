import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-env")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({

          scraper1: !!process.env.SCRAPER_API_KEY_1,
        });
      },
    },
  },
});
