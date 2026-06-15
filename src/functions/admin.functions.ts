import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getAdminStats } from "../services/admin.service";

export const getAdminData = createServerFn({ method: "GET" }).handler(
	async () => {

		return await getAdminStats();
	}
);
