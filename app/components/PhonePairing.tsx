'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, RefreshCw, Smartphone, X } from 'lucide-react';
import type { ControllerStatus } from '../lib/controller/protocol';

type Props = {
  status: ControllerStatus;
  error: string;
  pairUrl: string;
  onRetry: () => void;
  onClose: () => void;
};

export default function PhonePairing({ status, error, pairUrl, onRetry, onClose }: Props) {
  const [copyMessage, setCopyMessage] = useState('');
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pairUrl);
      setCopyMessage('Link copied.');
    } catch {
      setCopyMessage('Select and copy the link below.');
    }
  }
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal phone-pairing" role="dialog" aria-modal="true" aria-label="Connect phone controller" onClick={event => event.stopPropagation()}>
      <button className="close-modal icon-btn" onClick={onClose} aria-label="Close pairing"><X size={20}/></button>
      <Smartphone size={26}/>
      <h2>Connect your phone.</h2>
      <p>Scan this code with your phone camera. Your phone becomes the controller for this flight.</p>
      {pairUrl && status !== 'error' && <>
        <div className="pairing-qr"><QRCodeSVG value={pairUrl} size={240} marginSize={4} level="M"/></div>
        <p className="pairing-status" aria-live="polite">{status === 'connecting' ? 'Starting the connection…' : 'Waiting for your phone…'}</p>
        <p className="pairing-expiry">Scan within 2 minutes. A paired session lasts up to 30 minutes.</p>
        <div className="pairing-link"><input aria-label="Controller link" value={pairUrl} readOnly onFocus={event => event.target.select()}/><button className="secondary" onClick={copyLink} aria-label="Copy controller link"><Copy size={16}/></button></div>
        <p className="pairing-copy-message" aria-live="polite">{copyMessage}</p>
        <a className="pairing-open-link" href={pairUrl} target="_blank" rel="noopener noreferrer">Open controller ↗</a>
      </>}
      {status === 'connecting' && !pairUrl && <p role="status">Creating your pairing session…</p>}
      {error && <p className="pairing-error" role="alert">{error}</p>}
      <button className="secondary" onClick={onRetry}><RefreshCw size={14}/> NEW QR CODE</button>
    </section>
  </div>;
}
