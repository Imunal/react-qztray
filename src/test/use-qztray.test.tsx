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
				await result.current.connect();
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
				await result.current.connect();
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
				await result.current.connect();
			});

			// then
			expect(onError).toHaveBeenCalled();
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
	});
});
