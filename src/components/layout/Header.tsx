import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import panoptoMark from "../../assets/panopto-mark.svg";
import { CreateTopicDialog } from "../topic/CreateTopicDialog";
import { AddAssetModal } from "../asset/AddAssetModal";

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M12.5 12.5L16 16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M8 3V13" />
      <path d="M3 8H13" />
    </svg>
  );
}

interface DropdownItem {
  label: string;
  action: () => void;
}

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const dropdownItems: DropdownItem[] = [
    {
      label: "Folio",
      action: () => setIsCreateTopicOpen(true),
    },
    {
      label: "Learning Material",
      action: () => setIsAddAssetOpen(true),
    },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Go to home">
          <img src={panoptoMark} alt="" className="h-7" />
          <span className="text-lg font-semibold tracking-tight text-text-primary leading-none">
            Panopto <span className="text-forest">Folio</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search"
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface border border-border rounded-[var(--radius-full)] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        {/* Right side: +New button + Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* +New dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-[var(--radius-full)] transition-colors"
            >
              <PlusIcon />
              New
            </button>

            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 w-44 bg-background border border-border rounded-[var(--radius-md)] shadow-lg py-1 z-50"
              >
                {dropdownItems.map((item) => (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => {
                      item.action();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-surface transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full bg-forest text-white text-xs font-semibold select-none"
            aria-label="User menu"
          >
            YK
          </div>
        </div>
      </header>

      {/* Dialogs */}
      <CreateTopicDialog
        isOpen={isCreateTopicOpen}
        onClose={() => setIsCreateTopicOpen(false)}
        onCreated={(topic) => {
          navigate(`/topics/${topic.id}`);
        }}
      />

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAdded={(assets) => {
          if (assets.length > 0) {
            navigate(`/assets/${assets[0].id}`);
          }
        }}
      />
    </>
  );
}
