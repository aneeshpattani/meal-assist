import { Suspense } from "react";
import { AppChromeSkeleton } from "@/components/AppChromeSkeleton";
import { PreviewClient } from "./preview-client";

export default function PreviewPage() {
  return (
    <Suspense fallback={<AppChromeSkeleton />}>
      <PreviewClient />
    </Suspense>
  );
}
