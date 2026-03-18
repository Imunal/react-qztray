import { act, renderHook } from "@testing-library/react";
import qz from "qz-tray";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useQzPrint } from "../qzprint.hook";
import { QzTrayContextProvider } from "../qztray.context";

const wrapper = ({ children }: { children: ReactNode }) => (
	<QzTrayContextProvider
		certificate="-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----"
		signaturePromise={vi.fn()}
	>
		{children}
	</QzTrayContextProvider>
);

const printJob = {
	printer: "Test Printer",
	data: [
		{
			type: "pixel" as const,
			format: "html" as const,
			flavor: "plain" as const,
			data: "<p>test</p>",
		},
	],
};

describe("given useQzPrint is used inside QzTrayContextProvider", () => {
	describe("when first rendered", () => {
		it("then isPrinting is false", () => {
			// given / when
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// then
			expect(result.current.isPrinting).toBe(false);
		});

		it("then error is null", () => {
			// given / when
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// then
			expect(result.current.error).toBeNull();
		});
	});

	describe("when print is called and succeeds", () => {
		it("then calls qz.printers.find with the printer name", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(qz.printers.find).toHaveBeenCalledWith("Test Printer");
		});

		it("then calls qz.print with the config and data", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(qz.print).toHaveBeenCalled();
		});

		it("then isPrinting returns to false after completion", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.isPrinting).toBe(false);
		});

		it("then disconnects when autoDisconnect is true", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print({ ...printJob, autoDisconnect: true });
			});

			// then
			expect(qz.websocket.disconnect).toHaveBeenCalled();
		});

		it("then does not disconnect when autoDisconnect is false", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print({ ...printJob, autoDisconnect: false });
			});

			// then
			expect(qz.websocket.disconnect).not.toHaveBeenCalled();
		});
	});

	describe("when print is called and fails", () => {
		it("then error is set", async () => {
			// given
			const printError = new Error("Print failed");
			vi.mocked(qz.print).mockRejectedValueOnce(printError);
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.error).toBe(printError);
		});

		it("then isPrinting returns to false", async () => {
			// given
			vi.mocked(qz.print).mockRejectedValueOnce(new Error("Print failed"));
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.isPrinting).toBe(false);
		});

		it("then error is cleared on the next print call", async () => {
			// given
			vi.mocked(qz.print).mockRejectedValueOnce(new Error("Print failed"));
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			await act(async () => {
				await result.current.print(printJob);
			});

			expect(result.current.error).not.toBeNull();

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.error).toBeNull();
		});
	});

	describe("when printer is not found", () => {
		it("then error is set", async () => {
			// given
			vi.mocked(qz.printers.find).mockResolvedValueOnce([]);
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.error).toBeInstanceOf(Error);
		});
	});
});
