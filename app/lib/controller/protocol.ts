export const DIRECTIONS = ['up', 'right', 'down', 'left'] as const;
export type Direction = typeof DIRECTIONS[number];
export const ARTICLES = ['der', 'das', 'die'] as const;
export type Article = typeof ARTICLES[number];
export type ControllerCommand = Direction | Article;

export function isArticle(value: unknown): value is Article {
  return ARTICLES.some(article => article === value);
}

export function isControllerCommand(value: unknown): value is ControllerCommand {
  return isDirection(value) || isArticle(value);
}
export type ControllerStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'error';

export interface ControllerSession {
  sessionId: string;
  hostTicket: string;
  pairTicket: string;
  expiresAt: number;
  pairExpiresAt: number;
  controllerOrigin?: string;
}

export interface PhoneSession {
  sessionId: string;
  clientId: string;
  ticket: string;
  expiresAt: number;
}

export function channelNames(sessionId: string, clientId = '') {
  const prefix = `arcade-controller:${sessionId}`;
  return {
    requests: `${prefix}:requests`,
    reply: `${prefix}:reply:${clientId}`,
    input: `${prefix}:input:${clientId}`,
  };
}

export function isDirection(value: unknown): value is Direction {
  return typeof value === 'string' && DIRECTIONS.includes(value as Direction);
}

export async function controllerRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/controller/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The controller could not connect. Please try again.');
  return data as T;
}
