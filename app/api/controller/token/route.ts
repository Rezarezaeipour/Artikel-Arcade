import { controllerFailure, controllerResponse, createRealtimeToken, readControllerRequest } from '../../../lib/controller/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readControllerRequest(request, 'token', 90);
    return controllerResponse(await createRealtimeToken(body.ticket));
  } catch (error) {
    return controllerFailure(error);
  }
}
