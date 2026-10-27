import { useEffect, useState } from "react";
import customWallpaper from "./assets/custom/wallpaper.jpeg";
import { createRoot } from "react-dom/client";
import { Phone } from "./Phone";
import { validateWork, type Work } from "./schema";
import "./styles.css";
function Player() {
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("./work.json")
      .then((r) => {
        if (!r.ok) throw Error("缺少 work.json");
        return r.json();
      })
      .then(async (x) => {
        const w = validateWork(x);
        document.title = w.title;
        // Preload the custom wallpaper before mounting the phone so its
        // fallback gradient is not shown while the background image downloads.
        if (w.phone.wallpaper === "dog") {
          const image = new Image();
          image.src = customWallpaper;
          try {
            await image.decode();
          } catch {
            // Keep the player usable if the image cannot be decoded.
          }
        }
        setWork(w);
      })
      .catch((e) => setError(String(e)));
  }, []);
  return (
    <main className="standalone-player">
      {work ? (
        <>
          <div className="player-title">
            <h1>{work.title}</h1>
          </div>
          <Phone work={work} />
          <p className="player-footnote">
            {work.description}
            <br />
            进度保存在此浏览器 · FoundPhone Studio
          </p>
        </>
      ) : (
        <p>{error || "正在打开故事…"}</p>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Player />);
