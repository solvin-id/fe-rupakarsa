"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  "aria-label"?: string;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Pilih",
  disabled = false,
  className,
  buttonClassName,
  "aria-label": ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const listId = `${buttonId}-listbox`;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onViewportChange = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && listRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function openList(): void {
    if (disabled) return;
    if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeList(): void {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function selectOption(option: SelectOption): void {
    if (option.disabled) return;
    onChange(option.value);
    closeList();
  }

  function moveActive(delta: number): void {
    const enabled = options
      .map((option, index) => ({ option, index }))
      .filter((item) => !item.option.disabled);
    if (enabled.length === 0) return;

    const current = enabled.findIndex((item) => item.index === activeIndex);
    const next = current < 0 ? 0 : (current + delta + enabled.length) % enabled.length;
    setActiveIndex(enabled[next]?.index ?? -1);
  }

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
      } else {
        moveActive(event.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        const option = options[activeIndex];
        if (option) selectOption(option);
      } else {
        openList();
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = options.findIndex((option) => !option.disabled);
      if (first >= 0) setActiveIndex(first);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      for (let index = options.length - 1; index >= 0; index -= 1) {
        if (!options[index]?.disabled) {
          setActiveIndex(index);
          break;
        }
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
    }
  }

  const openUp = rect ? window.innerHeight - rect.bottom < 280 : false;
  const listStyle: React.CSSProperties | undefined = rect
    ? {
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 60,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      }
    : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleButtonKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-left text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors hover:border-border-strong focus:border-ink/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-ink/40",
          buttonClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-muted/60")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && rect
        ? createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={buttonId}
              aria-activedescendant={
                activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
              }
              style={listStyle}
              onKeyDown={handleListKeyDown}
              onMouseDown={(event) => event.preventDefault()}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (
                  next &&
                  (rootRef.current?.contains(next) || listRef.current?.contains(next))
                ) {
                  return;
                }
                setOpen(false);
              }}
              className="max-h-64 overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-[0_24px_60px_-24px_rgba(20,19,17,0.35)] focus:outline-none"
            >
              {options.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">Tidak ada pilihan.</p>
              ) : null}
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={option.value}
                    id={`${listId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-canvas-2 text-ink" : "text-ink/80 hover:bg-canvas-2",
                      isSelected && "font-medium text-ink",
                      option.disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-accent-strong" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
