interface LogoProps {
  suffix?: string;
}

export function Logo({ suffix }: LogoProps) {
  return (
    <span className="font-mono text-[17px] font-bold">
      <span className="text-purple-text">{'<'}</span>
      AR
      <span className="text-purple-text">{'/>'}</span>
      {suffix ? (
        <span className="ml-2 text-[11px] font-normal text-muted-foreground">{suffix}</span>
      ) : null}
    </span>
  );
}
