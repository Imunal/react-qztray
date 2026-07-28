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
				await expect(result.current.print(printJob)).rejects.toBe(printError);
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
				await expect(result.current.print(printJob)).rejects.toThrow(
					"Print failed",
				);
			});

			// then
			expect(result.current.isPrinting).toBe(false);
		});

		it("then error is cleared on the next print call", async () => {
			// given
			vi.mocked(qz.print).mockRejectedValueOnce(new Error("Print failed"));
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			await act(async () => {
				await expect(result.current.print(printJob)).rejects.toThrow(
					"Print failed",
				);
			});

			expect(result.current.error).not.toBeNull();

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(result.current.error).toBeNull();
		});

		it("then does not search for a printer after connection failure", async () => {
			// given
			const connectionError = new Error("QZ Tray not running");
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(connectionError);
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await expect(result.current.print(printJob)).rejects.toBe(
					connectionError,
				);
			});

			// then
			expect(qz.printers.find).not.toHaveBeenCalled();
		});
	});

	describe("when printer is not found", () => {
		it("then error is set", async () => {
			// given
			vi.mocked(qz.printers.find).mockResolvedValueOnce([]);
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await expect(result.current.print(printJob)).rejects.toThrow(
					'Printer "Test Printer" not found',
				);
			});

			// then
			expect(result.current.error).toBeInstanceOf(Error);
		});
	});

	describe("when sequential print calls use the same callback", () => {
		it("then does not reconnect between jobs", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });
			const print = result.current.print;

			// when
			await act(async () => {
				await print({ ...printJob, autoDisconnect: false });
				await print({ ...printJob, autoDisconnect: false });
			});

			// then
			expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
		});
	});

	describe("when a print is already in progress", () => {
		it("then rejects the overlapping print call", async () => {
			// given
			let resolveFind!: (printer: string) => void;
			vi.mocked(qz.printers.find).mockReturnValueOnce(
				new Promise<string>((resolve) => {
					resolveFind = resolve;
				}),
			);
			const { result } = renderHook(() => useQzPrint(), { wrapper });
			let firstPrint!: Promise<void>;

			// when
			await act(async () => {
				firstPrint = result.current.print({
					...printJob,
					autoDisconnect: false,
				});
				await Promise.resolve();
			});
			let overlappingError: unknown;
			await act(async () => {
				try {
					await result.current.print({ ...printJob, autoDisconnect: false });
				} catch (error) {
					overlappingError = error;
				}
			});

			// then
			expect(overlappingError).toEqual(
				new Error("A print job is already in progress"),
			);

			resolveFind("Test Printer");
			await act(async () => {
				await firstPrint;
			});
		});

		it("then keeps rejecting overlaps until disconnect cleanup completes", async () => {
			// given
			let resolveDisconnect!: () => void;
			vi.mocked(qz.websocket.disconnect).mockReturnValueOnce(
				new Promise<void>((resolve) => {
					resolveDisconnect = resolve;
				}),
			);
			const { result } = renderHook(() => useQzPrint(), { wrapper });
			let firstPrint!: Promise<void>;
			await act(async () => {
				firstPrint = result.current.print(printJob);
				await vi.waitFor(() => {
					expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1);
				});
			});

			// when
			let overlappingError: unknown;
			await act(async () => {
				try {
					await result.current.print({ ...printJob, autoDisconnect: false });
				} catch (error) {
					overlappingError = error;
				}
			});

			// then
			expect(overlappingError).toEqual(
				new Error("A print job is already in progress"),
			);

			resolveDisconnect();
			await act(async () => {
				await firstPrint;
			});
		});
	});

	describe("when two hook instances share a pending connection", () => {
		it("then only the connection owner may disconnect it", async () => {
			// given
			let resolveConnection!: () => void;
			let resolveOwnerPrint!: () => void;
			vi.mocked(qz.websocket.isActive)
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true)
				.mockReturnValueOnce(true);
			vi.mocked(qz.websocket.connect).mockReturnValueOnce(
				new Promise<void>((resolve) => {
					resolveConnection = () => {
						resolve();
					};
				}),
			);
			vi.mocked(qz.print)
				.mockReturnValueOnce(
					new Promise<void>((resolve) => {
						resolveOwnerPrint = resolve;
					}),
				)
				.mockResolvedValueOnce(undefined);
			const { result } = renderHook(
				() => ({
					owner: useQzPrint(),
					joiner: useQzPrint(),
				}),
				{ wrapper },
			);

			// when
			let ownerPrint!: Promise<void>;
			let joinedPrint!: Promise<void>;
			await act(async () => {
				ownerPrint = result.current.owner.print(printJob);
				joinedPrint = result.current.joiner.print(printJob);
				await Promise.resolve();
			});
			resolveConnection();
			await act(async () => {
				await joinedPrint;
			});

			// then
			expect(qz.websocket.disconnect).not.toHaveBeenCalled();

			resolveOwnerPrint();
			await act(async () => {
				await ownerPrint;
			});
			expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1);
		});
	});

	describe("when a connection already exists", () => {
		it("then autoDisconnect leaves it open", async () => {
			// given
			await qz.websocket.connect();
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await result.current.print(printJob);
			});

			// then
			expect(qz.websocket.disconnect).not.toHaveBeenCalled();
		});
	});

	describe("when the printer argument is invalid", () => {
		it("then records and rejects the validation error", async () => {
			// given
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await expect(
					result.current.print({ ...printJob, printer: "" }),
				).rejects.toThrow("Printer is required");
			});

			// then
			expect(result.current.error).toEqual(new Error("Printer is required"));
		});
	});

	describe("when disconnect cleanup fails", () => {
		it("then records and rejects the cleanup error", async () => {
			// given
			const disconnectError = new Error("Disconnect failed");
			vi.mocked(qz.websocket.disconnect).mockRejectedValueOnce(disconnectError);
			const { result } = renderHook(() => useQzPrint(), { wrapper });

			// when
			await act(async () => {
				await expect(result.current.print(printJob)).rejects.toBe(
					disconnectError,
				);
			});

			// then
			expect(result.current.error).toBe(disconnectError);
		});
	});
});
