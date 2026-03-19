import { useQzTray } from "react-qztray";

/**
 * useQzTray gives you full control over the connection lifecycle.
 * Use it to build a connection status indicator or manual connect/disconnect UI.
 */
export const ConnectionStatus = () => {
	const { isConnected, isConnecting, error, connect, disconnect } = useQzTray();

	return (
		<div>
			<p>
				Status:{" "}
				{isConnecting
					? "Connecting..."
					: isConnected
						? "Connected"
						: "Disconnected"}
			</p>

			{error && (
				<p>Error: {error instanceof Error ? error.message : String(error)}</p>
			)}

			<button
				type="button"
				onClick={connect}
				disabled={isConnected || isConnecting}
			>
				Connect
			</button>
			<button type="button" onClick={disconnect} disabled={!isConnected}>
				Disconnect
			</button>
		</div>
	);
};

/**
 * Use autoConnect on the provider to connect as soon as the app mounts,
 * without needing to call connect() manually.
 */
export const AutoConnectSetup = () => {
	// In your root file:
	// <QzTrayProvider autoConnect certificate={...} signaturePromise={...}>
	//   <App />
	// </QzTrayProvider>

	// Then anywhere in your app:
	const { isConnected } = useQzTray();
	return <p>{isConnected ? "Ready to print" : "Connecting to QZ Tray..."}</p>;
};
