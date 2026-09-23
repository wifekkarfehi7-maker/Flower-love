import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoverPrototypeStage } from "@/components/invitation/cover-prototypes/stage";
import { PROTOTYPE_LAYOUTS, type PrototypeLayout } from "@/components/invitation/cover-prototypes/model";

/*
 * P2 art-direction prototypes. Off unless the server is started with
 * ENABLE_P2_PROTOTYPES=1, so a deployment never serves them; they exist to be
 * rendered and reviewed, not visited.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "P2 prototype",
  robots: { index: false, follow: false },
};

export default function CoverPrototypePage({
  params,
  searchParams,
}: {
  params: { layout: string };
  searchParams: { sealed?: string; photo?: string; music?: string };
}) {
  if (process.env.ENABLE_P2_PROTOTYPES !== "1") notFound();
  if (!(PROTOTYPE_LAYOUTS as readonly string[]).includes(params.layout)) notFound();

  return (
    <CoverPrototypeStage
      layout={params.layout as PrototypeLayout}
      startOpen={searchParams.sealed !== "1"}
      withPhoto={searchParams.photo !== "0"}
      // Same-origin paths only: this exists to test the music path, not to play arbitrary URLs.
      musicUrl={searchParams.music?.startsWith("/") && !searchParams.music.startsWith("//") ? searchParams.music : null}
    />
  );
}
