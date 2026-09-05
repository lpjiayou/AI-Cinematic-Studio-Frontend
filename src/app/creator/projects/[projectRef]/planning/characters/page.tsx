import { redirect } from "next/navigation";

export default async function LegacyCharactersRedirect({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  redirect(`/creator/projects/${encodeURIComponent(projectRef)}/characters`);
}
