/**
 * @module AppNavbar/icons
 * @description Icon components for the navbar
 */

interface IconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

function Icon({ children, ...props }: React.PropsWithChildren<IconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PhotosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8a3 3 0 0 1 3-3h2l1.2-1.6a1 1 0 0 1 .8-.4h4a1 1 0 0 1 .8.4L18 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
      <circle cx="12" cy="11" r="2.6" />
      <path
        d="m4 16 4.5-4 2.5 2.5L14 11l6 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 7.5h.01" strokeWidth="2.4" strokeLinecap="round" />
    </Icon>
  );
}

export function AnalysisIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V6" />
      <path d="M20 20H4" />
      <path d="m6 14 3.5-4 3 3 5.5-6" />
      <circle cx="9.5" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
      <circle cx="17.5" cy="7" r="1.6" fill="currentColor" opacity="0.35" />
      <path d="M18 4v3h3" />
    </Icon>
  );
}

export function SuggestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1Z" />
      <path d="M21 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
      <path d="M3 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
      <path d="M18.36 4.64a1 1 0 0 0-1.41 1.41 1 1 0 0 0 1.41-1.41Z" />
      <path d="M7.05 4.64a1 1 0 0 0-1.41-1.41 1 1 0 0 0 1.41 1.41Z" />
      <path d="M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3.5-5 3.5s-5-1-5-3.5a5 5 0 0 1 5-5Z" />
      <path d="M9 18a3 3 0 0 0 6 0" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </Icon>
  );
}
