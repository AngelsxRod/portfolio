import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/os/project-thumb.css";
import { mediaUrl } from "@/lib/os/projects";

export type ThumbProject = {
  slug: string;
  title: string;
  projectType: string | null;
  preview: { id: string; altText: string } | null;
};

/** Captura de un proyecto o, sin imágenes, su inicial en grande. */
export function ProjectVisual({
  project,
  sizes,
  alt,
}: {
  project: Pick<ThumbProject, "title" | "preview">;
  sizes: string;
  alt: string;
}) {
  return project.preview ? (
    <Image
      src={mediaUrl(project.preview.id)}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className="object-cover object-top"
    />
  ) : (
    <span className="os-display os-card-typo" aria-hidden="true">
      {project.title.slice(0, 1)}
    </span>
  );
}

/** Tarjeta que abre el detalle de un proyecto: captura, título y tipo. */
export function ProjectThumb({
  project,
  sizes = "(max-width: 820px) 100vw, 220px",
  style,
  onHighlight,
}: {
  project: ThumbProject;
  sizes?: string;
  style?: CSSProperties;
  /** Se llama al pasar el cursor o enfocar la tarjeta. */
  onHighlight?: () => void;
}) {
  return (
    <Link
      className="os-card"
      href={`/projects/${project.slug}`}
      onMouseEnter={onHighlight}
      onFocus={onHighlight}
      style={style}
    >
      <span className="os-card-visual">
        <ProjectVisual project={project} alt="" sizes={sizes} />
      </span>
      <span className="os-display os-card-title">{project.title}</span>
      {project.projectType && (
        <span className="os-card-meta">{project.projectType}</span>
      )}
    </Link>
  );
}
