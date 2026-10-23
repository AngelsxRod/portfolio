import type { Metadata } from "next";
import { getPublicExperience } from "@/lib/public-experience";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import {
  EmptyPanel,
  ExperienceList,
  PageHeader,
} from "@/components/public-lists";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Experiencia | Portafolio" };

export default async function ExperiencePage() {
  const experience = await getPublicExperience();
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="experience" />
      <main id="contenido" className="page-frame archive-main">
        <PageHeader
          caption="Trayectoria"
          title="Experiencia"
          intro="Cargos y prácticas, con las responsabilidades de cada uno."
        />
        {experience.length > 0 ? (
          <ExperienceList items={experience} />
        ) : (
          <EmptyPanel title="Aún no hay experiencia publicada">
            Aparecerá aquí cuando se publique desde el panel.
          </EmptyPanel>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
