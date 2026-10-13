import { useId, type SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement>;

const DARK = "#1f1f24";

function GoldGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient
        id={id}
        x1="450"
        y1="360"
        x2="870"
        y2="745"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#e9b34c" />
        <stop offset="0.5" stopColor="#b07412" />
        <stop offset="1" stopColor="#e3a82f" />
      </linearGradient>
    </defs>
  );
}

/** The "DG" monogram (dark D + gold D/G). */
function Monogram({ gold }: { gold: string }) {
  return (
    <>
      <path
        fill={DARK}
        d="M395 250H640C752 250 836 328 868 445H800C780 372 724 312 640 312H490L512 340L478 588H640C676 588 708 580 730 588L690 628C672 638 656 642 640 642H398L445 308Z"
      />
      <path fill={DARK} d="M627 545L682 487H902V530H850L832 545Z" />
      <path
        fill={gold}
        d="M556 365H640C705 365 748 398 760 445H684C672 433 652 426 628 426H606L590 585H528Z"
      />
      <path
        fill={gold}
        d="M868 545C860 660 760 745 620 745C550 745 490 720 450 678H590C690 678 790 640 820 545Z"
      />
    </>
  );
}

/** One side of the barbell (plates + end cap). */
function Plates() {
  return (
    <g fill={DARK}>
      <rect x="300" y="375" width="48" height="268" rx="10" />
      <rect x="255" y="400" width="38" height="220" rx="8" />
      <rect x="225" y="438" width="24" height="142" rx="6" />
      <rect x="175" y="493" width="50" height="30" rx="6" />
    </g>
  );
}

/**
 * Compact DG monogram, sized like a lucide icon.
 * <DarkGoldMark />                 // size-4.5, same as <Dumbbell className="size-4.5" />
 * <DarkGoldMark className="size-6 text-white" />
 */
export function DarkGoldMark({ className = "size-4.5", ...props }: LogoProps) {
  const gid = useId();
  return (
    <svg
      viewBox="388 244 520 506"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
      {...props}
    >
      <GoldGradient id={gid} />
      <Monogram gold={`url(#${gid})`} />
    </svg>
  );
}

/** Full barbell + DG emblem. Wide (about 1.8:1), so size it by height. */
export function DarkGoldEmblem({
  className = "h-8 w-auto",
  ...props
}: LogoProps) {
  const gid = useId();
  const gold = `url(#${gid})`;
  return (
    <svg
      viewBox="170 240 920 515"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
      {...props}
    >
      <GoldGradient id={gid} />
      <Plates />
      <rect x="355" y="487" width="60" height="43" fill={DARK} />
      <rect x="210" y="478" width="8" height="62" rx="3" fill={gold} />
      <g transform="translate(1257 0) scale(-1 1)">
        <Plates />
      </g>
      <rect x="1039" y="478" width="8" height="62" rx="3" fill={gold} />
      <Monogram gold={gold} />
    </svg>
  );
}

export default DarkGoldMark;