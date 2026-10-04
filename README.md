# OpenWAF Todo demo

A working Nuxt todo workspace for demonstrating OpenWAF's built-in protection. It matches the frontend's sky/zinc colors, compact rectangular controls, sidebar, and light/dark appearance. English and Polish cover the interface and seeded tasks; the language and theme preferences persist in the browser. User-created task titles are preserved as entered.

## Run

Use Node.js 22.13+ (including `node:sqlite`).

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:4000**. Add, complete, delete, filter, and search tasks. Search runs on Enter or the arrow button. An in-memory SQLite database resets on server restart; all visitors share the demonstration workspace. Configuration files and internal notes contain synthetic data only.

For a production build:

```sh
npm run build
NITRO_HOST=127.0.0.1 NITRO_PORT=4000 npm start
```

This app needs its server; static generation cannot provide the demo endpoints.

## Connect OpenWAF

Build and run OpenWAF with its CRS setup loaded before policy overrides and CRS rules. This initialization is implemented in OpenWAF's `internal/rules/engine.go`; no changes to the WAF are required in this demo repository.

In OpenWAF's Services page, create an enabled service:

| Field | Value |
| --- | --- |
| Name | Todo demo |
| Hostname | `localhost` |
| Upstream URL | `http://127.0.0.1:4000` |

Use **blocking** mode, blocking paranoia level **1**, detection paranoia level **2**, inbound threshold **5**, and keep the relevant built-in rules enabled. These are the inspected defaults. Open **http://localhost:8080** through OpenWAF's proxy (or use your configured proxy address). If OpenWAF runs in a container, the upstream must be reachable from that container; localhost refers to the container itself.

The lab sends relative requests to the origin used to open the app. It does not simulate a WAF or switch protection locally. Open the direct and protected origins in separate tabs. Language selection and normal task actions also use that origin.

## Demonstration

1. Open the direct origin and go to **Security lab**.
2. Send each preset request and observe HTTP 200 and the response. The SQL sample reveals an internal fixture; the XSS sample changes the live preview with JavaScript.
3. Open the protected origin and repeat. With CRS initialized, all four presets return HTTP 403.
4. Open OpenWAF's request logs to inspect matches. Switch to detection mode to show attacks being logged while reaching the origin.

| Intentional issue | Endpoint | Built-in mitigation |
| --- | --- | --- |
| SQL injection into a real SQLite search query | `/api/todos?q=…` | CRS SQL injection family `942`, including `942100`, `942190`; anomaly blocking `949110` |
| Reflected XSS in raw note HTML | `/api/preview?text=…` | CRS XSS family `941`, including `941100`, `941110`, `941160`; anomaly blocking `949110` |
| Synthetic environment file exposure | `/demo/.env` | OpenWAF rule `1001001` |
| Synthetic Git config exposure | `/demo/.git/config` | OpenWAF rule `1001003` |

Task creation, completion, and deletion use POST requests, compatible with CRS’s default allowed-method policy. Task writes use prepared SQL statements, and task titles render as text. XSS is confined to the intentional preview endpoint. The app displays its preview in an iframe with `sandbox="allow-scripts"` and without `allow-same-origin`, allowing the demonstration script to execute without access to the parent workspace. The endpoint itself intentionally returns executable HTML. Exposure routes serve exact fixture strings rather than reading filesystem paths.

These preset attacks were verified against the installed Coraza/CRS versions and default policy after loading CRS setup. WAF signatures mitigate the demonstrated requests; they do not establish that every possible SQL injection or XSS bypass is prevented. The workspace deliberately has no accounts or ownership controls, and does not present authentication or authorization flaws as WAF demonstrations. Run it as a disposable local demo.
