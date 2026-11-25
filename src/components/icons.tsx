type IconProps = {
  size?: number;
  className?: string;
};

export function ShareIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M8 2V10M10.6667 4.66667L8 2L5.33333 4.66667M3.33333 9.33333V12C3.33333 12.3536 3.47381 12.6928 3.72386 12.9428C3.97391 13.1929 4.31304 13.3333 4.66667 13.3333H11.3333C11.687 13.3333 12.0261 13.1929 12.2761 12.9428C12.5262 12.6928 12.6667 12.3536 12.6667 12V9.33333"
        stroke="currentColor"
        strokeWidth="1.06667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookmarkIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M7.33333 2.75H14.6667C15.1529 2.75 15.6192 2.94315 15.963 3.28697C16.3068 3.63079 16.5 4.0971 16.5 4.58333V17.4167L11 14.6667L5.5 17.4167V4.58333C5.5 4.0971 5.69315 3.63079 6.03697 3.28697C6.38079 2.94315 6.8471 2.75 7.33333 2.75Z"
        stroke="currentColor"
        strokeWidth="1.46667"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M3.66667 6.41667H18.3333M3.66667 11H18.3333M3.66667 15.5833H12.8333"
        stroke="currentColor"
        strokeWidth="1.46667"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoreIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="5.5" cy="11" r="1.1" fill="currentColor" />
      <circle cx="11" cy="11" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="11" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.25 10.5L8.75 7L5.25 3.5"
        stroke="currentColor"
        strokeWidth="0.933333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10.5 10.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 9.2L7.4 12.6L14 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H14.5C15.33 4 16 4.67 16 5.5V12.2C16 13.03 15.33 13.7 14.5 13.7H8.2L4 16.2V5.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="7"
        y="5"
        width="9"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 13.5V4.5C5 3.67 5.67 3 6.5 3H13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DocIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M6 3.5H11.2L15 7.3V16.5C15 17.05 14.55 17.5 14 17.5H6C5.45 17.5 5 17.05 5 16.5V4.5C5 3.95 5.45 3.5 6 3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M11 3.5V8H15" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
