import { NavLink } from "react-router-dom";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
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

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
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

function CollapseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3H5C3.9 3 3 3.9 3 5V15C3 16.1 3.9 17 5 17H15C16.1 17 17 16.1 17 15V5C17 3.9 16.1 3 15 3Z" />
      <path d="M8 3V17" />
      <path d="M12 10L10 8M10 12L12 10" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3H5C3.9 3 3 3.9 3 5V15C3 16.1 3.9 17 5 17H15C16.1 17 17 16.1 17 15V5C17 3.9 16.1 3 15 3Z" />
      <path d="M8 3V17" />
      <path d="M10 10L12 8M12 12L10 10" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/library", label: "Library", icon: BookIcon, end: false },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`h-full border-r border-border bg-background flex flex-col py-4 transition-all duration-200 ease-in-out ${
        collapsed ? "w-16 px-2" : "w-60 px-3"
      }`}
    >
      <nav aria-label="Main navigation" className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                isActive
                  ? "bg-forest text-white"
                  : "text-text-secondary hover:bg-surface"
              }`
            }
          >
            <Icon />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`flex items-center gap-3 py-2.5 rounded-[var(--radius-sm)] text-sm text-text-secondary hover:bg-surface transition-colors ${
          collapsed ? "justify-center px-0" : "px-3"
        }`}
      >
        {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
