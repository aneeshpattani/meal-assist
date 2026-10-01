"use client";

import { GlassSheet } from "./GlassSheet";

type Props = {
  open: boolean;
  inviteCode?: string | null;
  onClose: () => void;
  onSignOut?: () => void;
  onOpenCookView?: () => void;
};

export function MoreSheet({
  open,
  inviteCode,
  onClose,
  onSignOut,
  onOpenCookView,
}: Props) {
  return (
    <GlassSheet open={open} onClose={onClose} title="More" compact>
      <div className="more-stack">
        {inviteCode && (
          <div className="more-card">
            <p className="picker-section-label">Household invite</p>
            <p className="invite-code">{inviteCode}</p>
          </div>
        )}
        {onOpenCookView && (
          <button className="glass-btn" onClick={onOpenCookView}>
            Open cook view
          </button>
        )}
        {onSignOut && (
          <button className="glass-btn danger" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </GlassSheet>
  );
}
