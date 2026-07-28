import qz from "qz-tray";
import { useCallback, useRef, useState } from "react";
import { useQzTray } from "./qztray.hook";
import type { IPrintOptions } from "./qztray.interface";

export const useQzPrint = () => {
	const { connect } = useQzTray();
	const [isPrinting, setIsPrinting] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const printInProgressRef = useRef(false);

	const print = useCallback(
		async ({ printer, config, data, autoDisconnect = true }: IPrintOptions) => {
			if (printInProgressRef.current) {
				const busyError = new Error("A print job is already in progress");
				setError(busyError);
				throw busyError;
			}

			printInProgressRef.current = true;
			setIsPrinting(true);
			setError(null);

			let operationError: unknown;
			let hasOperationError = false;
			let ownsConnection = false;

			try {
				if (!printer) {
					throw new Error("Printer is required");
				}

				const connectionLease = await connect();
				ownsConnection = connectionLease.ownsConnection;

				const found = await qz.printers.find(printer);

				// If found is an array, take the first element, there can be a match with multiple printers
				const printerName = Array.isArray(found) ? found[0] : found;
				if (!printerName) throw new Error(`Printer "${printer}" not found`);
				const printConfig = qz.configs.create(printerName, config);

				await qz.print(printConfig, data);
			} catch (caughtError) {
				hasOperationError = true;
				operationError = caughtError;
				setError(caughtError);
			}

			try {
				if (autoDisconnect && ownsConnection && qz.websocket.isActive()) {
					await qz.websocket.disconnect();
				}
			} catch (disconnectError) {
				if (!hasOperationError) {
					setError(disconnectError);
					operationError = disconnectError;
					hasOperationError = true;
				}
			} finally {
				printInProgressRef.current = false;
				setIsPrinting(false);
			}

			if (hasOperationError) {
				throw operationError;
			}
		},
		[connect],
	);

	return { print, isPrinting, error };
};
