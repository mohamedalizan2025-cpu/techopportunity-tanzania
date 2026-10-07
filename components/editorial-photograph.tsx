import Image from "next/image";

// Documentary context only. Rights, original URLs and retirement inventory:
// docs/VISUAL_ASSET_PROVENANCE.md. Never use these as opportunity evidence.
const PHOTOGRAPHS = {
  hall: {
    src: "/images/editorial/udsm-nkrumah-hall-2008.webp",
    width: 1400,
    height: 933,
    alt: "A wide view of Nkrumah Hall, with rows of wooden desks and people gathering inside.",
    caption: "Nkrumah Hall, University of Dar es Salaam · 2008.",
    credit: "Nick Fraser",
    source: "https://commons.wikimedia.org/wiki/File:Nkrumah_Hall,_University_of_Dar_es_Salaam.jpg",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  campus: {
    src: "/images/editorial/udsm-nkrumah-exterior.webp",
    width: 1200,
    height: 900,
    alt: "The curved concrete roof and landscaped steps of Nkrumah Hall at the University of Dar es Salaam.",
    caption: "Nkrumah Hall, University of Dar es Salaam · archival photograph.",
    credit: "Alexander Landfair",
    source: "https://commons.wikimedia.org/wiki/File:Nkrumah.JPG",
    license: "Public domain",
    licenseUrl: "https://commons.wikimedia.org/wiki/File:Nkrumah.JPG#Licensing",
  },
} as const;

export function EditorialPhotograph({
  photo,
  onDark = false,
  eager = false,
}: {
  photo: keyof typeof PHOTOGRAPHS;
  onDark?: boolean;
  eager?: boolean;
}) {
  const image = PHOTOGRAPHS[photo];
  return (
    <figure className="min-w-0">
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes="(max-width: 1023px) 100vw, 560px"
        loading={eager ? "eager" : "lazy"}
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
      <figcaption className={`mt-3 text-xs leading-5 ${onDark ? "hero-muted" : "text-[var(--muted)]"}`}>
        <span className="block">{image.caption} Campus context; no affiliation implied.</span>
        <a href={image.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{image.credit}</a>
        {" · "}
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{image.license}</a>
        {" · Resized, WebP; display crop."}
      </figcaption>
    </figure>
  );
}
