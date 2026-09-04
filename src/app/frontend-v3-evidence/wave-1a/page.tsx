import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wave1AShellFixture } from "@/features/creator-v3/evidence/wave-1a-shell-fixture";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Frontend V3 Wave 1A Evidence",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FrontendV3Wave1AEvidencePage() {
  if (process.env.ACS_FRONTEND_V3_EVIDENCE_MODE !== "1") {
    notFound();
  }

  return <Wave1AShellFixture />;
}
