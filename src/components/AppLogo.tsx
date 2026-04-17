import { ShieldCheck, Wallet } from 'lucide-react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export default function AppLogo({ size = 48, className = '' }: AppLogoProps) {
  const iconSize = Math.round(size * 0.4);
  const badgeSize = Math.max(16, Math.round(size * 0.26));

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-[30%] shadow-[0_20px_45px_rgba(15,23,42,0.35)] ${className}`}
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 20% 18%, rgba(255,255,255,0.26), transparent 30%), linear-gradient(150deg, #0f172a 0%, #15357a 48%, #2563eb 100%)',
      }}
    >
      <div className="absolute inset-[10%] rounded-[28%] border border-white/18 bg-white/7" />
      <div className="absolute inset-[17%] rounded-[24%] border border-white/10" />
      <div className="absolute start-[16%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/14 blur-[1px]" />
      <Wallet
        className="relative z-10 text-white drop-shadow-[0_10px_25px_rgba(15,23,42,0.35)]"
        style={{ width: iconSize, height: iconSize }}
      />
      <div
        className="absolute end-[10%] top-[10%] z-20 flex items-center justify-center rounded-full border border-white/22 bg-emerald-400/18 text-white shadow-[0_8px_20px_rgba(16,185,129,0.18)]"
        style={{ width: badgeSize, height: badgeSize }}
      >
        <ShieldCheck style={{ width: badgeSize * 0.56, height: badgeSize * 0.56 }} />
      </div>
    </div>
  );
}
