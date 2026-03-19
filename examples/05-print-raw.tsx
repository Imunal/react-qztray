import { useQzPrint } from "react-qztray";

/**
 * Send raw ZPL commands directly to a Zebra printer.
 * Use type "raw" + format "command" for direct printer language commands.
 */
export const PrintZpl = () => {
	const { print, isPrinting, error } = useQzPrint();

	const handlePrint = () => {
		print({
			printer: "ZDesigner",
			data: [
				{
					type: "raw",
					format: "command",
					flavor: "plain",
					data: `
						^XA
						^FO50,50^ADN,36,20^FDHello, ZPL!^FS
						^FO50,100^ADN,24,14^FDOrder #1234^FS
						^XZ
					`,
				},
			],
		});
	};

	return (
		<div>
			{error && (
				<p>Error: {error instanceof Error ? error.message : String(error)}</p>
			)}
			<button type="button" onClick={handlePrint} disabled={isPrinting}>
				{isPrinting ? "Printing..." : "Print ZPL"}
			</button>
		</div>
	);
};

/**
 * Send raw ESC/POS commands to a receipt printer.
 */
export const PrintEscPos = () => {
	const { print, isPrinting, error } = useQzPrint();

	const handlePrint = () => {
		print({
			printer: "EPSON TM-T88V",
			data: [
				{
					type: "raw",
					format: "command",
					flavor: "plain",
					data: "Hello, receipt!\n\n\n",
				},
			],
		});
	};

	return (
		<div>
			{error && (
				<p>Error: {error instanceof Error ? error.message : String(error)}</p>
			)}
			<button type="button" onClick={handlePrint} disabled={isPrinting}>
				{isPrinting ? "Printing..." : "Print receipt"}
			</button>
		</div>
	);
};
