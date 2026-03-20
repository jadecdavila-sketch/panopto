import { NavLink } from "react-router-dom";

function HomeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5L10 2L17 7.5V16.5C17 17.05 16.55 17.5 16 17.5H4C3.45 17.5 3 17.05 3 16.5V7.5Z" />
      <path d="M7.5 17.5V10H12.5V17.5" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3.5C2 3.5 4 2 7 2C10 2 10 3.5 10 3.5V17C10 17 10 16 7 16C4 16 2 17 2 17V3.5Z" />
      <path d="M18 3.5C18 3.5 16 2 13 2C10 2 10 3.5 10 3.5V17C10 17 10 16 13 16C16 16 18 17 18 17V3.5Z" />
    </svg>
  );
}

const tabs = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/library", label: "Library", icon: BookIcon, end: false },
] as const;

export default function BottomTabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around items-center h-16 px-4"
    >
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              isActive ? "text-primary" : "text-text-secondary"
            }`
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
