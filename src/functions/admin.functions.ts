import { createServerFn } from "@tanstack/react-start";
import { getAdminStats } from "../services/admin.service";

export const getAdminData = createServerFn({ method: "GET" }).handler(
	async () => {

		return await getAdminStats();
	}
);
