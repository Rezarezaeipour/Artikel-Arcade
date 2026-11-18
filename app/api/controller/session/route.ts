import { controllerFailure, controllerOrigin, controllerResponse, createSession, readControllerRequest } from '../../../lib/controller/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await readControllerRequest(request, 'session', 10);
    return controllerResponse({ ...createSession(), controllerOrigin: controllerOrigin(request) });
  } catch (error) {
    return controllerFailure(error);
  }
}
