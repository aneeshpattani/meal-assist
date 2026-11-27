"use client";

import { ReactNode } from "react";
import { Drawer } from "vaul";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  tall?: boolean;
  compact?: boolean;
  hideClose?: boolean;
  dismissible?: boolean;
  label?: string;
  onAnimationEnd?: (open: boolean) => void;
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
  dismissible = true,
  label,
  onAnimationEnd,
  children,
  footer,
}: Props) {
  const a11yLabel = title ?? label ?? "Dialog";

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      shouldScaleBackground={false}
      autoFocus={false}
      dismissible={dismissible}
      onAnimationEnd={onAnimationEnd}
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-dim" />
        <Drawer.Content
          className={`glass-sheet ${tall ? "glass-sheet-tall" : ""} ${compact ? "glass-sheet-compact" : ""}`}
        >
          <div className="sheet-specular" />
          <div className="sheet-grabber">
            <Drawer.Handle />
          </div>
          {title ? (
            <div className="sheet-header">
              <div className="sheet-heading">
                <Drawer.Title asChild>
                  <h2>{title}</h2>
                </Drawer.Title>
                {subtitle ? (
                  <Drawer.Description asChild>
                    <p>{subtitle}</p>
                  </Drawer.Description>
                ) : (
                  <Drawer.Description className="sr-only">{a11yLabel}</Drawer.Description>
                )}
              </div>
              {!hideClose && (
                <button
                  className="glass-icon-btn"
                  onClick={onClose}
                  aria-label="Close"
                  data-vaul-no-drag
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
          ) : (
            <>
              <Drawer.Title className="sr-only">{a11yLabel}</Drawer.Title>
              <Drawer.Description className="sr-only">{a11yLabel}</Drawer.Description>
              {!hideClose && (
                <div className="sheet-header sheet-header-close-only">
                  <button
                    className="glass-icon-btn"
                    onClick={onClose}
                    aria-label="Close"
                    data-vaul-no-drag
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              )}
            </>
          )}
          <div className="sheet-body">{children}</div>
          {footer && (
            <div className="sheet-footer" data-vaul-no-drag>
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
