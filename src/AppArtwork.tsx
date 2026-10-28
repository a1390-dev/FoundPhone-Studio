import { useState } from "react";
import { originalIconFiles } from "./ios/originalIconFiles";
import "./ios/original-icons.css";

export function AppArtwork({
  id,
  date,
  time = "09:41",
}: {
  id: string;
  date?: string;
  time?: string;
}) {
  const [failed, setFailed] = useState(false);
  const file = originalIconFiles[id];

  // These are bundled Vite asset URLs, not hand-built /icon-assets paths.
  // That lets Vite generate the correct deployed URL for each original image.
  if (!file) {
    return (
      <span
        className="original-icon-wrap original-icon-unavailable"
        data-original-icon-unavailable={id}
        aria-hidden="true"
      />
    );
  }
  if (failed) {
    return (
      <span
        className="original-icon-wrap original-icon-unavailable"
        data-original-icon-unavailable={id}
        aria-hidden="true"
      />
    );
  }

  const d = /^\d{4}-\d{2}-\d{2}$/.test(date || "")
    ? new Date(date + "T12:00:00Z")
    : new Date("2026-10-25T12:00:00Z");
  const [hour, minute] = /^\d{2}:\d{2}$/.test(time)
    ? time.split(":").map(Number)
    : [9, 41];

  return (
    <span className="original-icon-wrap" data-original-icon={id}>
      <img
        className="app-artwork original-app-artwork"
        src={file}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
        style={{ position: "absolute", inset: 0 }}
        onError={() => setFailed(true)}
      />
      {id === "calendar" && (
        <span className="original-calendar">
          <small>
            {new Intl.DateTimeFormat("zh-CN", {
              weekday: "short",
              timeZone: "UTC",
            }).format(d)}
          </small>
          <b>{d.getUTCDate()}</b>
        </span>
      )}
      {id === "clock" && (
        <svg
          className="original-clock-hands"
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <path
            d="M32 34V18"
            stroke="#111"
            strokeWidth="2.3"
            strokeLinecap="round"
            transform={"rotate(" + ((hour % 12) * 30 + minute / 2) + " 32 32)"}
          />
          <path
            d="M32 35V9"
            stroke="#111"
            strokeWidth="1.8"
            strokeLinecap="round"
            transform={"rotate(" + minute * 6 + " 32 32)"}
          />
          <path d="M32 37V7" stroke="#ff8700" strokeWidth=".7" />
          <circle cx="32" cy="32" r="1.4" fill="#ff8700" />
        </svg>
      )}
    </span>
  );
}

export const hasNativeArtwork = (id: string) => id in originalIconFiles;
