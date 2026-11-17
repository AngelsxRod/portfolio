import Markdown from "react-markdown";
import { safeExternalUrl } from "@/lib/safe-url";

const allowedElements = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "code",
  "pre",
  "a",
  "hr",
];

/** Descripción Markdown del CMS: sin HTML, sin imágenes y solo enlaces seguros. */
export function ProjectMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      components={{ h1: ({ children }) => <h2>{children}</h2> }}
      skipHtml
      allowedElements={allowedElements}
      urlTransform={(url) => {
        if (url.startsWith("#")) return url;
        if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\"))
          return url;
        return safeExternalUrl(url) ?? "";
      }}
    >
      {children}
    </Markdown>
  );
}
