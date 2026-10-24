export type DraftProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  demoUrl: string | null;
  codeUrl: string | null;
  projectType: string | null;
  projectYear: string | null;
  projectRole: string | null;
  technologies: string[];
  position: number;
  status: "draft";
  pending: null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectImage = {
  id: string;
  projectId: string;
  mimeType: string;
  altText: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublishedProject = Omit<
  DraftProject,
  "status" | "summary" | "description" | "pending"
> & {
  status: "published";
  pending: Pick<
    DraftProject,
    | "title"
    | "slug"
    | "summary"
    | "description"
    | "demoUrl"
    | "codeUrl"
    | "projectType"
    | "projectYear"
    | "projectRole"
    | "technologies"
    | "position"
  > | null;
  summary: string;
  description: string;
  media: ProjectImage[];
  featuredMediaId: string | null;
};
