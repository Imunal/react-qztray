import { act, renderHook } from "@testing-library/react";
import qz from "qz-tray";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { QzTrayContextProvider } from "../qztray.context";
import { useQzTray } from "../qztray.hook";

const wrapper = ({ children }: { children: ReactNode }) => (
	<QzTrayContextProvider
		certificate="-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----"
		signaturePromise={vi.fn()}
	>
		{children}
	</QzTrayContextProvider>
);

describe("given useQzTray is used outside QzTrayContextProvider", () => {
	describe("when the hook is called", () => {
		it("then throws a descriptive error", () => {
			// given
			// when / then
			expect(() => renderHook(() => useQzTray())).toThrow(
				"useQzTray must be used within a QzTrayProvider",
			);
		});
	});
});

describe("given useQzTray is used inside QzTrayContextProvider", () => {
	describe("when first rendered", () => {
		it("then isConnected is false", () => {
			// given / when
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// then
			expect(result.current.isConnected).toBe(false);
		});

		it("then isConnecting is false", () => {
			// given / when
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// then
			expect(result.current.isConnecting).toBe(false);
		});

		it("then error is null", () => {
			// given / when
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// then
			expect(result.current.error).toBeNull();
		});
	});

	describe("when connect is called and succeeds", () => {
		it("then isConnected becomes true", async () => {
			// given
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await result.current.connect();
			});

			// then
			expect(result.current.isConnected).toBe(true);
		});

		it("then calls qz.websocket.connect", async () => {
			// given
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await result.current.connect();
			});

			// then
			expect(qz.websocket.connect).toHaveBeenCalled();
		});
	});

	describe("when connect is called and fails", () => {
		it("then isConnected remains false", async () => {
			// given
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(
				new Error("QZ Tray not running"),
			);
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await expect(result.current.connect()).rejects.toThrow(
					"QZ Tray not running",
				);
			});

			// then
			expect(result.current.isConnected).toBe(false);
		});

		it("then error is set", async () => {
			// given
			const connectionError = new Error("QZ Tray not running");
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(connectionError);
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await expect(result.current.connect()).rejects.toBe(connectionError);
			});

			// then
			expect(result.current.error).toBe(connectionError);
		});

		it("then calls onError callback", async () => {
			// given
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(
				new Error("QZ Tray not running"),
			);
			const onError = vi.fn();

			const wrapperWithError = ({ children }: { children: ReactNode }) => (
				<QzTrayContextProvider
					certificate="-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----"
					signaturePromise={vi.fn()}
					onError={onError}
				>
					{children}
				</QzTrayContextProvider>
			);

			const { result } = renderHook(() => useQzTray(), {
				wrapper: wrapperWithError,
			});

			// when
			await act(async () => {
				await expect(result.current.connect()).rejects.toThrow(
					"QZ Tray not running",
				);
			});

			// then
			expect(onError).toHaveBeenCalled();
		});

		describe("when multiple connect calls overlap", () => {
			it("then only opens one QZ connection", async () => {
				// given
				let resolveConnection!: () => void;
				vi.mocked(qz.websocket.connect).mockReturnValueOnce(
					new Promise<void>((resolve) => {
						resolveConnection = resolve;
					}),
				);
				const { result } = renderHook(() => useQzTray(), { wrapper });

				// when
				let firstConnection!: ReturnType<typeof result.current.connect>;
				let secondConnection!: ReturnType<typeof result.current.connect>;
				await act(async () => {
					firstConnection = result.current.connect();
					secondConnection = result.current.connect();
					await Promise.resolve();
				});

				// then
				expect(qz.websocket.connect).toHaveBeenCalledTimes(1);

				resolveConnection();
				await act(async () => {
					await Promise.all([firstConnection, secondConnection]);
				});
			});
		});
	});

	describe("when connect is retried after a failure", () => {
		it("then clears the previous error while the retry is in progress", async () => {
			// given
			const connectionError = new Error("QZ Tray not running");
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(connectionError);
			const { result } = renderHook(() => useQzTray(), { wrapper });
			await act(async () => {
				await expect(result.current.connect()).rejects.toBe(connectionError);
			});
			let resolveRetry!: () => void;
			vi.mocked(qz.websocket.connect).mockReturnValueOnce(
				new Promise<void>((resolve) => {
					resolveRetry = resolve;
				}),
			);

			// when
			let retry!: ReturnType<typeof result.current.connect>;
			await act(async () => {
				retry = result.current.connect();
				await Promise.resolve();
			});

			// then
			expect(result.current.isConnecting).toBe(true);
			expect(result.current.error).toBeNull();

			resolveRetry();
			await act(async () => {
				await retry;
			});
		});

		it("then clears the previous error when the socket is already active", async () => {
			// given
			const connectionError = new Error("QZ Tray not running");
			vi.mocked(qz.websocket.connect).mockRejectedValueOnce(connectionError);
			const { result } = renderHook(() => useQzTray(), { wrapper });
			await act(async () => {
				await expect(result.current.connect()).rejects.toBe(connectionError);
			});
			await qz.websocket.connect();

			// when
			await act(async () => {
				await result.current.connect();
			});

			// then
			expect(result.current.isConnected).toBe(true);
			expect(result.current.error).toBeNull();
		});
	});

	describe("when disconnect is called", () => {
		it("then isConnected becomes false", async () => {
			// given
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await result.current.connect();
				await result.current.disconnect();
			});

			// then
			expect(result.current.isConnected).toBe(false);
		});

		it("then calls qz.websocket.disconnect", async () => {
			// given
			const { result } = renderHook(() => useQzTray(), { wrapper });

			// when
			await act(async () => {
				await result.current.disconnect();
			});

			// then
			expect(qz.websocket.disconnect).toHaveBeenCalled();
		});

		it("then calls onDisconnect exactly once", async () => {
			// given
			const onDisconnect = vi.fn();
			const wrapperWithDisconnect = ({ children }: { children: ReactNode }) => (
				<QzTrayContextProvider
					certificate="-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----"
					signaturePromise={vi.fn()}
					onDisconnect={onDisconnect}
				>
					{children}
				</QzTrayContextProvider>
			);
			const { result } = renderHook(() => useQzTray(), {
				wrapper: wrapperWithDisconnect,
			});
			vi.mocked(qz.websocket.disconnect).mockImplementationOnce(async () => {
				const callback = vi
					.mocked(qz.websocket.setClosedCallbacks)
					.mock.calls.at(-1)?.[0];
				if (typeof callback === "function") callback({});
			});

			// when
			await act(async () => {
				await result.current.connect();
				await result.current.disconnect();
			});

			// then
			expect(onDisconnect).toHaveBeenCalledTimes(1);
		});
	});
});
