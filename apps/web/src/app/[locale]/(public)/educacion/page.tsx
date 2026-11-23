import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import "@/styles/os/education.css";
import { formatMonth } from "@/lib/experience";
import { getPublicCertificates } from "@/lib/public-certificates";
import { getPublicEducation } from "@/lib/public-education";
import { formatPeriod } from "@/lib/os/periods";
import { safeExternalUrl } from "@/lib/safe-url";
import { Blob } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import {
  StudyFolder,
  type CertificateItem,
  type StudyFile,
} from "@/components/os/study-folder";
import { Ticker } from "@/components/os/ticker";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "/educacion", "education");
}

/** Nombre de archivo de presentación a partir del programa. */
function fileName(program: string) {
  const slug = program
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const short =
    slug.length <= 24 ? slug : slug.slice(0, slug.lastIndexOf("_", 24));
  return `${short || slug.slice(0, 24)}.txt`;
}

export default async function EducationPage() {
  const [locale, t, common] = await Promise.all([
    getLocale(),
    getTranslations("education.levels"),
    getTranslations("common"),
  ]);
  const present = common("present");
  const [education, certificates] = await Promise.all([
    getPublicEducation(),
    getPublicCertificates(),
  ]);
  const studies: StudyFile[] = education.map((item) => ({
    id: item.id,
    file: fileName(item.program),
    level: t(item.level),
    program: item.program,
    institution: item.institution,
    period: formatPeriod(item.startDate, item.endDate, locale, present),
    description: item.description,
    current: !item.endDate,
  }));
  const certificateItems: CertificateItem[] = certificates.map((item) => ({
    id: item.id,
    name: item.name,
    issuer: item.issuer,
    issued: formatMonth(item.issueDate, locale),
    verificationUrl: safeExternalUrl(item.verificationUrl),
  }));
  return (
    <>
      <Desktop>
        <Blob shape="pill" style={{ left: 120, top: 640 }} />
        <Blob shape="circle" style={{ left: 1200, top: 560 }} />
        <StudyFolder studies={studies} certificates={certificateItems} />
      </Desktop>
      <Ticker
        items={[
          ...education.map((item) => item.institution),
          ...education.map((item) => item.program),
          ...certificates.map((item) => item.name),
        ]}
      />
    </>
  );
}
