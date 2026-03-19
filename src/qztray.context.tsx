import qz from "qz-tray";
import { createContext, useCallback, useEffect, useState } from "react";
import type {
	IQzTrayContextValue,
	IQzTrayProviderProps,
} from "./qztray.interface";

const QzTrayContext = createContext<IQzTrayContextValue | null>(null);

const QzTrayContextProvider = ({
	certificate,
	signaturePromise,
	signatureAlgorithm,
	wsOptions,
	autoConnect,
	onConnect,
	onDisconnect,
	onError,
	children,
}: IQzTrayProviderProps) => {
	const [lifeCycleState, setLifeCycleState] = useState<{
		isConnected: boolean;
		isConnecting: boolean;
		error: unknown;
	}>({
		isConnected: false,
		isConnecting: false,
		error: null,
	});

	useEffect(() => {
		// QZ Tray security registry
		qz.security.setSignatureAlgorithm(signatureAlgorithm ?? "SHA512");
		qz.security.setCertificatePromise((resolve) => {
			if (typeof certificate === "function") {
				certificate().then(resolve);
			} else {
				resolve(certificate);
			}
		});
		qz.security.setSignaturePromise(signaturePromise);

		// QZ Tray callback registry
		qz.websocket.setClosedCallbacks(() => {
			setLifeCycleState((prev) => ({ ...prev, isConnected: false }));
			onDisconnect?.();
		});

		qz.websocket.setErrorCallbacks((err) => {
			onError?.(err);
		});
	}, [
		certificate,
		signatureAlgorithm,
		signaturePromise,
		onDisconnect,
		onError,
	]);

	const connect = useCallback(async () => {
		setLifeCycleState((prev) => ({ ...prev, isConnecting: true }));
		try {
			await qz.websocket.connect(wsOptions);
			setLifeCycleState((prev) => ({
				...prev,
				isConnected: true,
				isConnecting: false,
			}));
			onConnect?.();
		} catch (error) {
			setLifeCycleState((prev) => ({
				...prev,
				isConnected: false,
				isConnecting: false,
				error,
			}));
			onError?.(error);
		}
	}, [wsOptions, onConnect, onError]);

	useEffect(() => {
		if (autoConnect) {
			connect();
		}
	}, [autoConnect, connect]);

	const disconnect = async () => {
		await qz.websocket.disconnect();
		setLifeCycleState((prev) => ({ ...prev, isConnected: false }));
		onDisconnect?.();
	};

	return (
		<QzTrayContext.Provider
			value={{
				isConnected: lifeCycleState.isConnected,
				isConnecting: lifeCycleState.isConnecting,
				error: lifeCycleState.error,
				connect,
				disconnect,
			}}
		>
			{children}
		</QzTrayContext.Provider>
	);
};

// biome-ignore lint/style/useComponentExportOnlyModules: library context pattern, Fast Refresh not applicable
export { QzTrayContext, QzTrayContextProvider };
