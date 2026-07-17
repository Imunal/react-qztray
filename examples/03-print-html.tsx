import { useQzPrint } from "react-qztray";

/**
 * Print an HTML string as a pixel job.
 * Useful for labels, receipts, or any content you can render as HTML.
 *
 * autoDisconnect: true (default) — disconnects from QZ Tray after the job.
 */
export const PrintHtmlLabel = () => {
	const { print, isPrinting, error } = useQzPrint();

	const handlePrint = () => {
		void print({
			printer: "ZDesigner",
			config: {
				size: { width: 100, height: 150 },
				units: "mm",
				interpolation: "nearest-neighbor",
				density: "200",
			},
			data: [
				{
					type: "pixel",
					format: "html",
					flavor: "plain",
					data: `
						<div style="font-family: sans-serif; padding: 10px;">
							<h2>Order #1234</h2>
							<p>John Doe</p>
							<p>2x Product Name</p>
						</div>
					`,
				},
			],
		}).catch(() => undefined);
	};

	return (
		<div>
			{error && (
				<p>Error: {error instanceof Error ? error.message : String(error)}</p>
			)}
			<button type="button" onClick={handlePrint} disabled={isPrinting}>
				{isPrinting ? "Printing..." : "Print label"}
			</button>
		</div>
	);
};
