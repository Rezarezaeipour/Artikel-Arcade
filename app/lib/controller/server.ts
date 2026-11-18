import { networkInterfaces } from 'node:os';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createHttpClient } from '@ably/pubsub-server';
import { channelNames } from './protocol';

const SESSION_DURATION = 30 * 60 * 1000;
const PAIR_DURATION = 2 * 60 * 1000;
const TOKEN_DURATION = 5 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

type Role = 'host' | 'pair' | 'phone';
interface Ticket {
  role: Role;
  room: string;
  clientId: string;
  expiresAt: number;
  sessionExpiresAt: number;
}

export class ControllerError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    throw new ControllerError('Phone control needs setup. Add ABLY_API_KEY to the server environment, then restart the app.', 503);
  }
  return key;
}

// This signature lets any server instance validate a session without a database.
function signature(payload: string) {
  const secret = createHmac('sha256', apiKey()).update('artikel-arcade-controller-v1').digest();
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signTicket(ticket: Ticket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function readTicket(value: unknown, roles: Role[]): Ticket {
  if (typeof value !== 'string' || value.length > 2000) throw new ControllerError('Invalid pairing link.', 401);
  const [payload, mac, extra] = value.split('.');
  if (!payload || !mac || extra) throw new ControllerError('Invalid pairing link.', 401);
  const expected = Buffer.from(signature(payload));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new ControllerError('Invalid pairing link.', 401);
  }
  let ticket: Ticket;
  try {
    ticket = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    throw new ControllerError('Invalid pairing link.', 401);
  }
  if (!ticket || typeof ticket !== 'object' || !roles.includes(ticket.role) || !UUID_PATTERN.test(ticket.room) || typeof ticket.clientId !== 'string'
      || !Number.isFinite(ticket.expiresAt) || !Number.isFinite(ticket.sessionExpiresAt)
      || ticket.expiresAt > ticket.sessionExpiresAt) {
    throw new ControllerError('Invalid session permissions.', 401);
  }
  if (ticket.expiresAt <= Date.now()) throw new ControllerError('This controller session has expired. Scan a new QR code.', 410);
  return ticket;
}

export function createSession() {
  apiKey();
  const room = randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;
  const pairExpiresAt = Date.now() + PAIR_DURATION;
  const host = { role: 'host' as const, room, clientId: `host-${room}`, expiresAt, sessionExpiresAt: expiresAt };
  const pair = { ...host, role: 'pair' as const, clientId: '', expiresAt: pairExpiresAt };
  return { sessionId: room, hostTicket: signTicket(host), pairTicket: signTicket(pair), expiresAt, pairExpiresAt };
}

export function joinSession(pairTicket: unknown) {
  const pair = readTicket(pairTicket, ['pair']);
  const clientId = `phone-${randomUUID()}`;
  const ticket = { ...pair, role: 'phone' as const, clientId, expiresAt: pair.sessionExpiresAt };
  return { sessionId: pair.room, clientId, ticket: signTicket(ticket), expiresAt: ticket.expiresAt };
}

export async function createRealtimeToken(value: unknown) {
  const ticket = readTicket(value, ['host', 'phone']);
  const channels = channelNames(ticket.room, ticket.clientId);
  const capability: Record<string, string[]> = ticket.role === 'host'
    ? {
      [channels.requests]: ['subscribe'],
      [channelNames(ticket.room, '*').reply]: ['publish'],
      [channelNames(ticket.room, '*').input]: ['subscribe'],
    }
    : {
      [channels.requests]: ['publish'],
      [channels.reply]: ['subscribe'],
      [channels.input]: ['publish'],
    };
  const ably = createHttpClient({ key: apiKey() });
  return ably.auth.createTokenRequest({
    clientId: ticket.clientId,
    ttl: Math.min(TOKEN_DURATION, ticket.expiresAt - Date.now()),
    capability: JSON.stringify(capability),
  });
}

// A local burst guard. Configure hosting-level rate limits for a public deployment.
const globalState = globalThis as typeof globalThis & { controllerLimits?: Map<string, { count: number; until: number }> };
const limits = globalState.controllerLimits ??= new Map();

export async function readControllerRequest(request: Request, action: string, limit: number) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  // Next.js can use its bind address in request.url. Host identifies the public request address.
  const host = request.headers.get('host') || requestUrl.host;
  const expectedOrigin = `${requestUrl.protocol}//${host}`;
  if (origin && origin !== expectedOrigin) throw new ControllerError('Use the controller from the game website.', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ControllerError('A JSON request is required.', 415);
  const address = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const now = Date.now();
  for (const [key, entry] of limits) if (entry.until <= now) limits.delete(key);
  const key = `${action}:${address}`;
  const entry = limits.get(key) ?? { count: 0, until: now + 60_000 };
  if (entry.count >= limit || limits.size > 5000) throw new ControllerError('Too many requests. Please wait a minute.', 429);
  entry.count++;
  limits.set(key, entry);
  const text = await request.text();
  if (text.length > 3000) throw new ControllerError('The request is too large.', 413);
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ControllerError('The request must contain a JSON object.');
  }
}

export function controllerResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export function controllerFailure(error: unknown) {
  if (error instanceof ControllerError) return controllerResponse({ error: error.message }, error.status);
  return controllerResponse({ error: 'The realtime service could not be started. Check the server configuration.' }, 503);
}

export function controllerOrigin(request: Request) {
  const url = new URL(request.url);
  if (process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname)) {
    const address = Object.values(networkInterfaces()).flat().find(item => item?.family === 'IPv4' && !item.internal);
    if (address) url.hostname = address.address;
  }
  return url.origin;
}
