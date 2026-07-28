import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

afterEach(() => {
	vi.clearAllMocks();
});

let _isActive = false;
let _certificateHandler: (() => Promise<string>) | undefined;
let _rejectOnCertificateFailure = false;

vi.mock("qz-tray", () => ({
	default: {
		security: {
			setSignatureAlgorithm: vi.fn(),
			setCertificatePromise: vi.fn(
				(
					handler: () => Promise<string>,
					options?: { rejectOnFailure?: boolean },
				) => {
					_certificateHandler = handler;
					_rejectOnCertificateFailure = options?.rejectOnFailure === true;
				},
			),
			setSignaturePromise: vi.fn(),
		},
		websocket: {
			connect: vi.fn().mockImplementation(async () => {
				try {
					await _certificateHandler?.();
				} catch (error) {
					if (_rejectOnCertificateFailure) {
						throw error;
					}
				}
				_isActive = true;
			}),
			disconnect: vi.fn().mockImplementation(() => {
				_isActive = false;
				return Promise.resolve();
			}),
			isActive: vi.fn().mockImplementation(() => _isActive),
			setClosedCallbacks: vi.fn(),
			setErrorCallbacks: vi.fn(),
		},
		printers: {
			find: vi.fn().mockResolvedValue("Test Printer"),
		},
		configs: {
			create: vi.fn().mockReturnValue({}),
		},
		print: vi.fn().mockResolvedValue(undefined),
	},
}));

afterEach(() => {
	_isActive = false;
	_certificateHandler = undefined;
	_rejectOnCertificateFailure = false;
});
