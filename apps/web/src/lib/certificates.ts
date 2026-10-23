export type AdminCertificate = {
  id: string;
  name: string;
  issuer: string;
  /** Mes y año de emisión en formato AAAA-MM. */
  issueDate: string;
  verificationUrl: string | null;
  description: string | null;
  position: number;
  status: "draft" | "published";
  /** Cambios guardados de un registro publicado que aún no se publican. */
  pending: Pick<
    AdminCertificate,
    | "name"
    | "issuer"
    | "issueDate"
    | "verificationUrl"
    | "description"
    | "position"
  > | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicCertificate = Pick<
  AdminCertificate,
  | "id"
  | "name"
  | "issuer"
  | "issueDate"
  | "verificationUrl"
  | "description"
  | "position"
>;
