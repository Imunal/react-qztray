import { act, render } from "@testing-library/react";
import qz from "qz-tray";
import { describe, expect, it, vi } from "vitest";
import { QzTrayContextProvider } from "../qztray.context";

const defaultProps = {
	certificate: "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----",
	signaturePromise: vi.fn(),
	children: null,
};

describe("given QzTrayContextProvider is mounted", () => {
	describe("when rendered with a certificate string", () => {
		it("then sets up security with the provided algorithm", () => {
			// given
			// when
			render(
				<QzTrayContextProvider {...defaultProps} signatureAlgorithm="SHA256" />,
			);

			// then
			expect(qz.security.setSignatureAlgorithm).toHaveBeenCalledWith("SHA256");
		});

		it("then defaults signatureAlgorithm to SHA512", () => {
			// given
			// when
			render(<QzTrayContextProvider {...defaultProps} />);

			// then
			expect(qz.security.setSignatureAlgorithm).toHaveBeenCalledWith("SHA512");
		});

		it("then registers the certificate promise", () => {
			// given
			// when
			render(<QzTrayContextProvider {...defaultProps} />);

			// then
			expect(qz.security.setCertificatePromise).toHaveBeenCalled();
		});

		it("then registers the signature promise", () => {
			// given
			// when
			render(<QzTrayContextProvider {...defaultProps} />);

			// then
			expect(qz.security.setSignaturePromise).toHaveBeenCalledWith(
				defaultProps.signaturePromise,
			);
		});
	});

	describe("when autoConnect is true", () => {
		it("then connects on mount", async () => {
			// given
			// when
			render(<QzTrayContextProvider {...defaultProps} autoConnect />);
			await act(async () => {
				await Promise.resolve();
			});

			// then
			expect(qz.websocket.connect).toHaveBeenCalled();
		});
	});

	describe("when autoConnect is false", () => {
		it("then does not connect on mount", () => {
			// given
			// when
			render(<QzTrayContextProvider {...defaultProps} autoConnect={false} />);

			// then
			expect(qz.websocket.connect).not.toHaveBeenCalled();
		});
	});

	describe("when the provider unmounts", () => {
		it("then clears QZ Tray callbacks", () => {
			// given / when
			const { unmount } = render(<QzTrayContextProvider {...defaultProps} />);
			unmount();

			// then
			expect(qz.websocket.setClosedCallbacks).toHaveBeenLastCalledWith([]);
			expect(qz.websocket.setErrorCallbacks).toHaveBeenLastCalledWith([]);
		});
	});

	describe("when autoConnect receives unstable callback props", () => {
		it("then does not reconnect after a parent rerender", async () => {
			// given
			const { rerender } = render(
				<QzTrayContextProvider
					{...defaultProps}
					autoConnect
					onConnect={() => undefined}
					wsOptions={{}}
				/>,
			);
			await act(async () => {
				await Promise.resolve();
			});

			// when
			await act(async () => {
				rerender(
					<QzTrayContextProvider
						{...defaultProps}
						autoConnect
						onConnect={() => undefined}
						wsOptions={{}}
					/>,
				);
				await Promise.resolve();
			});

			// then
			expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
		});
	});

	describe("when the async certificate provider rejects", () => {
		it("then exposes the rejection through QZ Tray's certificate handler", async () => {
			// given
			const certificateError = new Error("Certificate request failed");
			const certificate = vi.fn().mockRejectedValue(certificateError);
			render(
				<QzTrayContextProvider {...defaultProps} certificate={certificate} />,
			);
			const handler = vi
				.mocked(qz.security.setCertificatePromise)
				.mock.calls.at(-1)?.[0];

			// when / then
			await expect((handler as () => Promise<string>)()).rejects.toBe(
				certificateError,
			);
		});
	});
});
