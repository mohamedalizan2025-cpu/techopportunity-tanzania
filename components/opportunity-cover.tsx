import Image from "next/image";
import { coverAssetFor } from "@/lib/cover-registry";
import type { Opportunity } from "@/lib/types";

export function OpportunityCover({
  opportunity,
  className,
}: {
  opportunity: Pick<Opportunity, "category" | "slug"> & Partial<Opportunity>;
  className?: string;
}) {
  const asset = coverAssetFor(opportunity);
  return (
    <Image
      src={asset}
      alt=""
      aria-hidden="true"
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 600px"
      className={`object-cover transition duration-500 group-hover:scale-[1.025] ${className ?? ""}`}
    />
  );
}
