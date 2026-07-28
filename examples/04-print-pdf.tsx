import { useQzPrint } from "react-qztray";

/**
 * Print a PDF from a URL.
 * The PDF is fetched by QZ Tray directly — the URL must be accessible
 * from the machine running QZ Tray (not necessarily the browser).
 */
export const PrintPdf = ({ pdfUrl }: { pdfUrl: string }) => {
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
					format: "pdf",
					flavor: "file",
					data: pdfUrl,
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
				{isPrinting ? "Printing..." : "Print PDF"}
			</button>
		</div>
	);
};

/**
 * Print a PDF from a base64 string.
 * Useful when you receive the PDF as binary data from an API.
 */
export const PrintPdfBase64 = ({ base64Pdf }: { base64Pdf: string }) => {
	const { print, isPrinting, error } = useQzPrint();

	const handlePrint = () => {
		void print({
			printer: "ZDesigner",
			config: {
				size: { width: 100, height: 150 },
				units: "mm",
			},
			data: [
				{
					type: "pixel",
					format: "pdf",
					flavor: "base64",
					data: base64Pdf,
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
				{isPrinting ? "Printing..." : "Print PDF"}
			</button>
		</div>
	);
};
