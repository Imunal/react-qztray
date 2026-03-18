import { useQzPrint } from "react-qztray";

/**
 * Print multiple jobs in sequence without disconnecting between them.
 * Set autoDisconnect: false on all jobs except the last one.
 *
 * Useful when printing to multiple printers in one action,
 * e.g. a production label + a delivery label.
 */
export const PrintMultipleJobs = () => {
	const { print, isPrinting, error } = useQzPrint();

	const handlePrint = async () => {
		await print({
			printer: "Godex RT230i",
			config: {
				size: { width: 32, height: 25 },
				units: "mm",
				colorType: "grayscale",
			},
			data: [
				{
					type: "pixel",
					format: "html",
					flavor: "plain",
					data: "<p style='font-family:sans-serif;font-size:12px'>Production label</p>",
				},
			],
			autoDisconnect: false,
		});

		await print({
			printer: "ZDesigner",
			config: {
				size: { width: 100, height: 150 },
				units: "mm",
				density: "200",
			},
			data: [
				{
					type: "pixel",
					format: "html",
					flavor: "plain",
					data: "<p style='font-family:sans-serif;font-size:16px'>Delivery label</p>",
				},
			],
			autoDisconnect: true,
		});
	};

	return (
		<div>
			{error && (
				<p>Error: {error instanceof Error ? error.message : String(error)}</p>
			)}
			<button type="button" onClick={handlePrint} disabled={isPrinting}>
				{isPrinting ? "Printing..." : "Print both labels"}
			</button>
		</div>
	);
};
