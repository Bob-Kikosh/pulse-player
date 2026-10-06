import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const solid: IconProps = { ...stroke, fill: "currentColor", stroke: "none" };

export function PlayIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <path d="M8 5.1v13.8a1 1 0 0 0 1.5.9l11-6.9a1 1 0 0 0 0-1.8l-11-6.900A1 1 0 0 0 8 5.100z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
      <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
    </svg>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <path d="M5 5.8v12.4a1 1 0 0 0 1.600.8l8.400-6.200a1 1 0 0 0 0-1.600L6.600 5a1 1 0 0 0-1.600.8z" />
      <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
    </svg>
  );
}

export function PrevIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <path d="M19 5.8v12.4a1 1 0 0 1-1.600.8L9 12.800a1 1 0 0 1 0-1.600L17.400 5a1 1 0 0 1 1.600.8z" />
      <rect x="5" y="5" width="2.5" height="14" rx="1" />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...stroke} fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.700 1-1.100a5.500 5.500 0 0 0 0-7.800z" />
    </svg>
  );
}

export function VolumeIcon({ level, ...props }: IconProps & { level: "muted" | "low" | "high" }) {
  return (
    <svg {...stroke} {...props}>
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      {level === "muted" && <path d="m16 9 5 6M21 9l-5 6" />}
      {level !== "muted" && <path d="M15.500 9a4 4 0 0 1 0 6" />}
      {level === "high" && <path d="M18.500 6a8 8 0 0 1 0 12" />}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.300-4.300" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function LogoIcon(props: IconProps) {
  return (
    <svg {...stroke} strokeWidth={2.4} {...props}>
      <path d="M2 12h3l2.500-6 4 13 3.500-10 2 3H22" />
    </svg>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M3 6h13M3 12h13M3 18h9" />
      <path d="M17 15v6l5-3z" fill="currentColor" />
    </svg>
  );
}

export function PlaylistIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <svg {...solid} {...props}>
      <circle cx="9" cy="6" r="1.600" />
      <circle cx="15" cy="6" r="1.600" />
      <circle cx="9" cy="12" r="1.600" />
      <circle cx="15" cy="12" r="1.600" />
      <circle cx="9" cy="18" r="1.600" />
      <circle cx="15" cy="18" r="1.600" />
    </svg>
  );
}
