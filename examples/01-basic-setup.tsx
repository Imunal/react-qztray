import { QzTrayProvider } from "react-qztray";
import App from "./App";

/**
 * Wrap your app with QzTrayProvider at the root level.
 *
 * certificate  — your public PEM cert from QZ Tray's signing tool.
 *                Can be a string or an async function that fetches it.
 *
 * signaturePromise — calls your backend to sign each request.
 *                    Must match the PromiseFactory shape from qz-tray.
 */
export const Root = () => (
	<QzTrayProvider
		certificate="-----BEGIN CERTIFICATE-----\nYOUR_CERT_HERE\n-----END CERTIFICATE-----"
		signatureAlgorithm="SHA512"
		signaturePromise={(toSign) => (resolve) => {
			fetch("/api/sign", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ toSign }),
			})
				.then((res) => res.text())
				.then(resolve);
		}}
	>
		<App />
	</QzTrayProvider>
);

/**
 * Alternatively, fetch the certificate asynchronously.
 */
export const RootWithAsyncCert = () => (
	<QzTrayProvider
		certificate={() => fetch("/api/certificate").then((res) => res.text())}
		signatureAlgorithm="SHA512"
		signaturePromise={(toSign) => (resolve) => {
			fetch("/api/sign", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ toSign }),
			})
				.then((res) => res.text())
				.then(resolve);
		}}
	>
		<App />
	</QzTrayProvider>
);
