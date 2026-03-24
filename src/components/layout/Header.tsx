import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import panoptoMark from "../../assets/panopto-mark.svg";
import { CreateTopicDialog } from "../topic/CreateTopicDialog";
import { AddAssetModal } from "../asset/AddAssetModal";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import type { SearchResultType } from "../../services/mockApi";

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

const TYPE_ICONS: Record<SearchResultType, string> = {
  topic: "Folio",
  asset: "Material",
  flashcardSet: "Flashcards",
  quiz: "Quiz",
  mindmap: "Mind Map",
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  topic: "bg-forest/10 text-forest",
  asset: "bg-asset-document/10 text-asset-document",
  flashcardSet: "bg-blue-500/10 text-blue-500",
  quiz: "bg-amber-500/10 text-amber-500",
  mindmap: "bg-purple-500/10 text-purple-500",
};

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

  // Search
  const { query, setQuery, results, isSearching, clear } = useGlobalSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const showResults = searchFocused && query.trim().length > 0;

  // Reset active index when results change
  const resultsKey = results.map((r) => r.id).join(",");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset selection on new results
    setActiveIndex(-1);
  }, [resultsKey]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!showResults) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResults]);

  const navigateToResult = useCallback(
    (href: string) => {
      navigate(href);
      clear();
      setSearchFocused(false);
      inputRef.current?.blur();
    },
    [navigate, clear],
  );

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) {
      if (e.key === "Escape") {
        clear();
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          navigateToResult(results[activeIndex].href);
        }
        break;
      case "Escape":
        e.preventDefault();
        clear();
        inputRef.current?.blur();
        break;
    }
  }

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
        <div ref={searchRef} className="flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search folios, materials, flashcards, quizzes..."
              aria-label="Search folios, materials, and study aids"
              aria-expanded={showResults && results.length > 0}
              aria-controls="global-search-results"
              aria-activedescendant={
                activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
              }
              role="combobox"
              aria-autocomplete="list"
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface border border-border rounded-[var(--radius-full)] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Search results dropdown */}
          {showResults && (
            <div
              id="global-search-results"
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 right-0 top-full mt-1.5 max-h-[400px] overflow-y-auto rounded-lg border border-border bg-background shadow-lg z-50"
            >
              {isSearching && results.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Searching...
                </div>
              )}

              {!isSearching && results.length === 0 && query.trim().length > 0 && (
                <div className="px-4 py-6 text-center text-sm text-text-secondary">
                  No results found for &ldquo;{query.trim()}&rdquo;
                </div>
              )}

              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  id={`search-result-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => navigateToResult(result.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={[
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    i === activeIndex
                      ? "bg-surface"
                      : "hover:bg-surface",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
                      TYPE_COLORS[result.type],
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {TYPE_ICONS[result.type].charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="truncate text-xs text-text-secondary">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                    {TYPE_ICONS[result.type]}
                  </span>
                </button>
              ))}

              {results.length > 0 && (
                <div className="border-t border-border px-4 py-2 text-[11px] text-text-disabled">
                  <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">&uarr;&darr;</kbd>{" "}
                  navigate{" "}
                  <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{" "}
                  select{" "}
                  <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">Esc</kbd>{" "}
                  close
                </div>
              )}
            </div>
          )}
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
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-forest text-white text-xs font-semibold select-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="User menu"
          >
            YK
          </button>
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
