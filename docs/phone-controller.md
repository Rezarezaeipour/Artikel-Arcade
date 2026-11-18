# Learn the phone controller

The desktop runs the game. The phone sends arrow commands through Ably. Next.js API routes give each device temporary permission to communicate.

Use Node.js 22 or later. The controller uses `@ably/pubsub-device` in the browser and `@ably/pubsub-server` in API routes.

## Set it up

1. Create an Ably app at https://ably.com and create an API key with publish and subscribe permissions for `arcade-controller:*`.
2. Copy `.env.example` to `.env.local` and fill in `ABLY_API_KEY`.
3. Restart with `npm run dev`.
4. Open a lesson, select Connect phone, and scan the QR code.
5. Keep the phone and computer on the same Wi-Fi for local development. The development QR uses an available local network address. If your computer has several network adapters, open the game using its Wi-Fi address before pairing.

Keep the key in the server environment. `.env.local` is ignored by Git. Production hosting also needs this environment variable and a server-enabled Next.js deployment.

## Follow a command

1. The desktop asks `/api/controller/session` for a session. The server signs a desktop ticket and a pairing ticket.
2. The QR opens `/controller` with the pairing ticket in its URL fragment. Fragments stay in the browser when the page is requested.
3. The phone exchanges the pairing ticket at `/api/controller/join` for its own identity.
4. Both devices ask `/api/controller/token` for restricted Ably permissions. The API key stays on the server.
5. The desktop accepts one phone. Each arrow publishes a command that calls the existing game controls.

The first row contains ↓, Your Joystick, ↑. The second row contains Der, Das, Die. Article buttons select the article directly. Holding a speed button repeats its command.

## Understand the state

The desktop holds the paired-phone identity in memory. Signed tickets let server instances check permissions without a session database. Phone identity is kept in sessionStorage so a page reload can reconnect. Game progress continues to use localStorage.

The QR can start pairing for two minutes. A session lasts 30 minutes. Heartbeats detect a missing controller after about four seconds and pause flight. Commands are unqueued and inputs older than 1.5 seconds are discarded. Resume the flight on the desktop after reconnecting.

This anonymous pairing flow needs no user accounts or OAuth. A person with the active pairing link can request control, so the desktop accepts the first phone and requires a new session to replace it.

## Read the code

- `app/lib/controller/protocol.ts` defines directions, session types, and channel names.
- `app/lib/controller/server.ts` signs and validates tickets and restricts channel permissions.
- `app/api/controller/` contains the three server endpoints.
- `app/hooks/usePhoneController.ts` receives commands on the desktop.
- `app/components/PhonePairing.tsx` displays the QR dialog.
- `app/components/PhoneController.tsx` renders the phone buttons and sends commands.
- `app/page.tsx` connects remote directions to the existing gameplay handlers.

Try following one press of ↑ from PhoneController through the desktop hook to `changeSpeed` in the game.

## Verify and deploy

Run `npm run test:controller`, `npx tsc --noEmit`, and `npm run build` sequentially. Stop the development server before building. Run `npm start` to preview the production server.

Deploy to hosting that runs Next.js API routes and configure `ABLY_API_KEY`. Pairing endpoints include an in-process burst guard. Configure hosting-level rate limits for a public deployment, since separate server instances have separate counters.

For a live check, pair a real phone, test all three article buttons, both speed buttons, and held buttons, close the phone page to check automatic pause, then create a new QR and pair again.

[Ably token authentication](https://ably.com/docs/auth/token) · [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying)

Implementation rules and regression checks are in the [controller contributor reference](controller-contributing.md).
