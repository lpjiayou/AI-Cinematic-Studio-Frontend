import { redirect } from "next/navigation";

export default async function LegacyStoryRedirect({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  redirect(`/creator/projects/${encodeURIComponent(projectRef)}/story`);
}
