import { formatWeekRange, startOfWeek } from "@/domain/plan";
import { BookmarkIcon, ListIcon, MoreIcon, ShareIcon } from "./icons";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function AppChromeSkeleton() {
  const weekLabel = formatWeekRange(startOfWeek());

  return (
    <div className="phone-shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <header className="page-header">
        <div>
          <h1>This week</h1>
          <p className="page-sub">{weekLabel}</p>
        </div>
        <span className="glass-chip-btn" aria-hidden="true">
          <ShareIcon />
          Share
        </span>
      </header>

      <div className="day-stepper-wrap">
        <div className="day-stepper" aria-hidden="true">
          {DAY_LETTERS.map((letter, index) => (
            <span key={`${letter}-${index}`} className="day-pill">
              <span>{letter}</span>
              <span className="day-dots">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
          ))}
        </div>
      </div>

      <nav className="tab-bar" aria-hidden="true">
        <div className="tab-fade" />
        <div className="tab-capsule">
          <span className="tab-item active">
            <BookmarkIcon />
            Plan
          </span>
          <span className="tab-item">
            <ListIcon />
            Dishes
          </span>
          <span className="tab-item">
            <MoreIcon />
            More
          </span>
        </div>
      </nav>
    </div>
  );
}
