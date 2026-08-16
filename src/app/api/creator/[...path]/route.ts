import { handleCreatorExperienceRequest } from "@/features/core-integration/experience-adapter";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handler(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return handleCreatorExperienceRequest(request, path);
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
