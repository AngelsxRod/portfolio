export type ProfileLink = { label: string; url: string };

export type ProfileContent = {
  displayName: string;
  /** Título profesional opcional, p. ej. «Junior Frontend Developer». */
  headline: string | null;
  presentation: string;
  location: string | null;
  email: string | null;
  links: ProfileLink[];
};

export type AdminProfile = {
  draft: (ProfileContent & { updatedAt: string }) | null;
  published: (ProfileContent & { updatedAt: string }) | null;
  /** El borrador difiere de la versión publicada (o aún no se publicó). */
  hasUnpublishedChanges: boolean;
};

export type PublicProfile = ProfileContent;
