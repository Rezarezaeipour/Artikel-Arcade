import type { Metadata } from 'next';
import PhoneController from '../components/PhoneController';

export const metadata: Metadata = {
  title: 'Phone Controller — Artikel Arcade',
  description: 'Use your phone as an arcade controller for Artikel Arcade.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function ControllerPage() {
  return <PhoneController/>;
}
