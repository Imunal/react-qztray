import qz from "qz-tray";
import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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
	const connectPromiseRef = useRef<Promise<void> | null>(null);
	const connectRef = useRef<(() => Promise<void>) | null>(null);
	const mountedRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
			qz.websocket.setClosedCallbacks([]);
			qz.websocket.setErrorCallbacks([]);
		};
	}, []);

	useEffect(() => {
		// QZ Tray security registry
		qz.security.setSignatureAlgorithm(signatureAlgorithm ?? "SHA512");
		const certificateProvider = async () =>
			typeof certificate === "function" ? certificate() : certificate;
		qz.security.setCertificatePromise(
			certificateProvider as Parameters<
				typeof qz.security.setCertificatePromise
			>[0],
		);
		qz.security.setSignaturePromise(signaturePromise);

		// QZ Tray callback registry
		qz.websocket.setClosedCallbacks(() => {
			if (!mountedRef.current) return;

			setLifeCycleState((prev) => ({
				...prev,
				isConnected: false,
				isConnecting: false,
			}));
			onDisconnect?.();
		});

		qz.websocket.setErrorCallbacks((err) => {
			if (mountedRef.current) {
				onError?.(err);
			}
		});
	}, [
		certificate,
		signatureAlgorithm,
		signaturePromise,
		onDisconnect,
		onError,
	]);

	const connect = useCallback(async () => {
		if (connectPromiseRef.current) {
			return connectPromiseRef.current;
		}

		if (qz.websocket.isActive()) {
			if (mountedRef.current) {
				setLifeCycleState((prev) => ({
					...prev,
					isConnected: true,
					isConnecting: false,
				}));
			}
			return;
		}

		const connectionPromise = (async () => {
			if (mountedRef.current) {
				setLifeCycleState((prev) => ({ ...prev, isConnecting: true }));
			}

			try {
				await qz.websocket.connect(wsOptions);
				if (mountedRef.current) {
					setLifeCycleState((prev) => ({
						...prev,
						isConnected: true,
						isConnecting: false,
					}));
					onConnect?.();
				}
			} catch (error) {
				if (mountedRef.current) {
					setLifeCycleState((prev) => ({
						...prev,
						isConnected: false,
						isConnecting: false,
						error,
					}));
					onError?.(error);
				}
				throw error;
			} finally {
				connectPromiseRef.current = null;
			}
		})();

		connectPromiseRef.current = connectionPromise;
		return connectionPromise;
	}, [wsOptions, onConnect, onError]);

	useEffect(() => {
		connectRef.current = connect;
	}, [connect]);

	useEffect(() => {
		if (autoConnect) {
			void connectRef.current?.().catch(() => undefined);
		}
	}, [autoConnect]);

	const disconnect = useCallback(async () => {
		try {
			await qz.websocket.disconnect();
		} finally {
			if (mountedRef.current) {
				setLifeCycleState((prev) => ({
					...prev,
					isConnected: false,
					isConnecting: false,
				}));
			}
		}
	}, []);
	const contextValue = useMemo(
		() => ({
			isConnected: lifeCycleState.isConnected,
			isConnecting: lifeCycleState.isConnecting,
			error: lifeCycleState.error,
			connect,
			disconnect,
		}),
		[lifeCycleState, connect, disconnect],
	);

	return (
		<QzTrayContext.Provider value={contextValue}>
			{children}
		</QzTrayContext.Provider>
	);
};

// biome-ignore lint/style/useComponentExportOnlyModules: library context pattern, Fast Refresh not applicable
export { QzTrayContext, QzTrayContextProvider };
