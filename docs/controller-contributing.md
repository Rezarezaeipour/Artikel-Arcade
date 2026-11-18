# Controller reference for contributors and coding agents

Read this document before changing QR pairing, phone controls, realtime permissions, or controller deployment. Read the root AGENTS.md and CONTRIBUTING.md first. Setup instructions and a learning walkthrough are in [phone-controller.md](phone-controller.md).

## Runtime and architecture

Use Node.js 22 or later. The application needs a server-enabled Next.js deployment for its three pairing routes. The browser uses `@ably/pubsub-device`. API routes use `@ably/pubsub-server`. Ably accounts using MAU pricing require these newer packages. The older `ably` SDK produced error 40168 and repeated connection retries during integration.

Game state and scoring live on the desktop. Ably transports commands and connection status. The server signs temporary tickets and issues restricted Ably token requests. A session database and user accounts are unnecessary for this implementation. Game progress stays in localStorage. Phone identity stays in sessionStorage for reloads.

## Launch prompt

Starting a lesson, demo, or replay on desktop opens JoystickPrompt and pauses flight. Phone-sized screens skip the prompt and start directly. Detection checks a viewport width up to 767px, or a coarse pointer with a viewport height up to 500px for landscape phones. Players can connect a phone or use keyboard controls. Successful pairing starts flight. Escape continues with keyboard controls. Reset Flight restarts immediately. An already-connected phone can continue into the next flight or be replaced.

The pixel-art onboarding asset lives at `public/phone-joystick.png`. It was created with the built-in image generator using the prompt “1980s pixel-art arcade screen, phone scanning its QR, and phone joystick with ↓ / Your Joystick / ↑ above Der / Das / Die, dark navy, blue, and yellow.” Its QR is illustrative. PhonePairing renders the functional session QR.

## Control contract

The joystick fills the screen with three columns and two rows.

- First row contains ↓, Your Joystick, ↑.
- Second row contains Der, Das, Die.
- Article buttons select that exact article from any current selection. The host broadcasts selectedArticle in paired/state messages. Highlight only the confirmed article in yellow and expose aria-pressed. Publish state when the article or readiness changes and in heartbeats so keyboard changes and reconnects stay synchronized.
- Speed buttons change speed in 0.25× steps, bounded by 0.5× and 3×. Holding a button repeats input.
- Keyboard arrows retain relative article selection and speed controls.
- Pause, menus, pairing dialogs, and completion disable remote gameplay input.

`protocol.ts` defines `ControllerCommand` and `isControllerCommand`. New messages use `{ command, sequence }`. The desktop also accepts the previous `{ direction, sequence }` shape so an already-open controller can continue working. Validate commands before dispatch. Send article selection through the same desktop lane state used by keyboard gameplay.

## Pairing and permissions

`POST /api/controller/session` creates a 30-minute host session and a two-minute pairing ticket. The QR contains the pairing ticket in a URL fragment. `POST /api/controller/join` exchanges it for a distinct phone identity. `POST /api/controller/token` signs short-lived Ably permissions for the host or phone.

Channel names begin with `arcade-controller:<sessionId>`. The requests channel carries pairing attempts. Each phone has its own reply and input channels. The desktop accepts one phone identity per session. A second phone receives a busy response. A new QR session replaces the connection.

Preserve role validation, signatures, expirations, client identity checks, exact channel permissions, and sequence validation. The host discards commands older than 1.5 seconds and throttles rapid inputs. Message queues are disabled. Heartbeats detect loss after about four seconds and pause gameplay. Reconnection leaves the flight paused until the user resumes.

Keep `ABLY_API_KEY` server-side and out of logs, screenshots, commits, and client bundles. Its Ably capabilities are Publish and Subscribe for `arcade-controller:*`. Local request burst limits apply per process. Public hosting can enforce rate limits across instances.

## Relevant files

- `app/components/PhoneController.tsx` owns phone UI, held buttons, heartbeat publishing, and reconnect state.
- `app/components/PhonePairing.tsx` owns the QR dialog.
- `app/hooks/usePhoneController.ts` owns desktop pairing and input validation.
- `app/lib/controller/protocol.ts` defines shared commands and channel names.
- `app/lib/controller/realtime.ts` creates the device SDK client with token authentication.
- `app/lib/controller/server.ts` owns tickets, capabilities, request validation, and development LAN addressing.
- `app/api/controller/` contains the server endpoints.
- `app/page.tsx` dispatches validated commands to the game.
- `app/globals.css` contains the full-screen controller grid.
- `tests/controller.test.ts` covers ticket roles, expiry, tampering, permissions, request origins, and command validation.

## Known integration details

Next.js may put an internal bind address in `request.url`. Same-origin validation therefore compares the browser Origin with the request Host and protocol. Keep the foreign-origin rejection regression test when changing this logic. Production proxies must preserve the public host and scheme.

A localhost QR uses an external IPv4 address in development. Multiple adapters or VPNs can select an unsuitable interface. Opening the game using its Wi-Fi address before pairing makes the intended address explicit.

## Verification

Run `npm run test:controller`, `npx tsc --noEmit`, and `npm run build` sequentially. Stop the development server before building because both use `.next`. An isolated temporary build copy can verify production output while someone uses the development server.

Pair through the game entry point with a real Ably key. Verify all three articles from every starting selection, both speed buttons and bounds, held input, pause/resume, backgrounding the phone, reconnecting, phone reload, desktop navigation, session replacement, and a second phone. Check portrait and landscape viewports. Report which checks used a real phone and which used a second browser.
