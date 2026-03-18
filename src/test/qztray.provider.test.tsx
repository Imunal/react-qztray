import { render } from "@testing-library/react";
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
});
