const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden={label ? undefined : true} aria-label={label} className="shrink-0">
      {children}
    </svg>
  );
}

export function IconHouse() {
  return (
    <Icon>
      <path d="M4 11.5 12 4l8 7.5" {...stroke} />
      <path d="M6.5 10.5V20h11V10.5" {...stroke} />
      <circle cx="12" cy="15.5" r="1.3" {...stroke} />
    </Icon>
  );
}

export function IconHome() {
  return (
    <Icon>
      <path d="M4 12 12 5l8 7" {...stroke} />
      <path d="M7 11.5V19h10v-7.5" {...stroke} />
    </Icon>
  );
}

export function IconChat() {
  return (
    <Icon>
      <path d="M5 6.5h14v9.5H9l-4 3V6.5Z" {...stroke} />
    </Icon>
  );
}

export function IconCat() {
  return (
    <Icon>
      <path d="M7 10.5 5 6l4 2.2M17 10.5 19 6l-4 2.2" {...stroke} />
      <circle cx="12" cy="14" r="5.2" {...stroke} />
      <circle cx="10.2" cy="13.4" r=".7" fill="currentColor" />
      <circle cx="13.8" cy="13.4" r=".7" fill="currentColor" />
    </Icon>
  );
}

export function IconPaper() {
  return (
    <Icon>
      <path d="M8 5.5h8.5L18.5 8v11.5H8Z" {...stroke} />
      <path d="M16.5 5.5V8h2" {...stroke} />
      <path d="M10.5 12h5M10.5 15h3.5" {...stroke} />
    </Icon>
  );
}

export function IconJar() {
  return (
    <Icon>
      <path d="M9 6.5h6v2H9Z" {...stroke} />
      <path d="M8 8.5h8l-.6 9.2a3.6 3.6 0 0 1-7.2 0Z" {...stroke} />
    </Icon>
  );
}

export function IconBox() {
  return (
    <Icon>
      <path d="M4.5 9.5h15v9.5h-15Z" {...stroke} />
      <path d="M4.5 13h15M12 9.5V19" {...stroke} />
      <path d="M12 5.5c-1.6 2.2-3.6 1.4-2.2 3.2C11 7.4 12 8.5 12 8.5s1-1.1 2.2-.2C15.6 6.9 13.6 7.7 12 5.5Z" {...stroke} />
    </Icon>
  );
}

export function IconPad() {
  return (
    <Icon>
      <rect x="4.5" y="8" width="15" height="10.5" rx="3" {...stroke} />
      <circle cx="9" cy="13.2" r="1.4" {...stroke} />
      <path d="M14.2 12h3.2M15.8 10.4v3.2" {...stroke} />
    </Icon>
  );
}

export function IconMail() {
  return (
    <Icon>
      <rect x="4" y="7" width="16" height="11.5" rx="1.6" {...stroke} />
      <path d="M5 8.5 12 14l7-5.5" {...stroke} />
    </Icon>
  );
}

export function IconCal() {
  return (
    <Icon>
      <rect x="5" y="6.5" width="14" height="13" rx="1.6" {...stroke} />
      <path d="M5 10.5h14M9 4.5v3M15 4.5v3" {...stroke} />
    </Icon>
  );
}

export function IconSun() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3.2" {...stroke} />
      <path d="M12 5v1.6M12 17.4V19M5 12h1.6M17.4 12H19M7.1 7.1l1.1 1.1M15.8 15.8l1.1 1.1M16.9 7.1l-1.1 1.1M8.2 15.8 7.1 16.9" {...stroke} />
    </Icon>
  );
}

export function IconBook() {
  return (
    <Icon>
      <path d="M5 6.5c3.2 0 5.4 1.3 7 1.3s3.8-1.3 7-1.3v12.2c-3.2 0-5.4 1.3-7 1.3s-3.8-1.3-7-1.3Z" {...stroke} />
      <path d="M12 7.8v12" {...stroke} />
    </Icon>
  );
}

export function IconCorner() {
  return (
    <Icon>
      <path d="M5 18V8.5A3.5 3.5 0 0 1 8.5 5H18" {...stroke} />
      <path d="M8 18h11.5v-8.5H10A2 2 0 0 0 8 11.5Z" {...stroke} />
    </Icon>
  );
}

export function IconKeep() {
  return (
    <Icon>
      <circle cx="9" cy="10" r="2.6" {...stroke} />
      <path d="M11.2 11.8 19 19M16.2 16.2 19 19 16.4 19.4" {...stroke} />
    </Icon>
  );
}

export function IconMenu() {
  return (
    <Icon label="打开菜单">
      <path d="M5 7.5h14M5 12h14M5 16.5h14" {...stroke} />
    </Icon>
  );
}

export function IconChevron() {
  return (
    <Icon>
      <path d="M8 10.5 12 14.5 16 10.5" {...stroke} />
    </Icon>
  );
}

export function IconClose() {
  return (
    <Icon label="关闭">
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" {...stroke} />
    </Icon>
  );
}

export function IconHands() {
  return (
    <Icon>
      <path d="M8 14.5c-1.4-1.8.2-3.8 1.8-2.4L12 14l2.2-1.9c1.6-1.4 3.2.6 1.8 2.4L12 20Z" {...stroke} />
      <path d="M9 8.5c0-2 1.4-3.5 3-3.5s3 1.5 3 3.5" {...stroke} />
    </Icon>
  );
}

export function IconCards() {
  return (
    <Icon>
      <rect x="6" y="5.5" width="9" height="12" rx="1.4" {...stroke} />
      <path d="M10.5 7.5h8v12a1.4 1.4 0 0 1-1.4 1.4H10.5" {...stroke} />
    </Icon>
  );
}

export function IconBrush() {
  return (
    <Icon>
      <path d="M14.5 5.5 18.5 9.5 11 17H7v-4Z" {...stroke} />
      <path d="M7 17c-.8 1.6-2.4 2.2-3 2.2" {...stroke} />
    </Icon>
  );
}

export function IconRps() {
  return (
    <Icon>
      <path d="M8 10.5V8.2a1.6 1.6 0 0 1 3.2 0V12" {...stroke} />
      <path d="M11.2 9.2V8a1.5 1.5 0 0 1 3 0v5" {...stroke} />
      <path d="M14.2 9.6V8.4a1.4 1.4 0 1 1 2.8 0V14c0 3-2.2 5-5.4 5H11c-2.8 0-5-1.8-5-4.4v-3.3A1.6 1.6 0 0 1 8.6 10" {...stroke} />
    </Icon>
  );
}
