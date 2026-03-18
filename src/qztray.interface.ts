import type {
	Algorithm,
	ConnectOptions,
	PrintData,
	PrinterOptions,
	PromiseFactory,
} from "qz-tray";
import type { ReactNode } from "react";

export interface IPrintOptions {
	printer: string;
	config?: PrinterOptions;
	data: PrintData[];
	autoDisconnect?: boolean;
}

export interface IQzTrayProviderProps {
	certificate: string | (() => Promise<string>);
	signaturePromise: PromiseFactory;
	signatureAlgorithm?: Algorithm; // This will default to SHA512 in provider

	wsOptions?: ConnectOptions;
	autoConnect?: boolean;

	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (error: unknown) => void;

	children: ReactNode;
}
export interface IQzTrayContextValue {
	isConnected: boolean;
	isConnecting: boolean;
	error: unknown;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
}
