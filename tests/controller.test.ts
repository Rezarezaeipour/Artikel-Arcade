import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession, createRealtimeToken, joinSession, readTicket, signTicket, readControllerRequest } from '../app/lib/controller/server';
import { isControllerCommand, isDirection } from '../app/lib/controller/protocol';

process.env.ABLY_API_KEY = 'test.key:local-test-secret';

test('pairing creates separate host and phone identities in one session', () => {
  const session = createSession();
  const first = joinSession(session.pairTicket);
  const second = joinSession(session.pairTicket);
  assert.equal(first.sessionId, session.sessionId);
  assert.notEqual(first.clientId, second.clientId);
  assert.equal(readTicket(session.hostTicket, ['host']).role, 'host');
  assert.equal(readTicket(first.ticket, ['phone']).clientId, first.clientId);
  assert.throws(() => joinSession(session.hostTicket));
  assert.throws(() => readTicket(first.ticket, ['host']));
});

test('tampered and expired permissions are rejected', () => {
  const session = createSession();
  assert.throws(() => readTicket(`${session.hostTicket}x`, ['host']));
  const host = readTicket(session.hostTicket, ['host']);
  assert.throws(() => readTicket(signTicket({ ...host, expiresAt: Date.now() - 1 }), ['host']));
  assert.throws(() => readTicket('invalid', ['host']));
});

test('controller requests reject foreign origins and invalid bodies', async () => {
  const request = (body: string, origin = 'https://game.example') => new Request('https://game.example/api/controller/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body,
  });
  await assert.rejects(readControllerRequest(request('{}', 'https://other.example'), 'test', 10));
  await assert.rejects(readControllerRequest(request('[]'), 'test', 10));
  await assert.rejects(readControllerRequest(request('x'.repeat(3001)), 'test', 10));
  assert.deepEqual(await readControllerRequest(request('{}'), 'test', 10), {});
});

test('only four supported directions are accepted', () => {
  for (const direction of ['up', 'right', 'down', 'left']) assert.ok(isDirection(direction));
  for (const value of ['pause', '', null, 1]) assert.equal(isDirection(value), false);
});

test('phone tokens grant only their own input and reply channels', async () => {
  const session = createSession();
  const phone = joinSession(session.pairTicket);
  const token = await createRealtimeToken(phone.ticket);
  const capabilities = JSON.parse(token.capability!);
  assert.deepEqual(capabilities[`arcade-controller:${session.sessionId}:input:${phone.clientId}`], ['publish']);
  assert.deepEqual(capabilities[`arcade-controller:${session.sessionId}:reply:${phone.clientId}`], ['subscribe']);
  assert.equal(Object.keys(capabilities).length, 3);
  assert.equal(token.clientId, phone.clientId);
  await assert.rejects(createRealtimeToken(session.pairTicket));
});

test('same-origin requests work when Next.js uses an internal bind address', async () => {
  const request = (origin: string) => new Request('http://0.0.0.0:3000/api/controller/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'localhost:3000', origin },
    body: '{}',
  });
  assert.deepEqual(await readControllerRequest(request('http://localhost:3000'), 'origin-test', 10), {});
  await assert.rejects(readControllerRequest(request('http://other.example:3000'), 'origin-test', 10));
});

test('direct article commands and legacy directions validate', () => {
  for (const command of ['der', 'das', 'die', 'up', 'down', 'left', 'right']) assert.ok(isControllerCommand(command));
  for (const command of ['Der', 'pause', 0, null, {}]) assert.equal(isControllerCommand(command), false);
});
