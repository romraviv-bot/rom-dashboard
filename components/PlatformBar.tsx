interface Props {
  ytPercent: number;
  fbPercent: number;
  show: boolean;
}

export default function PlatformBar({ ytPercent, fbPercent, show }: Props) {
  if (!show) return null;

  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-px bg-[#0a0a0a]">
      <div
        className="bg-[#FF0000] transition-all duration-500"
        style={{ width: `${ytPercent}%` }}
        title={`YouTube: ${ytPercent}%`}
      />
      <div
        className="bg-[#1877f2] transition-all duration-500"
        style={{ width: `${fbPercent}%` }}
        title={`Facebook: ${fbPercent}%`}
      />
    </div>
  );
}
