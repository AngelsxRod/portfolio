interface NumberedEyebrowProps {
  number?: string;
  label: string;
}

export function NumberedEyebrow({ number, label }: NumberedEyebrowProps) {
  return (
    <div className="flex items-baseline gap-2.5 font-mono">
      {number ? <span className="text-sm font-bold text-purple-text">{number}</span> : null}
      <span className="text-[13px] tracking-[0.12em] text-muted-foreground uppercase">{label}</span>
    </div>
  );
}
