import type { ReactNode } from "react";
import { educationLevels } from "@/lib/education";
import { formatMonth } from "@/lib/experience";
import type { PublicCertificate } from "@/lib/certificates";
import type { PublicEducation } from "@/lib/education";
import type { PublicExperience } from "@/lib/experience";
import type { PublicSkill } from "@/lib/skills";

/** Encabezado de página interna: un `h1`, una frase de contexto y su rótulo. */
export function PageHeader({
  caption,
  title,
  intro,
}: {
  caption: string;
  title: string;
  intro: string;
}) {
  return (
    <header className="archive-header">
      <p className="folio-caption">{caption}</p>
      <h1 className="display-title">{title}</h1>
      <p className="archive-intro">{intro}</p>
    </header>
  );
}

export function EmptyPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-panel">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function SkillsList({ skills }: { skills: PublicSkill[] }) {
  const categories = Map.groupBy(skills, (skill) => skill.category);
  return (
    <dl className="skills-list">
      {[...categories].map(([category, items]) => (
        <div key={category} className="skills-group">
          <dt>{category}</dt>
          <dd>
            <ul>
              {items.map((skill) => (
                <li key={skill.id}>{skill.name}</li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Period({
  start,
  end,
  ongoing,
}: {
  start: string;
  end: string | null;
  ongoing: string;
}) {
  return (
    <p className="experience-period">
      <time dateTime={start}>{formatMonth(start)}</time>
      {" – "}
      {end ? <time dateTime={end}>{formatMonth(end)}</time> : ongoing}
    </p>
  );
}

export function ExperienceList({ items }: { items: PublicExperience[] }) {
  return (
    <ol className="experience-list">
      {items.map((item) => (
        <li key={item.id}>
          <article className="experience-entry">
            <Period
              start={item.startDate}
              end={item.endDate}
              ongoing="Actual"
            />
            <div className="experience-body">
              <h2>{item.title}</h2>
              <p className="experience-organization">{item.organization}</p>
              {item.description && <p>{item.description}</p>}
              {item.achievements.length > 0 && (
                <ul className="experience-achievements">
                  {item.achievements.map((achievement) => (
                    <li key={achievement}>{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

export function EducationList({ items }: { items: PublicEducation[] }) {
  return (
    <ol className="experience-list">
      {items.map((item) => (
        <li key={item.id}>
          <article className="experience-entry">
            <Period
              start={item.startDate}
              end={item.endDate}
              ongoing="En curso"
            />
            <div className="experience-body">
              <p className="education-level">{educationLevels[item.level]}</p>
              <h2>{item.program}</h2>
              <p className="experience-organization">{item.institution}</p>
              {item.description && <p>{item.description}</p>}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

export function CertificatesList({ items }: { items: PublicCertificate[] }) {
  return (
    <ol className="experience-list">
      {items.map((item) => (
        <li key={item.id}>
          <article className="experience-entry">
            <p className="experience-period">
              <time dateTime={item.issueDate}>
                {formatMonth(item.issueDate)}
              </time>
            </p>
            <div className="experience-body">
              <h3>{item.name}</h3>
              <p className="experience-organization">{item.issuer}</p>
              {item.description && <p>{item.description}</p>}
              {item.verificationUrl && (
                <p>
                  <a
                    href={item.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Verificar certificado
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
