"use client";

import { ReactNode, useEffect } from "react";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  tall?: boolean;
  compact?: boolean;
  hideClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function GlassSheet({
  open,
  onClose,
  title,
  subtitle,
  tall,
  compact,
  hideClose,
  children,
  footer,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheet-dim" aria-label="Close" onClick={onClose} />
      <div
        className={`glass-sheet ${tall ? "glass-sheet-tall" : ""} ${compact ? "glass-sheet-compact" : ""}`}
      >
        <div className="sheet-specular" />
        <div className="sheet-grabber">
          <span />
        </div>
        {(title || !hideClose) && (
          <div className="sheet-header">
            <div className="sheet-heading">
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {!hideClose && (
              <button className="glass-icon-btn" onClick={onClose} aria-label="Close">
                <CloseIcon size={16} />
              </button>
            )}
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
}
