'use client';
import { useEffect, useRef } from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';

type Props = {
  connected: boolean;
  onConnect: () => void;
  onContinue: () => void;
};

export default function JoystickPrompt({ connected, onConnect, onContinue }: Props) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="modal-backdrop">
    <section ref={dialog} className="modal joystick-prompt" role="dialog" aria-modal="true" aria-labelledby="joystick-prompt-title" aria-describedby="joystick-prompt-description" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <h2 id="joystick-prompt-title">Your phone. Your joystick.</h2>
      <img className="joystick-illustration" src="/phone-joystick.png" alt="Scan the QR code on the game screen with your phone, then use its Der, Das, Die and speed buttons as a joystick." width={1536} height={1024}/>
      <p id="joystick-prompt-description">{connected ? 'Your phone is connected. Ready for another flight?' : 'Scan a QR code to turn your phone into a controller. Tap Der, Das, or Die and use ↑ ↓ to change speed.'}</p>
      <div className="joystick-prompt-actions">
        <button className="primary" onClick={connected ? onContinue : onConnect}><Smartphone size={18}/>{connected ? 'PLAY WITH JOYSTICK' : 'CONNECT MY PHONE'}</button>
        <button className="secondary" onClick={connected ? onConnect : onContinue}>{connected ? 'CONNECT ANOTHER PHONE' : 'PLAY WITH KEYBOARD'}<ArrowRight size={16}/></button>
      </div>
    </section>
  </div>;
}
