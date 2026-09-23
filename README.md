# Ghost Lead v0.1

Web app for working on night shifts when no manager or team lead is available.

A responsive deli closing-shift prototype with sample data and browser-local storage. No account, external services, employee information, or network dependencies.

## Try it on your Mac

Double-click **Start Ghost Lead.command**, or open **dist/index.html** in Safari or Chrome. No installation is required for this mode. If macOS blocks the launcher, open the HTML file directly.

For a stable local browser-storage origin, use the included server (Node.js required):

```sh
cd ghost-lead
npm start
```

Open http://127.0.0.1:4173. Stop with Control+C. No npm install is needed.

## How to try the shift

- The first visit starts at **5:45 PM in demo mode**, with all 14 tasks Not Started.
- Drag the demo clock to explore 1:30–10:00 PM. Moving time does not complete tasks.
- Use each task’s menu to select Not Started, Started, Done, Needs More Time, or Blocked.
- Use live clock to follow the device’s local time. Return to demo mode whenever you like.
- The timeline’s shaded portions represent completed task counts within each phase; the vertical line represents time.
- Work and time are separate measures. Task counts are not estimates of labor, duration, staffing, or whether the team can finish.
- Reset shift starts a fresh plan after confirmation. There is no automatic daily reset, history, or cross-device sync.
- Changes stay in browser storage on this device. Different browsers, file mode, server addresses, and ports may each have separate storage. Clearing browser data clears the shift. Storage failure is shown in the footer.

All tasks and times are illustrative prototype data, not an official workplace schedule. Task windows are visual groupings, not enforced dependencies or food-safety instructions. Use the team’s actual procedures.

## Try it on iPad

The direct-file and default server modes are Mac-local. For an iPad on the same trusted Wi-Fi, run `HOST=0.0.0.0 npm start` on the Mac, keep the Mac awake, and visit `http://<your-Mac-LAN-IP>:4173` in Safari. The Mac may ask to allow incoming connections. There is no login; stop the server when finished. Each device keeps its own independent task states.

## Structure

- `dist/core.js`: task definitions, milestones, and platform-independent calculations.
- `dist/app.js`: browser interactions and local persistence.
- `dist/styles.css`: responsive presentation.
- `dist/index.html`: accessible page structure; works without a build or CDN.
- `server.cjs`: optional dependency-free local server.
- `tests/core.test.cjs`: schedule and state boundary tests (`npm test`).

This is a browser-first starting point for a future PWA or Raspberry Pi kiosk. It does not yet install as a PWA, provide a service worker, run background alarms, or synchronize devices. The static app can be served on those platforms without changing its core logic.

## Validation

Six core tests pass. A separate headless Chrome browser check covered all five states, reload persistence, demo/live clocks, reset and cancel, Mac/iPad/phone viewport widths, 44px task controls, direct-file mode, unavailable storage, and the optional agent-tool callback with valid/invalid inputs. Browser checks are simulations, not tests on a physical iPad.

The optional browser test is in `tests/browser.cjs`; it requires Playwright and Chrome and a running local server. Run `node tests/browser.cjs` in an environment with Playwright installed, or set `PLAYWRIGHT_MODULE` to its module path. No browser-test package is needed to use the app. Agent-tool registration was tested through a simulated browser API; native WebMCP support was not available.

## GitHub Pages

Publish the `main` branch from `/(root)`. The root `index.html` loads the existing assets in `dist/`; the original direct-file and local-server structure is preserved. Keep both HTML entry files aligned when changing page content. `.nojekyll` disables unnecessary processing.

The website is public. Do not commit credentials, employee details, or confidential workplace information. Task updates remain in the current browser and do not sync between devices.
