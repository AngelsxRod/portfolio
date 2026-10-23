import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  getAdminCertificates,
  getAdminEducationList,
  getAdminExperiences,
  getAdminProfile,
  getAdminSkills,
  getDrafts,
  getPublishedProjects,
} from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";

type Entry = {
  id: string;
  label: string;
  status: "draft" | "published";
  updatedAt: string;
  href: string;
};

type Summary = {
  key: string;
  title: string;
  singular: string;
  feminine: boolean;
  manage: string;
  create: string;
  empty: string;
  entries: Entry[] | null;
};

/** Una lectura fallida no debe ocultar el resto del resumen; las redirecciones sí se propagan. */
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      String(error.digest).startsWith("NEXT_REDIRECT")
    )
      throw error;
    return null;
  }
}

function count(entries: Entry[], status: Entry["status"]) {
  return entries.filter((entry) => entry.status === status).length;
}

export default async function AdminHome() {
  const [
    drafts,
    published,
    skills,
    experience,
    education,
    certificates,
    profile,
  ] = await Promise.all([
    settle(getDrafts()),
    settle(getPublishedProjects()),
    settle(getAdminSkills()),
    settle(getAdminExperiences()),
    settle(getAdminEducationList()),
    settle(getAdminCertificates()),
    settle(getAdminProfile()),
  ]);

  const projects =
    drafts && published
      ? [
          ...drafts.map((item) => ({
            id: item.id,
            label: item.title,
            status: item.status,
            updatedAt: item.updatedAt,
            href: `/admin/projects/${item.id}/edit`,
          })),
          ...published.map((item) => ({
            id: item.id,
            label: item.title,
            status: item.status,
            updatedAt: item.updatedAt,
            href: `/admin/projects/${item.id}/edit`,
          })),
        ]
      : null;

  const summaries: Summary[] = [
    {
      key: "projects",
      title: "Proyectos",
      singular: "Proyecto",
      feminine: false,
      manage: "/admin/projects",
      create: "/admin/projects/new",
      empty: "Todavía no hay proyectos.",
      entries: projects,
    },
    {
      key: "skills",
      title: "Habilidades",
      singular: "Habilidad",
      feminine: true,
      manage: "/admin/skills",
      create: "/admin/skills/new",
      empty: "Todavía no hay habilidades.",
      entries:
        skills?.map((item) => ({
          id: item.id,
          label: item.name,
          status: item.status,
          updatedAt: item.updatedAt,
          href: `/admin/skills/${item.id}/edit`,
        })) ?? null,
    },
    {
      key: "experience",
      title: "Experiencia",
      singular: "Experiencia",
      feminine: true,
      manage: "/admin/experience",
      create: "/admin/experience/new",
      empty: "Todavía no hay experiencia.",
      entries:
        experience?.map((item) => ({
          id: item.id,
          label: `${item.title} · ${item.organization}`,
          status: item.status,
          updatedAt: item.updatedAt,
          href: `/admin/experience/${item.id}/edit`,
        })) ?? null,
    },
    {
      key: "education",
      title: "Educación",
      singular: "Educación",
      feminine: true,
      manage: "/admin/education",
      create: "/admin/education/new",
      empty: "Todavía no hay educación.",
      entries:
        education?.map((item) => ({
          id: item.id,
          label: `${item.program} · ${item.institution}`,
          status: item.status,
          updatedAt: item.updatedAt,
          href: `/admin/education/${item.id}/edit`,
        })) ?? null,
    },
    {
      key: "certificates",
      title: "Certificados",
      singular: "Certificado",
      feminine: false,
      manage: "/admin/certificates",
      create: "/admin/certificates/new",
      empty: "Todavía no hay certificados.",
      entries:
        certificates?.map((item) => ({
          id: item.id,
          label: `${item.name} · ${item.issuer}`,
          status: item.status,
          updatedAt: item.updatedAt,
          href: `/admin/certificates/${item.id}/edit`,
        })) ?? null,
    },
  ];

  const recent = summaries
    .flatMap((summary) =>
      (summary.entries ?? []).map((entry) => ({
        ...entry,
        kind: summary.singular,
        feminine: summary.feminine,
      })),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
        <p className="max-w-2xl text-muted-foreground">
          Resumen del contenido del portafolio y los últimos cambios.
        </p>
      </div>

      <section aria-labelledby="resumen-titulo" className="space-y-4">
        <h2 id="resumen-titulo" className="sr-only">
          Resumen por sección
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => (
            <Card key={summary.key}>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {summary.title}
                </CardTitle>
                {summary.entries && summary.entries.length === 0 && (
                  <CardDescription>{summary.empty}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {summary.entries === null ? (
                  <Alert variant="destructive">
                    <AlertTitle>No se pudo leer</AlertTitle>
                    <AlertDescription>
                      Recarga la página para intentarlo de nuevo.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <dl className="flex gap-8">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {summary.feminine ? "Publicadas" : "Publicados"}
                      </dt>
                      <dd className="text-3xl font-bold tabular-nums">
                        {count(summary.entries, "published")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Borradores
                      </dt>
                      <dd className="text-3xl font-bold tabular-nums">
                        {count(summary.entries, "draft")}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href={summary.create} />}
                >
                  {summary.feminine ? "Nueva" : "Nuevo"}
                  <span className="sr-only">
                    {" "}
                    {summary.singular.toLowerCase()}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={summary.manage} />}
                >
                  Gestionar
                  <span className="sr-only">
                    {" "}
                    {summary.title.toLowerCase()}
                  </span>
                </Button>
              </CardFooter>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Perfil</CardTitle>
              {profile && !profile.draft && !profile.published && (
                <CardDescription>
                  Todavía no hay un perfil. Crea el borrador para empezar.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {profile === null ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo leer</AlertTitle>
                  <AlertDescription>
                    Recarga la página para intentarlo de nuevo.
                  </AlertDescription>
                </Alert>
              ) : profile.draft || profile.published ? (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={profile.published ? "published" : "draft"}
                  />
                  {profile.hasUnpublishedChanges && (
                    <span className="text-sm text-muted-foreground">
                      Hay cambios sin publicar.
                    </span>
                  )}
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/profile" />}
              >
                Editar perfil
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section aria-labelledby="cambios-titulo" className="space-y-4">
        <h2 id="cambios-titulo" className="text-xl font-bold tracking-tight">
          Últimos cambios
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Cuando crees o edites contenido, aparecerá aquí.
          </p>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sección</TableHead>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Editado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((entry) => (
                  <TableRow key={`${entry.kind}-${entry.id}`}>
                    <TableCell className="text-muted-foreground">
                      {entry.kind}
                    </TableCell>
                    <TableCell className="max-w-80 font-medium whitespace-normal break-words">
                      <Link
                        href={entry.href}
                        className="underline-offset-4 hover:underline"
                      >
                        {entry.label}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={entry.status}
                        feminine={entry.feminine}
                      />
                    </TableCell>
                    <TableCell>
                      <time dateTime={entry.updatedAt}>
                        {formatDateTime(entry.updatedAt)}
                      </time>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
