import {
  BRAND_COLORS,
  MARK_DOT,
  MARK_K_PATH,
  MARK_K_TRANSFORM,
} from "@/lib/os/brand";

/** Isotipo de angel.os. Decorativo: el enlace o el texto vecino lo nombran. */
export function BrandMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="12"
        fill={BRAND_COLORS.lime}
      />
      <path
        d={MARK_K_PATH}
        fill={BRAND_COLORS.ink}
        transform={MARK_K_TRANSFORM}
      />
      <circle
        className="os-mark-dot"
        cx={MARK_DOT.cx}
        cy={MARK_DOT.cy}
        r={MARK_DOT.r}
        fill={BRAND_COLORS.orange}
      />
    </svg>
  );
}
