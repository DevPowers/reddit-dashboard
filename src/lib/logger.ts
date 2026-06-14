export const logger = {
	info: (context: string, message: string, data?: any) => {
		log("INFO", context, message, data);
	},
	warn: (context: string, message: string, data?: any) => {
		log("WARN", context, message, data);
	},
	error: (context: string, message: string, error?: any) => {
		log("ERROR", context, message, error);
	},
};

function log(
	level: "INFO" | "WARN" | "ERROR",
	context: string,
	message: string,
	payload?: any,
) {
	// Format to EST (America/New_York) with 12-hour am/pm format
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});

	const timestamp = formatter.format(new Date());

	let logString = `[${timestamp}] [${level}] [${context}] ${message}`;

	if (payload) {
		const payloadString =
			payload instanceof Error
				? payload.stack || payload.message
				: JSON.stringify(payload);
		logString += ` | ${payloadString}`;
	}

	if (level === "INFO") {
		console.info(logString);
	} else if (level === "WARN") {
		console.warn(logString);
	} else if (level === "ERROR") {
		console.error(logString);
	}
}
