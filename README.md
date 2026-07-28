# react-qztray

React hooks for seamless integration with [QZ Tray](https://qz.io) — the browser-to-desktop print connector.

[![npm version](https://img.shields.io/npm/v/react-qztray)](https://www.npmjs.com/package/react-qztray)
[![license](https://img.shields.io/npm/l/react-qztray)](./LICENSE)

---

## Requirements

- QZ Tray desktop application running on the user's machine ([download](https://qz.io/download/))
- React 18 or 19
- A backend endpoint to sign QZ Tray requests (required for production use)

## Tutorials

- [How to sign QZ Tray requests in Node.js](#)
- [How to generate a self-signed certificate for QZ Tray](#)

---

## Installation

```bash
npm install react-qztray
# or
pnpm add react-qztray
```

---

## Quick start

**1. Wrap your app with `QzTrayProvider`**

```tsx
import { QzTrayProvider } from 'react-qztray';

export const Root = () => (
  <QzTrayProvider
    certificate="-----BEGIN CERTIFICATE-----\nYOUR_CERT_HERE\n-----END CERTIFICATE-----"
    signatureAlgorithm="SHA512"
    signaturePromise={(toSign) => (resolve) => {
      fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toSign }),
      })
        .then((res) => res.text())
        .then(resolve);
    }}
  >
    <App />
  </QzTrayProvider>
);
```

**2. Connect and print**

```tsx
import { useQzPrint } from 'react-qztray';

const PrintButton = () => {
  const { print, isPrinting, error } = useQzPrint();

  const handlePrint = async () => {
    try {
      await print({
        printer: 'ZDesigner',
        config: { size: { width: 100, height: 150 }, units: 'mm' },
        data: [{ type: 'pixel', format: 'html', flavor: 'plain', data: '<h1>Hello!</h1>' }],
      });
    } catch (printError) {
      console.error(printError);
    }
  };

  return (
    <>
      <button onClick={handlePrint} disabled={isPrinting}>
        {isPrinting ? 'Printing...' : 'Print'}
      </button>
      {error && <p>{error instanceof Error ? error.message : String(error)}</p>}
    </>
  );
};
```

---

## API

### `QzTrayProvider`

Provides QZ Tray context to all child hooks. Place it at the root of your app.
Use one provider per application because QZ Tray keeps a global WebSocket and callback registry.

| Prop | Type | Required | Description |
|---|---|---|---|
| `certificate` | `string \| (() => Promise<string>)` | ✓ | Public PEM certificate from QZ Tray's signing tool. Accepts a string or an async function that fetches it. |
| `signaturePromise` | `PromiseFactory` | ✓ | Factory function that signs the request. Should call your backend. |
| `signatureAlgorithm` | `"SHA1" \| "SHA256" \| "SHA512"` | | Signing algorithm. Defaults to `"SHA512"`. |
| `wsOptions` | `ConnectOptions` | | WebSocket connection options (host, port, keepAlive, retries, delay). |
| `autoConnect` | `boolean` | | Connect to QZ Tray automatically on mount. Defaults to `false`. |
| `onConnect` | `() => void` | | Called when the connection is established. |
| `onDisconnect` | `() => void` | | Called when the connection is closed. |
| `onError` | `(error: unknown) => void` | | Called on connection error. |

`connect()` rejects when the connection fails. `onError` and the provider's `error` state are also updated.

---

### `useQzTray`

Access connection state and controls. Must be used inside `QzTrayProvider`.

```tsx
const { isConnected, isConnecting, error, connect, disconnect } = useQzTray();
```

| Return | Type | Description |
|---|---|---|
| `isConnected` | `boolean` | Whether QZ Tray is currently connected. |
| `isConnecting` | `boolean` | Whether a connection attempt is in progress. |
| `error` | `unknown` | Last connection error, or `null`. |
| `connect` | `() => Promise<IQzTrayConnectionLease>` | Open the WebSocket connection and report whether this caller owns it. |
| `disconnect` | `() => Promise<void>` | Close the WebSocket connection. |

---

### `useQzPrint`

Send print jobs to any printer visible to QZ Tray. Must be used inside `QzTrayProvider`.

```tsx
const { print, isPrinting, error } = useQzPrint();
```

| Return | Type | Description |
|---|---|---|
| `print` | `(options: IPrintOptions) => Promise<void>` | Send a print job. Connects automatically if not connected and rejects on failure. |
| `isPrinting` | `boolean` | Whether a print job is in progress. |
| `error` | `unknown` | Last print error, or `null`. |

**`IPrintOptions`**

| Option | Type | Required | Description |
|---|---|---|---|
| `printer` | `string` | ✓ | Printer name as it appears in the OS. |
| `data` | `PrintData[]` | ✓ | Array of print data objects. |
| `config` | `PrinterOptions` | | Paper size, units, density, orientation, etc. |
| `autoDisconnect` | `boolean` | | Disconnect after the job completes only when this call opened the connection. Defaults to `true`. |

Only one print job can run at a time per `useQzPrint` instance. Overlapping calls reject with an error.

---

## Examples

See the [`examples/`](./examples) directory for complete usage examples:

- [`01-basic-setup.tsx`](./examples/01-basic-setup.tsx) — Provider setup with inline and async certificate
- [`02-connection.tsx`](./examples/02-connection.tsx) — Connection status UI and `autoConnect`
- [`03-print-html.tsx`](./examples/03-print-html.tsx) — Print HTML content as a pixel job
- [`04-print-pdf.tsx`](./examples/04-print-pdf.tsx) — Print PDF from URL or base64
- [`05-print-raw.tsx`](./examples/05-print-raw.tsx) — Raw ZPL and ESC/POS commands
- [`06-multiple-jobs.tsx`](./examples/06-multiple-jobs.tsx) — Chain multiple jobs without disconnecting

---

## Playground

A Vite dev app is included for local testing.

```bash
pnpm install
pnpm playground
```

Open `http://localhost:5173`, paste your certificate and signature endpoint, and send test print jobs directly from the browser.

---

## Contributing

Contributions are more than welcome! Whether it's a bug report, feature request, or a pull request — all input is appreciated.

1. Fork the repo and create your branch from `main`
2. Install dependencies with `pnpm install`
3. Make your changes and add tests where applicable
4. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before submitting
5. Open a pull request

If you're unsure about something, feel free to open an issue first to discuss it.

---

## License

MIT © [Juliusz Kowalewski](https://github.com/Imunal)
