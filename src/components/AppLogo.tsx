import { Sparkles, Wallet } from 'lucide-react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export default function AppLogo({ size = 48, className = '' }: AppLogoProps) {
  const iconSize = Math.round(size * 0.42);
  const badgeSize = Math.max(16, Math.round(size * 0.28));

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-[30%] shadow-[0_20px_45px_rgba(15,23,42,0.35)] ${className}`}
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.28), transparent 34%), linear-gradient(140deg, #3b82f6 0%, #1d4ed8 42%, #0f172a 100%)',
      }}
    >
      <div className="absolute inset-[10%] rounded-[28%] border border-white/18 bg-white/8" />
      <Wallet
        className="relative z-10 text-white drop-shadow-[0_10px_25px_rgba(15,23,42,0.35)]"
        style={{ width: iconSize, height: iconSize }}
      />
      <div
        className="absolute end-[10%] top-[10%] z-20 flex items-center justify-center rounded-full border border-white/22 bg-white/14 text-white"
        style={{ width: badgeSize, height: badgeSize }}
      >
        <Sparkles style={{ width: badgeSize * 0.52, height: badgeSize * 0.52 }} />
      </div>
    </div>
  );
}
