import { redirect } from "next/navigation";

export default async function LegacyScriptRedirect({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  redirect(`/creator/projects/${encodeURIComponent(projectRef)}/script`);
}
