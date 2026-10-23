import type { Metadata } from "next";
import { getPublicCertificates } from "@/lib/public-certificates";
import { getPublicEducation } from "@/lib/public-education";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import {
  CertificatesList,
  EducationList,
  EmptyPanel,
  PageHeader,
} from "@/components/public-lists";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Educación | Portafolio" };

export default async function EducationPage() {
  const [education, certificates] = await Promise.all([
    getPublicEducation(),
    getPublicCertificates(),
  ]);
  return (
    <div className="public-site min-h-svh">
      <PublicHeader current="education" />
      <main id="contenido" className="page-frame archive-main">
        <PageHeader
          caption="Formación"
          title="Educación"
          intro="Estudios realizados y en curso, con los certificados publicados."
        />
        {education.length > 0 ? (
          <EducationList items={education} />
        ) : (
          <EmptyPanel title="Aún no hay educación publicada">
            Aparecerá aquí cuando se publique desde el panel.
          </EmptyPanel>
        )}
        {certificates.length > 0 && (
          <section
            aria-labelledby="certificates-title"
            className="about-skills"
          >
            <div className="section-heading">
              <h2 id="certificates-title" className="section-title">
                Certificados
              </h2>
            </div>
            <CertificatesList items={certificates} />
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
