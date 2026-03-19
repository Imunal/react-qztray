import qz from "qz-tray";
import { useState } from "react";
import { useQzTray } from "./qztray.hook";
import type { IPrintOptions } from "./qztray.interface";

export const useQzPrint = () => {
	const { isConnected, connect } = useQzTray();
	const [isPrinting, setIsPrinting] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const print = async ({
		printer,
		config,
		data,
		autoDisconnect = true,
	}: IPrintOptions) => {
		setError(null);

		if (!printer) {
			throw new Error("Printer is required");
		}

		try {
			// Connect to QZ Tray if not connected
			if (!isConnected) {
				await connect();
			}

			const found = await qz.printers.find(printer);

			// If found is an array, take the first element, there can be a match with multiple printers
			const printerName = Array.isArray(found) ? found[0] : found;
			if (!printerName) throw new Error(`Printer "${printer}" not found`);
			const printConfig = qz.configs.create(printerName, config);

			setIsPrinting(true);
			await qz.print(printConfig, data);
		} catch (error) {
			setError(error);
		} finally {
			setIsPrinting(false);
			if (autoDisconnect && qz.websocket.isActive()) {
				await qz.websocket.disconnect();
			}
		}
	};

	return { print, isPrinting, error };
};
