import type { Metadata } from "next";
import "@/styles/os/experience.css";
import { getPublicEducation } from "@/lib/public-education";
import { getPublicExperience } from "@/lib/public-experience";
import { formatPeriod } from "@/lib/os/periods";
import { timeline } from "@/lib/os/timeline";
import { Blob, StickyNote } from "@/components/os/decor";
import { Desktop } from "@/components/os/desktop";
import { GitLog, type Commit, type StudyBar } from "@/components/os/git-log";
import { Ticker } from "@/components/os/ticker";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trayectoria | angel.os" };

export default async function ExperiencePage() {
  const [experience, education] = await Promise.all([
    getPublicExperience(),
    getPublicEducation(),
  ]);
  const { years, bars } = timeline(
    [
      ...experience.map((item) => ({
        start: item.startDate,
        end: item.endDate,
      })),
      ...education.map((item) => ({
        start: item.startDate,
        end: item.endDate,
      })),
    ],
    new Date(),
  );
  const head = experience.find((item) => !item.endDate);
  const commits: Commit[] = experience.map((item, index) => ({
    id: item.id,
    hash: item.id.replaceAll("-", "").slice(0, 7),
    head: item === head,
    organization: item.organization,
    title: item.title,
    period: formatPeriod(item.startDate, item.endDate),
    description: item.description,
    achievements: item.achievements,
    bar: bars[index]!,
  }));
  const studies: StudyBar[] = education.map((item, index) => ({
    id: item.id,
    label: `${item.institution}, ${formatPeriod(item.startDate, item.endDate)}`,
    bar: bars[experience.length + index]!,
  }));

  return (
    <>
      <Desktop>
        <Blob shape="circle" style={{ left: 1180, top: 620 }} />
        <Blob shape="ring" style={{ left: 760, top: 680 }} />
        <GitLog commits={commits} studies={studies} years={years} />
        <StickyNote
          title="git checkout -b futuro"
          style={{ left: 980, top: 430 }}
        >
          <p>El siguiente commit puede ser tu proyecto.</p>
          <Link href="/contacto">Hablemos →</Link>
        </StickyNote>
      </Desktop>
      <Ticker items={experience.map((item) => item.organization)} />
    </>
  );
}
