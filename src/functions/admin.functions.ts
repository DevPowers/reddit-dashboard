import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getAdminStats } from "../services/admin.service";

export const getAdminData = createServerFn({ method: "GET" }).handler(
	async () => {
		const ADMIN_SECRET = process.env.ADMIN_SECRET;
		if (process.env.NODE_ENV === "production" && !ADMIN_SECRET) {
			throw new Error("ADMIN_SECRET is required in production");
		}
		if (ADMIN_SECRET) {
			const authHeader = getRequestHeader("authorization");
			if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
				throw new Error("Unauthorized");
			}
		}

		return await getAdminStats();
	}
);
