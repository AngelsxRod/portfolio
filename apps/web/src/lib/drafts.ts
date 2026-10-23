export type DraftProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  demoUrl: string | null;
  codeUrl: string | null;
  technologies: string[];
  position: number;
  status: "draft";
  createdAt: string;
  updatedAt: string;
};

export type PublishedProject = Omit<
  DraftProject,
  "status" | "summary" | "description"
> & {
  status: "published";
  summary: string;
  description: string;
};
