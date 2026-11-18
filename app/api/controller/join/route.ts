import { controllerFailure, controllerResponse, joinSession, readControllerRequest } from '../../../lib/controller/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await readControllerRequest(request, 'join', 30);
    return controllerResponse(joinSession(body.pairTicket));
  } catch (error) {
    return controllerFailure(error);
  }
}
