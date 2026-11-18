import { createClient, type TokenRequest } from '@ably/pubsub-device';
import { controllerRequest } from './protocol';

export function createControllerClient(ticket: string) {
  return createClient({
    autoConnect: false,
    queueMessages: false,
    authCallback: (_params, callback) => {
      controllerRequest<TokenRequest>('token', { ticket }).then(
        token => callback(null, token),
        error => callback(error instanceof Error ? error.message : 'Controller authentication failed.', null),
      );
    },
  });
}
