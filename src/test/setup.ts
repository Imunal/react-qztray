import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

afterEach(() => {
	vi.clearAllMocks();
});

let _isActive = false;

vi.mock("qz-tray", () => ({
	default: {
		security: {
			setSignatureAlgorithm: vi.fn(),
			setCertificatePromise: vi.fn(),
			setSignaturePromise: vi.fn(),
		},
		websocket: {
			connect: vi.fn().mockImplementation(() => {
				_isActive = true;
				return Promise.resolve();
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
});
