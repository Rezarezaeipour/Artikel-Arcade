'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, House, Smartphone } from 'lucide-react';
import type { PubSubClient } from '@ably/pubsub-device';
import { createControllerClient } from '../lib/controller/realtime';
import { channelNames, controllerRequest, isDirection, isArticle, type ControllerStatus, type ControllerCommand, type Article, type PhoneSession } from '../lib/controller/protocol';

const buttons = [
  { direction: 'down' as const, label: 'Slow down', Icon: ArrowDown, text: '' },
  { direction: 'up' as const, label: 'Speed up', Icon: ArrowUp, text: '' },
  { direction: 'der' as const, label: 'Select Der', Icon: null, text: 'Der' },
  { direction: 'das' as const, label: 'Select Das', Icon: null, text: 'Das' },
  { direction: 'die' as const, label: 'Select Die', Icon: null, text: 'Die' },
];

export default function PhoneController() {
  const [status, setStatus] = useState<ControllerStatus>('connecting');
  const [hostReady, setHostReady] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');
  const [pressed, setPressed] = useState<ControllerCommand | null>(null);
  const send = useRef<((direction: ControllerCommand) => void) | null>(null);
  const hold = useRef<{ timer: number; pointer: number | 'keyboard'; direction: ControllerCommand } | null>(null);
  const canSend = useRef(false);
  canSend.current = status === 'connected' && hostReady;

  function stopHold(pointer?: number | 'keyboard') {
    if (pointer !== undefined && hold.current?.pointer !== pointer) return;
    if (hold.current) window.clearInterval(hold.current.timer);
    hold.current = null;
    setPressed(null);
  }

  function startHold(direction: ControllerCommand, pointer: number | 'keyboard') {
    stopHold();
    if (!canSend.current) return;
    setPressed(direction);
    send.current?.(direction);
    hold.current = {
      direction,
      pointer,
      timer: window.setInterval(() => {
        if (canSend.current) send.current?.(direction);
        else stopHold();
      }, 190),
    };
  }

  useEffect(() => {
    let disposed = false;
    let client: PubSubClient | null = null;
    let timer: number | undefined;
    let leave = () => {};

    async function initialize() {
      const pairTicket = new URLSearchParams(window.location.hash.slice(1)).get('pair');
      if (!pairTicket) throw new Error('Scan the QR code displayed inside a game to connect this controller.');
      let phone: PhoneSession | undefined;
      try {
        const saved = JSON.parse(sessionStorage.getItem('arcade-phone-controller') || 'null');
        if (saved?.pairTicket === pairTicket && saved.phone?.expiresAt > Date.now()) phone = saved.phone;
      } catch { /* Pairing also works when sessionStorage is unavailable. */ }
      phone ??= await controllerRequest<PhoneSession>('join', { pairTicket });
      if (disposed) return;
      try { sessionStorage.setItem('arcade-phone-controller', JSON.stringify({ pairTicket, phone })); } catch { /* The connection can continue in memory. */ }
      const session = phone;
      client = createControllerClient(session.ticket);
      const realtime = client;
      const channels = channelNames(session.sessionId, session.clientId);
      const reply = realtime.channels.get(channels.reply);
      const input = realtime.channels.get(channels.input);
      const requests = realtime.channels.get(channels.requests);
      let paired = false;
      let sequence = Date.now() * 100;
      let lastHostSeen = Date.now();
      let lastPairRequest = 0;

      function lost() {
        if (disposed) return;
        setStatus('disconnected');
        setHostReady(false);
        stopHold();
      }
      realtime.connection.on('disconnected', lost);
      realtime.connection.on('suspended', lost);
      realtime.connection.on('failed', () => {
        if (disposed) return;
        lost();
        setError('The realtime connection failed. Open a new QR code from the game.');
        setStatus('error');
      });
      realtime.connect();
      await reply.subscribe(message => {
        if (disposed || message.clientId !== `host-${session.sessionId}`) return;
        lastHostSeen = Date.now();
        if (message.name === 'busy' || message.name === 'ended') {
          paired = false;
          lost();
          setError(message.name === 'busy' ? 'This game is already paired with another phone. Generate a new QR code in the game.' : 'This game connection has ended. Scan a new QR code to play again.');
          setStatus('error');
          realtime.close();
          return;
        }
        if (message.name === 'paired') paired = true;
        if (paired && (message.name === 'paired' || message.name === 'state')) {
          setError('');
          setStatus('connected');
          setHostReady(message.data?.ready === true);
          if (isArticle(message.data?.selectedArticle)) setSelectedArticle(message.data.selectedArticle);
        }
      });
      if (disposed) { realtime.close(); return; }
      setStatus('waiting');
      send.current = direction => {
        if (!paired || !canSend.current || realtime.connection.state !== 'connected') return;
        void input.publish('input', { command: direction, sequence: ++sequence }).catch(lost);
      };
      leave = () => {
        stopHold();
        if (realtime.connection.state === 'connected') void input.publish('disconnect', {}).catch(() => {});
      };
      await requests.publish('pair', {});
      lastPairRequest = Date.now();
      timer = window.setInterval(() => {
        if (disposed) return;
        if (Date.now() >= session.expiresAt) {
          lost();
          setError('This controller session has expired. Scan a new QR code.');
          setStatus('error');
          if (timer) window.clearInterval(timer);
          realtime.close();
          return;
        }
        if (paired && Date.now() - lastHostSeen > 4000) lost();
        if (realtime.connection.state !== 'connected' || document.visibilityState !== 'visible') return;
        if (paired) void input.publish('heartbeat', {}).catch(lost);
        else if (Date.now() - lastPairRequest > 2000) {
          lastPairRequest = Date.now();
          void requests.publish('pair', {}).catch(lost);
        }
      }, 1000);
    }
    void initialize().catch(failure => {
      if (disposed) return;
      setError(failure instanceof Error ? failure.message : 'Pairing failed. Scan a new QR code.');
      setStatus('error');
      client?.close();
    });
    const visibility = () => { if (document.visibilityState !== 'visible') leave(); };
    const pageHide = () => leave();
    window.addEventListener('pagehide', pageHide);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      send.current = null;
      if (timer) window.clearInterval(timer);
      stopHold();
      window.removeEventListener('pagehide', pageHide);
      document.removeEventListener('visibilitychange', visibility);
      client?.close();
    };
  }, []);

  useEffect(() => {
    if (!canSend.current) stopHold();
  }, [status, hostReady]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const direction = event.key.replace('Arrow', '').toLowerCase();
      if (!event.key.startsWith('Arrow') || !isDirection(direction)) return;
      event.preventDefault();
      if (!event.repeat) startHold(direction, 'keyboard');
    };
    const keyUp = (event: KeyboardEvent) => {
      if (hold.current?.pointer === 'keyboard' && event.key.toLowerCase() === `arrow${hold.current.direction}`) stopHold('keyboard');
    };
    const blur = () => stopHold();
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const connected = status === 'connected';
  const label = connected ? hostReady ? 'Ready to play' : 'Game paused' : status === 'error' ? 'Connection unavailable' : status === 'disconnected' ? 'Reconnecting…' : 'Pairing with your game…';
  return <main className="phone-controller">
    <section className="controller-info" aria-live="polite">
      <Smartphone size={28}/>
      <h1>Your Joystick</h1>
      <p className={connected ? 'controller-state connected' : 'controller-state'}>{label}</p>
      <p>{error || (connected ? hostReady ? 'Der · Das · Die' + ' · ↑ ↓ Speed' : 'Resume the flight on your game screen.' : 'Keep the game open on your other screen.')}</p>
      <a href="/"><House size={14}/> Main page</a>
    </section>
    {buttons.map(({ direction, label: buttonLabel, Icon, text }) => <button
      key={direction}
      className={`controller-pad pad-${direction} ${pressed === direction ? 'pressed' : ''} ${selectedArticle === direction ? 'selected' : ''}`}
      aria-label={buttonLabel}
      aria-pressed={isArticle(direction) ? selectedArticle === direction : undefined}
      disabled={!connected || !hostReady}
      onPointerDown={event => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold(direction, event.pointerId);
      }}
      onPointerUp={event => stopHold(event.pointerId)}
      onPointerCancel={event => stopHold(event.pointerId)}
      onLostPointerCapture={event => stopHold(event.pointerId)}
      onClick={event => { if (event.detail === 0 && canSend.current) send.current?.(direction); }}
    >{Icon ? <Icon strokeWidth={2.5}/> : <span>{text}</span>}</button>)}
  </main>;
}
