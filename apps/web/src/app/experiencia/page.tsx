import type { Metadata } from "next";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { getPublicCertificates } from "@/lib/public-certificates";
import { getPublicEducation } from "@/lib/public-education";
import { getPublicExperience } from "@/lib/public-experience";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import {
  CertificatesList,
  EducationList,
  EmptyPanel,
  ExperienceList,
  PageHeader,
} from "@/components/public-lists";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trayectoria | Portafolio" };

const sections = ["experiencia", "educacion", "certificados"] as const;

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>;
}) {
  const [{ seccion }, experience, education, certificates] = await Promise.all([
    searchParams,
    getPublicExperience(),
    getPublicEducation(),
    getPublicCertificates(),
  ]);
  const initial =
    sections.find((section) => section === seccion) ?? "experiencia";
  const tabs = [
    { value: "experiencia", label: "Experiencia", count: experience.length },
    { value: "educacion", label: "Educación", count: education.length },
    {
      value: "certificados",
      label: "Certificados",
      count: certificates.length,
    },
  ];
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="experience" />
      <main id="contenido" className="page-frame archive-main">
        <PageHeader
          caption="Trayectoria"
          title="Trayectoria"
          intro="Experiencia profesional, estudios realizados y certificados publicados."
        />
        <Tabs defaultValue={initial} className="trajectory-tabs">
          <TabsList variant="line" className="trajectory-tabs-list">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <span className="trajectory-count">{tab.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="experiencia">
            {experience.length > 0 ? (
              <ExperienceList items={experience} />
            ) : (
              <EmptyPanel title="Aún no hay experiencia publicada">
                Aparecerá aquí cuando se publique desde el panel.
              </EmptyPanel>
            )}
          </TabsContent>
          <TabsContent value="educacion">
            {education.length > 0 ? (
              <EducationList items={education} />
            ) : (
              <EmptyPanel title="Aún no hay educación publicada">
                Aparecerá aquí cuando se publique desde el panel.
              </EmptyPanel>
            )}
          </TabsContent>
          <TabsContent value="certificados">
            {certificates.length > 0 ? (
              <CertificatesList items={certificates} />
            ) : (
              <EmptyPanel title="Aún no hay certificados publicados">
                Aparecerán aquí cuando se publiquen desde el panel.
              </EmptyPanel>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <PublicFooter />
    </div>
  );
}
