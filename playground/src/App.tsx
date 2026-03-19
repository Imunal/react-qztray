import type { PrinterOptions } from "qz-tray";
import { useId, useState } from "react";
import { QzTrayProvider, useQzPrint, useQzTray } from "react-qztray";

const DEFAULT_CONFIG = JSON.stringify(
	{
		size: { width: 100, height: 150 },
		units: "mm",
		interpolation: "nearest-neighbor",
	} satisfies PrinterOptions,
	null,
	2,
);

const DEFAULT_CONTENT =
	"<h1 style='font-family:sans-serif'>Hello from react-qztray!</h1>";

interface QzConfig {
	certificate: string;
	signatureEndpoint: string;
}

const input =
	"w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500";
const label =
	"block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
const btn =
	"px-4 py-2 text-sm font-medium border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

const ConfigPanel = ({ onApply }: { onApply: (config: QzConfig) => void }) => {
	const [certificate, setCertificate] = useState("");
	const [signatureEndpoint, setSignatureEndpoint] = useState("/api/sign");
	const certificateId = useId();
	const signatureEndpointId = useId();

	const canApply = certificate.trim().startsWith("-----BEGIN CERTIFICATE-----");

	return (
		<div className="border border-gray-200 bg-white p-6 space-y-4">
			<h2 className="text-sm font-semibold text-gray-900">Setup</h2>

			<div>
				<label className={label} htmlFor={certificateId}>
					Certificate (PEM)
				</label>
				<textarea
					id={certificateId}
					className={`${input} font-mono text-xs`}
					value={certificate}
					onChange={(e) => setCertificate(e.target.value)}
					rows={8}
					placeholder={
						"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
					}
				/>
			</div>

			<div>
				<label className={label} htmlFor={signatureEndpointId}>
					Signature endpoint
				</label>
				<input
					id={signatureEndpointId}
					className={input}
					type="text"
					value={signatureEndpoint}
					onChange={(e) => setSignatureEndpoint(e.target.value)}
					placeholder="/api/sign"
				/>
				<p className="mt-1 text-xs text-gray-400">
					POST — receives{" "}
					<code className="bg-gray-100 px-1">{"{ toSign: string }"}</code>,
					returns the signature.
				</p>
			</div>

			<button
				type="button"
				className={`${btn} w-full bg-gray-900 text-white border-gray-900 hover:bg-gray-800`}
				onClick={() =>
					onApply({ certificate: certificate.trim(), signatureEndpoint })
				}
				disabled={!canApply}
			>
				Initialise
			</button>
		</div>
	);
};

const ConnectionPanel = ({ onReset }: { onReset: () => void }) => {
	const { isConnected, isConnecting, error, connect, disconnect } = useQzTray();

	return (
		<div className="border border-gray-200 bg-white p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold text-gray-900">Connection</h2>
				<button
					type="button"
					onClick={onReset}
					className="text-xs text-gray-400 underline hover:text-gray-600"
				>
					change config
				</button>
			</div>

			<div className="flex items-center gap-2">
				<span
					className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-400 animate-pulse" : "bg-gray-300"}`}
				/>
				<span className="text-sm text-gray-600">
					{isConnecting
						? "Connecting..."
						: isConnected
							? "Connected to QZ Tray"
							: "Not connected"}
				</span>
			</div>

			{!!error && (
				<p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
					{error instanceof Error ? error.message : String(error)}
				</p>
			)}

			<div className="flex gap-2">
				<button
					type="button"
					className={`${btn} bg-gray-900 text-white border-gray-900 hover:bg-gray-800`}
					onClick={connect}
					disabled={isConnected || isConnecting}
				>
					Connect
				</button>
				<button
					type="button"
					className={`${btn} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`}
					onClick={disconnect}
					disabled={!isConnected}
				>
					Disconnect
				</button>
			</div>
		</div>
	);
};

const PrintPanel = () => {
	const { print, isPrinting, error } = useQzPrint();
	const [printer, setPrinter] = useState("ZDesigner");
	const [configJson, setConfigJson] = useState(DEFAULT_CONFIG);
	const [content, setContent] = useState(DEFAULT_CONTENT);
	const [configError, setConfigError] = useState<string | null>(null);
	const printerNameId = useId();
	const printerConfigId = useId();
	const htmlContentId = useId();

	const handlePrint = () => {
		let config: PrinterOptions;
		try {
			config = JSON.parse(configJson);
			setConfigError(null);
		} catch {
			setConfigError("Invalid JSON");
			return;
		}

		print({
			printer,
			config,
			data: [{ type: "pixel", format: "html", flavor: "plain", data: content }],
			autoDisconnect: true,
		});
	};

	return (
		<div className="border border-gray-200 bg-white p-6 space-y-4">
			<h2 className="text-sm font-semibold text-gray-900">Print job</h2>

			<div>
				<label className={label} htmlFor={printerNameId}>
					Printer name
				</label>
				<input
					id={printerNameId}
					className={input}
					type="text"
					value={printer}
					onChange={(e) => setPrinter(e.target.value)}
					placeholder="e.g. ZDesigner, Godex RT230i"
				/>
			</div>

			<div>
				<label className={label} htmlFor={printerConfigId}>
					Config (PrinterOptions JSON)
				</label>
				<textarea
					id={printerConfigId}
					className={`${input} font-mono`}
					value={configJson}
					onChange={(e) => setConfigJson(e.target.value)}
					rows={7}
				/>
				{configError && (
					<p className="mt-1 text-xs text-red-500">{configError}</p>
				)}
			</div>

			<div>
				<label className={label} htmlFor={htmlContentId}>
					HTML content
				</label>
				<textarea
					id={htmlContentId}
					className={`${input} font-mono`}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					rows={3}
				/>
			</div>

			{!!error && (
				<p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
					{error instanceof Error ? error.message : String(error)}
				</p>
			)}

			<button
				type="button"
				className={`${btn} w-full bg-gray-900 text-white border-gray-900 hover:bg-gray-800`}
				onClick={handlePrint}
				disabled={isPrinting || !printer}
			>
				{isPrinting ? "Sending..." : "Send print job"}
			</button>
		</div>
	);
};

const App = () => {
	const [qzConfig, setQzConfig] = useState<QzConfig | null>(null);

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="mx-auto max-w-lg space-y-3">
				<div className="mb-6">
					<h1 className="text-xl font-semibold text-gray-900">
						react-qztray playground
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						Make sure QZ Tray is running on your desktop.
					</p>
				</div>

				{!qzConfig ? (
					<ConfigPanel onApply={setQzConfig} />
				) : (
					<QzTrayProvider
						key={`${qzConfig.certificate}-${qzConfig.signatureEndpoint}`}
						certificate={qzConfig.certificate}
						signatureAlgorithm="SHA512"
						signaturePromise={(toSign) => (resolve) => {
							fetch(qzConfig.signatureEndpoint, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ toSign }),
							})
								.then((res) => res.text())
								.then(resolve);
						}}
						onConnect={() => console.log("QZ Tray connected")}
						onDisconnect={() => console.log("QZ Tray disconnected")}
						onError={(err) => console.error("QZ Tray error:", err)}
					>
						<ConnectionPanel onReset={() => setQzConfig(null)} />
						<PrintPanel />
					</QzTrayProvider>
				)}
			</div>
		</div>
	);
};

export default App;
