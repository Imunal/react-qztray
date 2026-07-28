import "@testing-library/jest-dom";
import qz from "qz-tray";
import { afterEach, vi } from "vitest";

let _isActive = false;
let _certificateHandler: (() => Promise<string>) | undefined;
let _rejectOnCertificateFailure = false;

vi.mock("qz-tray", () => ({
	default: {
		security: {
			setSignatureAlgorithm: vi.fn(),
			setCertificatePromise: vi.fn(),
			setSignaturePromise: vi.fn(),
		},
		websocket: {
			connect: vi.fn(),
			disconnect: vi.fn(),
			isActive: vi.fn(),
			setClosedCallbacks: vi.fn(),
			setErrorCallbacks: vi.fn(),
		},
		printers: {
			find: vi.fn(),
		},
		configs: {
			create: vi.fn(),
		},
		print: vi.fn(),
	},
}));

const initializeQzTrayMocks = () => {
	vi.mocked(qz.security.setCertificatePromise).mockImplementation(
		(handler, options) => {
			_certificateHandler = handler as unknown as () => Promise<string>;
			_rejectOnCertificateFailure = options?.rejectOnFailure === true;
		},
	);
	vi.mocked(qz.websocket.connect).mockImplementation(async () => {
		try {
			await _certificateHandler?.();
		} catch (error) {
			if (_rejectOnCertificateFailure) {
				throw error;
			}
		}
		_isActive = true;
	});
	vi.mocked(qz.websocket.disconnect).mockImplementation(() => {
		_isActive = false;
		return Promise.resolve();
	});
	vi.mocked(qz.websocket.isActive).mockImplementation(() => _isActive);
	vi.mocked(qz.printers.find).mockResolvedValue("Test Printer");
	vi.mocked(qz.configs.create).mockReturnValue({});
	vi.mocked(qz.print).mockResolvedValue(undefined);
};

initializeQzTrayMocks();

afterEach(() => {
	_isActive = false;
	_certificateHandler = undefined;
	_rejectOnCertificateFailure = false;
	vi.resetAllMocks();
	initializeQzTrayMocks();
});
