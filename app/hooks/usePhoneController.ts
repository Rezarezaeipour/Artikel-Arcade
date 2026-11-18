'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@ably/pubsub-device';
import { createControllerClient } from '../lib/controller/realtime';
import { channelNames, controllerRequest, isControllerCommand, type ControllerSession, type ControllerStatus, type ControllerCommand, type Article } from '../lib/controller/protocol';

type GameCallbacks = {
  enabled: boolean;
  ready: boolean;
  selectedArticle: Article;
  onCommand: (command: ControllerCommand) => void;
  onPaired: () => void;
  onDisconnect: () => void;
};

export function usePhoneController(callbacks: GameCallbacks) {
  const [session, setSession] = useState<ControllerSession | null>(null);
  const [status, setStatus] = useState<ControllerStatus>('idle');
  const [error, setError] = useState('');
  const [pairUrl, setPairUrl] = useState('');
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const generation = useRef(0);
  const publishState = useRef<(() => void) | null>(null);
  useEffect(() => { publishState.current?.(); }, [callbacks.ready, callbacks.selectedArticle]);

  const disconnect = useCallback(() => {
    generation.current++;
    setSession(null);
    setPairUrl('');
    setStatus('idle');
  }, []);

  const connect = useCallback(async () => {
    const requestId = ++generation.current;
    setSession(null);
    setPairUrl('');
    setError('');
    setStatus('connecting');
    try {
      const created = await controllerRequest<ControllerSession>('session', {});
      if (requestId !== generation.current) return;
      const origin = created.controllerOrigin || window.location.origin;
      setPairUrl(`${origin}/controller#pair=${encodeURIComponent(created.pairTicket)}`);
      setSession(created);
    } catch (failure) {
      if (requestId !== generation.current) return;
      setError(failure instanceof Error ? failure.message : 'Pairing failed. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!callbacks.enabled) disconnect();
    return () => { generation.current++; };
  }, [callbacks.enabled, disconnect]);

  useEffect(() => {
    if (!session || !callbacks.enabled) return;
    const client = createControllerClient(session.hostTicket);
    const requests = client.channels.get(channelNames(session.sessionId).requests);
    let disposed = false;
    let selectedPhone: string | null = null;
    let lastSeen = Date.now();
    let lastSequence = -1;
    let lastInputAt = 0;
    let serverOffset = 0;
    let lost = false;

    function loseConnection() {
      if (disposed || !selectedPhone || lost) return;
      lost = true;
      setStatus('disconnected');
      latest.current.onDisconnect();
    }

    function receiveInput(message: Message) {
      if (disposed || message.clientId !== selectedPhone || typeof message.timestamp !== 'number') return;
      if (Math.abs(Date.now() + serverOffset - message.timestamp) > 1500) return;
      lastSeen = Date.now();
      if (lost) {
        lost = false;
        setStatus('connected');
      }
      if (message.name === 'disconnect') {
        loseConnection();
        return;
      }
      if (message.name !== 'input' || !latest.current.ready) return;
      const { sequence } = message.data ?? {};
      const command = message.data?.command ?? message.data?.direction;
      if (!isControllerCommand(command) || !Number.isSafeInteger(sequence) || sequence <= lastSequence) return;
      lastSequence = sequence;
      if (Date.now() - lastInputAt < 45) return;
      lastInputAt = Date.now();
      latest.current.onCommand(command);
    }

    async function receivePairRequest(message: Message) {
      const phone = message.clientId;
      if (disposed || message.name !== 'pair' || !phone || !/^phone-[0-9a-f-]{36}$/i.test(phone)) return;
      const reply = client.channels.get(channelNames(session!.sessionId, phone).reply);
      if (selectedPhone && selectedPhone !== phone) {
        await reply.publish('busy', {});
        return;
      }
      if (!selectedPhone) {
        selectedPhone = phone;
        try {
          await client.channels.get(channelNames(session!.sessionId, phone).input).subscribe(receiveInput);
          if (disposed) return;
          lastSeen = Date.now();
          setStatus('connected');
          latest.current.onPaired();
        } catch {
          selectedPhone = null;
          setError('The phone could not be paired. Generate a new QR code.');
          setStatus('error');
          return;
        }
      }
      await reply.publish('paired', { ready: latest.current.ready, selectedArticle: latest.current.selectedArticle });
    }

    client.connection.on('disconnected', loseConnection);
    client.connection.on('suspended', loseConnection);
    client.connection.on('failed', () => {
      if (disposed) return;
      setError('The realtime connection failed. Check the Ably key and try pairing again.');
      setStatus('error');
      latest.current.onDisconnect();
    });
    client.connect();

    async function initialize() {
      try {
        const before = Date.now();
        const serverTime = await client.time();
        serverOffset = serverTime - (before + Date.now()) / 2;
        await requests.subscribe(message => {
          void receivePairRequest(message).catch(() => loseConnection());
        });
        if (!disposed && !selectedPhone) setStatus('waiting');
      } catch {
        if (disposed) return;
        setError('The realtime service is unavailable. Check the Ably key and your connection.');
        setStatus('error');
      }
    }
    void initialize();

    function sendState() {
      if (selectedPhone && client.connection.state === 'connected') {
        void client.channels.get(channelNames(session!.sessionId, selectedPhone).reply)
          .publish('state', { ready: latest.current.ready, selectedArticle: latest.current.selectedArticle }).catch(loseConnection);
      }
    }
    publishState.current = sendState;

    const timer = window.setInterval(() => {
      if (Date.now() >= session.expiresAt) {
        loseConnection();
        setError('The controller session expired. Connect your phone again.');
        setStatus('error');
        window.clearInterval(timer);
        client.close();
        return;
      }
      if (!selectedPhone) {
        if (Date.now() > session.pairExpiresAt) {
          setError('The QR code expired. Generate a new code to connect your phone.');
          setStatus('error');
        }
        return;
      }
      if (Date.now() - lastSeen > 4000) loseConnection();
      sendState();
    }, 1000);

    return () => {
      disposed = true;
      publishState.current = null;
      window.clearInterval(timer);
      if (selectedPhone && client.connection.state === 'connected') {
        void client.channels.get(channelNames(session.sessionId, selectedPhone).reply)
          .publish('ended', {}).catch(() => {}).finally(() => client.close());
      } else {
        client.close();
      }
    };
  }, [session, callbacks.enabled]);

  return { status, error, pairUrl, connect, disconnect };
}
