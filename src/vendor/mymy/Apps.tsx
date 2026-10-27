/* React/data adapters for dudwo5/Mymy UI templates: kt/ktn/KHD/bub,
 * igHome/igProfile/igDM/igSheet, xHome. See NOTICE.txt for permission.
 * Author content, DOM globals, timers and media dependencies are excluded. */
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Settings,
  Users,
  MessageCircle,
  MoreHorizontal,
  Heart,
  Home,
  Grid,
  Send,
  Bookmark,
  Repeat2,
  BarChart2,
  Share,
  User,
  Bell,
  X,
  Smile,
  Menu,
  Compass,
  CirclePlay,
  Volume2,
  VolumeX,
  BadgeCheck,
} from "lucide-react";
import type { SkinProps } from "../../AppSkins";
import { Avatar, Media } from "../../skins/shared";
import { useSkinState } from "../../skinState";
import { makeItem, type Item } from "../../schema";
import "./ui.css";
import "./adapter.css";
function grouped(items: Item[]) {
  return [...new Set(items.map((i) => i.title))].map((title) => ({
    title,
    items: items.filter((i) => i.title === title),
  }));
}
export function messageRun(items: Item[], index: number) {
  const m = items[index],
    previous = items[index - 1],
    next = items[index + 1];
  return {
    first:
      !previous ||
      previous.outgoing !== m.outgoing ||
      previous.sender !== m.sender,
    last: !next || next.outgoing !== m.outgoing || next.sender !== m.sender,
  };
}
const read = (p: SkinProps, i: Item) =>
  p.creator || i.password ? p.onItem(i) : p.onRead(i.id);
function Blank() {
  return <p className="mymy-empty">暂无内容</p>;
}
function Back({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="返回" onClick={onClick}>
      <ArrowLeft size={22} />
    </button>
  );
}
export function MymyKakao(p: SkinProps) {
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "聊天"),
    [sent, setSent] = useSkinState<string[]>(p, "mymyKktSent", []),
    [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false);
  const list = grouped(p.items),
    messages = [
      ...p.items.filter((i) => i.title === p.thread),
      ...sent.flatMap((raw, index) => {
        try {
          const entry: unknown = JSON.parse(raw);
          if (
            !Array.isArray(entry) ||
            entry.length !== 3 ||
            !entry.every((v) => typeof v === "string") ||
            entry[0] !== p.thread
          )
            return [];
          return [
            makeItem({
              id: "local-kkt-" + index,
              title: entry[0],
              body: entry[1],
              time: entry[2],
              sender: p.owner || "机主",
              outgoing: true,
              meta: { local: "true" },
            }),
          ];
        } catch {
          return [];
        }
      }),
    ],
    scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scroll.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [p.thread, messages.length]);
  return (
    <div className="mymy-ui mymy-kakao" data-mymy="kakao">
      {p.thread ? (
        <>
          <header className="kzth">
            <Back onClick={() => p.onThread("")} />
            <span className="kzname">{p.thread}</span>
            <span className="kzpill">
              <button aria-label="聊天菜单" onClick={() => setMenu(!menu)}>
                <Menu size={21} />
              </button>
            </span>
          </header>
          <div className="msgs kk" ref={scroll}>
            {messages.map((m, i) => {
              const run = messageRun(messages, i);
              return (
                <div
                  key={m.id}
                  className={
                    "kzm " +
                    (m.outgoing ? "kzmy" : "kzot") +
                    (run.first ? " first" : "")
                  }
                >
                  {!m.outgoing && run.first && (
                    <>
                      <div className="kzmav">
                        <Avatar name={m.sender} src={m.avatar} />
                      </div>
                      <div className="kzmn">{m.sender}</div>
                    </>
                  )}
                  {m.outgoing && run.last && (
                    <span className="kzt">
                      {m.meta.unread || ""}
                      <br />
                      {m.time.slice(-5)}
                    </span>
                  )}
                  <button
                    className={"kzbub" + (m.media ? " kzimg" : "")}
                    onClick={() => m.meta.local !== "true" && read(p, m)}
                  >
                    {m.media ? <Media item={m} /> : m.body}
                  </button>
                  {!m.outgoing && run.last && (
                    <span className="kzt">{m.time.slice(-5)}</span>
                  )}
                </div>
              );
            })}
            {!messages.length && <Blank />}
          </div>
          <form
            className="kzinp"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                setSent([
                  ...sent,
                  JSON.stringify([
                    p.thread,
                    draft.trim(),
                    p.virtualTime || "09:41",
                  ]),
                ]);
                setDraft("");
              }
            }}
          >
            <button
              type="button"
              aria-label="添加聊天内容"
              onClick={() => (p.creator ? p.onAdd() : setMenu(!menu))}
            >
              <Plus size={21} />
            </button>
            <input
              aria-label="KKT消息"
              placeholder="输入消息"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Smile size={22} />
            <button
              className={draft.trim() ? "go" : ""}
              aria-label="发送KKT消息"
              disabled={!draft.trim()}
            >
              ↑
            </button>
          </form>
          {menu && (
            <div className="mymy-local-menu">
              <strong>{p.thread}</strong>
              <p>
                群成员：{[...new Set(messages.map((m) => m.sender))].join("、")}
              </p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </>
      ) : (
        <div className="kzkk">
          <div className="kzhd">
            <header className="kzkh">
              <b className="kzti">
                {tab === "好友" ? p.owner || "好友" : "聊天"}
              </b>
              <span className="kzic">
                <button
                  aria-label="搜索聊天"
                  onClick={() => setQuery(query ? "" : " ")}
                >
                  <Search size={21} />
                </button>
                {p.creator && (
                  <button aria-label="新增内容" onClick={p.onAdd}>
                    <Plus />
                  </button>
                )}
                <button aria-label="KKT设置" onClick={() => setMenu(!menu)}>
                  <Settings size={21} />
                </button>
              </span>
            </header>
            <div className="kzkc2">
              {["好友", "聊天"].map((t) => (
                <button
                  key={t}
                  className={
                    "kzkpl " +
                    (t === tab || (t === "为你推荐" && tab === "推荐")
                      ? "on"
                      : "")
                  }
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {query !== "" && (
              <input
                className="mymy-search"
                aria-label="搜索KKT"
                value={query.trimStart()}
                onChange={(e) => setQuery(e.target.value || " ")}
                placeholder="搜索"
              />
            )}
          </div>
          <div className="kzkb">
            <div className="kzksec">
              {tab === "好友" ? "好友" : "全部聊天"} {list.length}
            </div>
            {list
              .filter((g) => g.title.includes(query.trim()))
              .map((g) => {
                const last = g.items.at(-1)!;
                return (
                  <button
                    className="kzkr kzkcr"
                    key={g.title}
                    onClick={() => p.onThread(g.title)}
                  >
                    <Avatar name={last.sender || g.title} src={last.avatar} />
                    <span className="kzkn">
                      <b>{g.title}</b>
                      <small>{tab === "好友" ? last.sender : last.body}</small>
                    </span>
                    <span className="kzkmt">
                      {last.time.slice(-5)}
                      {last.meta.unread && (
                        <i className="kzkbd">{last.meta.unread}</i>
                      )}
                    </span>
                  </button>
                );
              })}
            {!list.length && <Blank />}
          </div>
          <nav className="kzknv">
            {[Users, MessageCircle, Compass, Grid, MoreHorizontal].map(
              (Icon, i) => (
                <button
                  key={i}
                  aria-label={["好友", "聊天", "发现", "更多功能", "设置"][i]}
                  className={(tab === "好友" ? 0 : 1) === i ? "on" : ""}
                  onClick={() =>
                    i < 2 ? setTab(["好友", "聊天"][i]) : setMenu(true)
                  }
                >
                  <Icon />
                </button>
              ),
            )}
          </nav>
          {menu && (
            <div className="mymy-local-menu">
              <strong>KakaoTalk</strong>
              <p>作品内聊天</p>
              <button onClick={() => setMenu(false)}>完成</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export function MymyInstagram(p: SkinProps) {
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "主页"),
    [liked, setLiked] = useSkinState<string[]>(p, "mymyLiked", ["imwinter-carousel-post-01"]),
    [saved, setSaved] = useSkinState<string[]>(p, "mymySaved", []),
    [reposted, setReposted] = useSkinState<string[]>(p, "mymyReposted", []),
    [replies, setReplies] = useSkinState<string[]>(p, "mymyReplies", []),
    [seen, setSeen] = useSkinState<string[]>(p, "mymySeen", []);
  const [reelIndex, setReelIndex] = useState(0),
    [pendingReelIndex, setPendingReelIndex] = useState<number | null>(null),
    [reelLiked, setReelLiked] = useState<string[]>([]),
    [reelSaved, setReelSaved] = useState<string[]>([]),
    [muted, setMuted] = useState(true),
    [playing, setPlaying] = useState(true);
  const reelStageRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [secondCarouselIndex, setSecondCarouselIndex] = useState(0);
  const [thirdCarouselIndex, setThirdCarouselIndex] = useState(0);
  const carouselTouchStart = useRef<number | null>(null);
  const [sheet, setSheet] = useState<Item | null>(null),
    [selected, setSelected] = useState<Item | null>(null),
    [story, setStory] = useState(0),
    [draft, setDraft] = useState(""),
    [pop, setPop] = useState("");
  const sourcePosts = p.items.filter(
      (i) => i.folder !== "私信" && i.meta.story !== "true",
    ),
    stories = p.items.filter((i) => i.meta.story === "true"),
    dms = p.items.filter((i) => i.folder === "私信"),
    active = stories[story - 1];
  const firstCarouselPostId = "imwinter-carousel-post-01";
  const secondCarouselPostId = "imwinter-carousel-post-02";
  const thirdCarouselPostId = "imwinter-carousel-post-03";
  const secondCarouselImages = ["/media/instagram/slide-01.jpg", "/media/instagram/slide-02.jpg", "/media/instagram/slide-03.jpg", "/media/instagram/slide-04.jpg"];
  const secondCarouselCounts = { likes: 1847293, comments: 28641, reposts: 17382, shares: 42816, saves: 31957 };
  const thirdCarouselImages = ["/media/instagram/post-03/slide-01.jpg", "/media/instagram/post-03/slide-02.jpg", "/media/instagram/post-03/slide-03.jpg", "/media/instagram/post-03/slide-04.jpg"];
  const thirdCarouselCounts = { likes: 2376418, comments: 19382, reposts: 29471, shares: 51608, saves: 64729 };
  const thirdCarouselPost = makeItem({ id: thirdCarouselPostId, title: "imwinter", body: "🕶️", time: "1天前", sender: "imwinter", avatar: "/media/instagram/post-01/avatar.jpg", kind: "image", media: thirdCarouselImages[0], likes: thirdCarouselCounts.likes, comments: ["🕶️🕶️🕶️", "너무 예뻐요 🤍", "민정아 사랑해"], meta: { handle: "imwinter", verified: "true", carousel: "true" } });
  const secondCarouselPost = makeItem({ id: secondCarouselPostId, title: "imwinter", body: "🫠", time: "2天前", sender: "imwinter", avatar: "/media/instagram/post-01/avatar.jpg", kind: "image", media: secondCarouselImages[0], likes: secondCarouselCounts.likes, comments: ["너무 예뻐요 🤍", "🫠🫠🫠", "민정아 사랑해"], meta: { handle: "imwinter", verified: "true", carousel: "true" } });
  const firstCarouselImages = [
    "/media/instagram/post-01/slide-01.jpg",
    "/media/instagram/post-01/slide-02.jpg",
    "/media/instagram/post-01/slide-03.jpg",
    "/media/instagram/post-01/slide-04.jpg",
    "/media/instagram/post-01/slide-05.jpg",
    "/media/instagram/post-01/slide-06.jpg",
    "/media/instagram/post-01/slide-07.jpg",
  ];
  const firstCarouselCaptions = [
    "뽀아나",
    "뽀졸려",
    "마주찼다,눈",
    "?",
    "우구구구구구구구구구구궁",
    "교✨감✨",
    "시차이슈",
  ];
  const firstCarouselCounts = {
    likes: 2864000,
    comments: 4769,
    reposts: 55000,
    shares: 62000,
    saves: 73800,
  };
  const firstCarouselPost = makeItem({
    id: firstCarouselPostId,
    title: "imwinter",
    body: firstCarouselCaptions[0],
    time: "5天前",
    sender: "imwinter",
    avatar: "/media/instagram/post-01/avatar.jpg",
    kind: "image",
    media: firstCarouselImages[0],
    likes: firstCarouselCounts.likes,
    comments: [
      "MY: 너무 귀여워요 🥹",
      "MY: 뽀아나 너무 귀여워 🤍",
      "MY: 강아지랑 같이 있는 거 너무 좋아요",
    ],
    meta: { handle: "imwinter", verified: "true", carousel: "true" },
  });
  const posts = [firstCarouselPost, secondCarouselPost, thirdCarouselPost, ...sourcePosts];
  const toggle = (id: string, values: string[], set: (v: string[]) => void) =>
    set(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  const officialAccount = sourcePosts.find((i) => /aespa_official/i.test(i.sender) || /aespa_official/i.test(i.meta.handle || "")) || sourcePosts[0];
  const reelVideos = [
    "/media/reels/ig-reel-01.mp4",
    "/media/reels/ig-reel-02.mp4",
    "/media/reels/ig-reel-03.mp4",
    "/media/reels/ig-reel-05.mp4",
  ];
  const reels: Item[] = officialAccount ? reelVideos.map((media, n) => ({
    ...officialAccount,
    id: "aespa-official-reel-" + (n + 1),
    title: "aespa_official Reel " + (n + 1),
    sender: "aespa_official",
    media,
    kind: "video",
    meta: { ...officialAccount.meta, handle: "aespa_official" },
    body: "",
  })) : [];
  const reel = reels[reelIndex];
  const preloadReel = pendingReelIndex !== null ? reels[pendingReelIndex] : reelIndex < reels.length - 1 ? reels[reelIndex + 1] : reelIndex > 0 ? reels[reelIndex - 1] : undefined;
  const reelMediaItems = [reel, preloadReel].filter((item): item is Item => item !== undefined);
  const reelCounts = (id: string) => {
    const index = Math.max(0, Number(id.split("-").pop()) - 1);
    const counts = [
      { likes: 2240000, comments: 79000, shares: 14000, saves: 15000 },
      { likes: 3180000, comments: 63000, shares: 21000, saves: 27000 },
      { likes: 1470000, comments: 42000, shares: 9800, saves: 18000 },
      { likes: 2670000, comments: 56000, shares: 17300, saves: 32000 },
    ];
    return counts[index % counts.length];
  };
  const shortCount = (n: number) => n >= 10000000 ? (n / 10000000).toFixed(1).replace(/\.0$/, "") + "千万" : n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "万" : String(n);
  const formatIgCount = (n: number) => n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "万" : n.toLocaleString("en-US");
  const attemptReelPlayback = (video: HTMLVideoElement) => {
    const playRequest = video.play();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(() => {
        const activeVideo = reelStageRef.current?.querySelector<HTMLVideoElement>(".ig-reel-video-active");
        if (activeVideo === video) setPlaying(false);
      });
    }
  };
  const finishReelSwitch = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= reels.length) return;
    const stage = reelStageRef.current;
    const targetId = reels[nextIndex].id;
    if (stage) {
      stage.querySelectorAll<HTMLVideoElement>("video[data-reel-id]").forEach((video) => {
        if (video.dataset.reelId !== targetId) video.pause();
      });
      delete stage.dataset.pendingIndex;
    }
    setPendingReelIndex(null);
    setReelIndex(nextIndex);
    setPlaying(true);
  };
  const requestReel = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= reels.length || nextIndex === reelIndex) return;
    const stage = reelStageRef.current;
    const selector = 'video[data-reel-id="' + reels[nextIndex].id + '"]';
    const target = stage?.querySelector<HTMLVideoElement>(selector);
    if (target && target.readyState >= 2) {
      finishReelSwitch(nextIndex);
    } else {
      if (stage) stage.dataset.pendingIndex = String(nextIndex);
      setPendingReelIndex(nextIndex);
      // iOS Safari often ignores preload=auto for the hidden adjacent video.
      // A swipe is a user gesture, so explicitly request playback to start fetching/decoding it.
      if (target) {
        target.muted = true;
        target.playsInline = true;
        attemptReelPlayback(target);
      }
    }
  };
  useEffect(() => {
    if (tab !== "Reels" || !reel) return;
    const activeVideo = reelStageRef.current?.querySelector<HTMLVideoElement>(`video[data-reel-id="${reel.id}"]`);
    if (!activeVideo) return;
    activeVideo.muted = muted;
    if (playing) attemptReelPlayback(activeVideo);
    else activeVideo.pause();
  }, [reelIndex, tab, muted, playing, reel?.id]);

  // A preloaded video can fire canplay just before the swipe sets pendingReelIndex.
  // Re-check readiness after React commits the pending target so upward swipes cannot get stuck.
  useEffect(() => {
    if (tab !== "Reels" || pendingReelIndex === null) return;
    const stage = reelStageRef.current;
    const targetItem = reels[pendingReelIndex];
    if (!stage || !targetItem) return;
    const targetVideo = stage.querySelector<HTMLVideoElement>(
      'video[data-reel-id="' + targetItem.id + '"]',
    );
    if (!targetVideo) return;
    if (targetVideo.readyState >= 2) {
      finishReelSwitch(pendingReelIndex);
      return;
    }
    targetVideo.muted = true;
    targetVideo.playsInline = true;
    attemptReelPlayback(targetVideo);
  }, [pendingReelIndex, reelIndex, tab, reels.length]);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(
      () => setStory((n) => (n < stories.length ? n + 1 : 0)),
      5000,
    );
    return () => clearTimeout(t);
  }, [active, stories.length]);
  const openStory = (i: number) => {
    const m = stories[i];
    setSeen([...new Set([...seen, m.id])]);
    read(p, m);
    setStory(i + 1);
  };
  const openPost = (i: Item) => {
    if (i.id === firstCarouselPostId || i.id === secondCarouselPostId || i.id === thirdCarouselPostId) {
      setSelected(i);
      return;
    }
    if (p.creator || i.password) p.onItem(i);
    else {
      read(p, i);
      setSelected(i);
    }
  };
  const post = (i: Item) => {
    const isFirstCarouselPost = i.id === firstCarouselPostId;
    const isSecondCarouselPost = i.id === secondCarouselPostId;
    const isThirdCarouselPost = i.id === thirdCarouselPostId;
    const isCarouselPost = isFirstCarouselPost || isSecondCarouselPost || isThirdCarouselPost;
    const currentCarouselIndex = isThirdCarouselPost ? thirdCarouselIndex : isSecondCarouselPost ? secondCarouselIndex : carouselIndex;
    const currentCarouselImages = isThirdCarouselPost ? thirdCarouselImages : isSecondCarouselPost ? secondCarouselImages : firstCarouselImages;
    const currentCarouselCounts = isThirdCarouselPost ? thirdCarouselCounts : isSecondCarouselPost ? secondCarouselCounts : firstCarouselCounts;
    const caption = isFirstCarouselPost ? firstCarouselCaptions[carouselIndex] : i.body;
    const carouselImage = currentCarouselImages[currentCarouselIndex];
    return (
      <article className={"igp " + (isCarouselPost ? "ig-first-post" : "")} key={i.id}>
        <header className="igph">
          {isCarouselPost ? (
            <img className="ig-first-avatar" src={i.avatar} alt="" />
          ) : (
            <Avatar name={i.sender} src={i.avatar} />
          )}
          <div className="igpn">
            <button className={isCarouselPost ? "ig-first-userrow" : ""} onClick={() => setTab("个人主页")}>
              <b>{i.sender}</b>
              {isCarouselPost && <BadgeCheck className="ig-first-verified" size={18} fill="#159CF4" color="#FFFFFF" />}
            </button>
            {!isCarouselPost && <small>{i.meta.location || i.time}</small>}
          </div>
          <button aria-label="帖子详情" onClick={() => openPost(i)}>
            <MoreHorizontal />
          </button>
        </header>
        <div
          className="carw"
          onDoubleClick={() => {
            if (!liked.includes(i.id)) setLiked([...liked, i.id]);
            setPop(i.id);
          }}
        >
          {isCarouselPost ? (
            <div
              className="ig-first-carousel"
              onTouchStart={(e) => {
                carouselTouchStart.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const start = carouselTouchStart.current;
                const end = e.changedTouches[0]?.clientX;
                carouselTouchStart.current = null;
                if (start === null || end === undefined) return;
                const delta = end - start;
                if (Math.abs(delta) < 38) return;
                if (isThirdCarouselPost) setThirdCarouselIndex((current) => Math.max(0, Math.min(thirdCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
                else if (isSecondCarouselPost) setSecondCarouselIndex((current) => Math.max(0, Math.min(secondCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
                else setCarouselIndex((current) => Math.max(0, Math.min(firstCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
              }}
            >
              <img
                src={carouselImage}
                alt={caption}
                loading={carouselIndex === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              <span className="ig-first-count">{currentCarouselIndex + 1}/{currentCarouselImages.length}</span>
            </div>
          ) : (
            <Media item={i} />
          )}
          {pop === i.id && (
            <Heart
              className="mymy-heart-pop"
              fill="white"
              onAnimationEnd={() => setPop("")}
            />
          )}
        </div>
        {isCarouselPost && (
          <div className="ig-first-dots" aria-label="贴文图片页码">
            {currentCarouselImages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === currentCarouselIndex ? "active" : ""}
                aria-label={`第${index + 1}张图片`}
                aria-pressed={index === currentCarouselIndex}
                onClick={() => isThirdCarouselPost ? setThirdCarouselIndex(index) : isSecondCarouselPost ? setSecondCarouselIndex(index) : setCarouselIndex(index)}
              />
            ))}
          </div>
        )}
        {isCarouselPost ? (
          <div className="iga ig-first-actions">
            <button aria-label="点赞" aria-pressed={liked.includes(i.id)} onClick={() => toggle(i.id, liked, setLiked)}>
              <Heart fill={liked.includes(i.id) ? "#ff3040" : "none"} color={liked.includes(i.id) ? "#ff3040" : "#111111"} />
              <b>{formatIgCount(currentCarouselCounts.likes + (liked.includes(i.id) ? 1 : 0))}</b>
            </button>
            <button aria-label="评论" onClick={() => setSheet(i)}>
              <MessageCircle />
              <b>{formatIgCount(currentCarouselCounts.comments)}</b>
            </button>
            <button aria-label="转发" aria-pressed={reposted.includes(i.id)} onClick={() => toggle(i.id, reposted, setReposted)}>
              <Repeat2 color={reposted.includes(i.id) ? "#159CF4" : "#111111"} />
              <b>{formatIgCount(currentCarouselCounts.reposts + (reposted.includes(i.id) ? 1 : 0))}</b>
            </button>
            <button aria-label="分享" onClick={() => setTab("私信")}>
              <Send />
              <b>{formatIgCount(currentCarouselCounts.shares)}</b>
            </button>
            <button aria-label="收藏" aria-pressed={saved.includes(i.id)} onClick={() => toggle(i.id, saved, setSaved)}>
              <Bookmark fill={saved.includes(i.id) ? "#111111" : "none"} />
            </button>
          </div>
        ) : (
          <div className="iga">
            <button
              aria-label={"点赞" + i.title}
              aria-pressed={liked.includes(i.id)}
              onClick={() => toggle(i.id, liked, setLiked)}
            >
              <Heart
                fill={liked.includes(i.id) ? "#ff3040" : "none"}
                color={liked.includes(i.id) ? "#ff3040" : "currentColor"}
              />
            </button>
            <button
              aria-label={"评论" + i.title}
              onClick={() => {
                read(p, i);
                setSheet(i);
              }}
            >
              <MessageCircle />
            </button>
            <button aria-label="分享帖子" onClick={() => setTab("私信")}>
              <Send />
            </button>
            <button
              className="mymy-save"
              aria-label={"收藏" + i.title}
              aria-pressed={saved.includes(i.id)}
              onClick={() => toggle(i.id, saved, setSaved)}
            >
              <Bookmark fill={saved.includes(i.id) ? "currentColor" : "none"} />
            </button>
          </div>
        )}
        {!isCarouselPost && <p className="lk2">{i.likes + (liked.includes(i.id) ? 1 : 0)} 次赞</p>}
        <button
          className="igc"
          onClick={() => {
            openPost(i);
          }}
        >
          <b>{i.sender}</b> {caption}
        </button>
        {!isCarouselPost && (
          <button className="cmall" onClick={() => setSheet(i)}>
            查看评论{" "}
            {i.comments.length +
              replies.filter((r) => r.startsWith(i.id + "\t")).length}
          </button>
        )}
        <p className="igt">{isCarouselPost ? (isFirstCarouselPost ? "5天前 · 查看翻译" : "2天前") : i.time}</p>
      </article>
    );
  };
  return (
    <div className="mymy-ui mymy-instagram" data-mymy="instagram">
      <div className="ig">
        <header className="igh">
          <button
            aria-label={selected ? "返回Instagram动态" : "关闭当前App"}
            onClick={() => (selected ? setSelected(null) : p.onBack())}
          >
            <ArrowLeft />
          </button>
          {selected && (selected.id === firstCarouselPostId || selected.id === secondCarouselPostId || selected.id === thirdCarouselPostId) ? (
            <span className="igl2 ig-first-detail-title">
              <b>帖子</b>
              <small>imwinter</small>
            </span>
          ) : (
            <span className="igl2">
              {selected ? "帖子" : tab === "主页" ? "Instagram" : tab}
            </span>
          )}
          {selected && (selected.id === firstCarouselPostId || selected.id === secondCarouselPostId || selected.id === thirdCarouselPostId) ? (
            <span className="ig-first-header-space" aria-hidden="true" />
          ) : (
            <button aria-label="打开私信" onClick={() => setTab("私信")}>
              <Send />
            </button>
          )}
        </header>
        <div className="igb">
          {selected && post(selected)}
          {!selected && tab === "主页" && (
            <>
              <div className="sts">
                {stories.map((s, n) => (
                  <button
                    className="st"
                    key={s.id}
                    onClick={() => openStory(n)}
                  >
                    <span
                      className={"sr on " + (seen.includes(s.id) ? "seen" : "")}
                    >
                      <Avatar name={s.sender} src={s.avatar} />
                    </span>
                    <small>{s.sender}</small>
                  </button>
                ))}
              </div>
              {posts.map(post)}
              {!posts.length && <Blank />}
            </>
          )}
          {!selected && tab === "Reels" && (
            <div className="ig-reels" onTouchStartCapture={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLDivElement).dataset.touchY = String(touch?.clientY ?? 0);
            }} onTouchEndCapture={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const start = Number(el.dataset.touchY ?? NaN);
              const end = e.changedTouches[0]?.clientY;
              delete el.dataset.touchY;
              if (!Number.isFinite(start) || end === undefined) return;
              const delta = end - start;
              if (Math.abs(delta) >= 42 && reels.length) {
                if (delta < 0 && reelIndex < reels.length - 1) requestReel(reelIndex + 1);
                else if (delta > 0 && reelIndex > 0) requestReel(reelIndex - 1);
              }
            }} onTouchCancelCapture={(e) => {
              delete (e.currentTarget as HTMLDivElement).dataset.touchY;
            }} onWheel={(e) => {
              if (Math.abs(e.deltaY) >= 25 && reels.length) {
                if (e.deltaY > 0 && reelIndex < reels.length - 1) requestReel(reelIndex + 1);
                else if (e.deltaY < 0 && reelIndex > 0) requestReel(reelIndex - 1);
              }
            }}>
              {reel ? (
                <>
                  {reel.kind === "video" ? (
                    <div className="ig-reel-video-stage" ref={reelStageRef}>
                      {reelMediaItems.map((item) => {
                        const activeVideo = item.id === reel.id;
                        const finishIfPending = (video: HTMLVideoElement) => {
                          if (video.readyState < 2) return;
                          const stage = reelStageRef.current;
                          const targetIndex = reels.findIndex((candidate) => candidate.id === item.id);
                          if (stage && Number(stage.dataset.pendingIndex) === targetIndex) {
                            finishReelSwitch(targetIndex);
                          }
                        };
                        return <video key={item.id} data-reel-id={item.id} className={"ig-reel-media " + (activeVideo ? "ig-reel-video-active" : "ig-reel-video-preload")} src={item.media} autoPlay={activeVideo && playing} muted={activeVideo ? muted : true} playsInline preload="auto" onLoadedData={(e) => finishIfPending(e.currentTarget)} onCanPlay={(e) => finishIfPending(e.currentTarget)} onEnded={activeVideo ? () => setPlaying(false) : undefined} onError={() => {
                          const failedIndex = reels.findIndex((candidate) => candidate.id === item.id);
                          const stage = reelStageRef.current;
                          if (stage && Number(stage.dataset.pendingIndex) === failedIndex) {
                            delete stage.dataset.pendingIndex;
                            setPendingReelIndex(null);
                          }
                          if (activeVideo) setPlaying(false);
                        }} onClick={activeVideo ? (e) => {
                          const v = e.currentTarget;
                          if (v.paused) { setPlaying(true); attemptReelPlayback(v); } else { v.pause(); setPlaying(false); }
                        } : undefined} />;
                      })}
                    </div>
                  ) : <Media item={reel} className="ig-reel-media" />}
                  <div className="ig-reel-top">
                    <button aria-label="返回动态" onClick={() => setTab("主页")}><ArrowLeft /></button>
                    <strong>Reels</strong>
                    <button aria-label={muted ? "开启声音" : "静音"} onClick={() => setMuted((v) => !v)}>{muted ? <VolumeX /> : <Volume2 />}</button>
                  </div>
                  <div className="ig-reel-actions">
                    <button aria-label="点赞 Reels" onClick={() => toggle(reel.id, reelLiked, setReelLiked)}><Heart fill={reelLiked.includes(reel.id) ? "#ff3040" : "none"} color={reelLiked.includes(reel.id) ? "#ff3040" : "white"} /><small>{shortCount(reelCounts(reel.id).likes + (reelLiked.includes(reel.id) ? 1 : 0))}</small></button>
                    <button aria-label="评论 Reels" onClick={() => setSheet(reel)}><MessageCircle /><small>{shortCount(reelCounts(reel.id).comments)}</small></button>
                    <button aria-label="转发 Reels" onClick={() => setPop("已打开转发选项")}><Repeat2 /><small>{shortCount(reelCounts(reel.id).shares)}</small></button>
                    <button aria-label="分享 Reels" onClick={() => setTab("私信")}><Send /><small>{shortCount(reelCounts(reel.id).shares + 1000)}</small></button>
                    <button aria-label="收藏 Reels" onClick={() => toggle(reel.id, reelSaved, setReelSaved)}><Bookmark fill={reelSaved.includes(reel.id) ? "white" : "none"} /><small>{shortCount(reelCounts(reel.id).saves)}</small></button>
                  </div>
                  <div className="ig-reel-caption">
                    <div className="ig-reel-account"><span className="ig-reel-account-avatar"><img src="/media/reels/aespa-official-avatar.jpg" alt="" /></span><b>@aespa_official</b><BadgeCheck className="ig-reel-verified" size={17} fill="white" /><button onClick={() => setTab("个人主页")}>追踪</button></div>
                    {reel.body && <p>{reel.body}</p>}
                    <small>♪ aespa_official · 原声</small>
                  </div>
                  <div className="ig-reel-progress"><span /></div>
                  <nav className="ig-reel-bottom-nav">{[Home, CirclePlay, Send, Search, User].map((Icon, n) => <button className={n === 1 ? "active" : ""} key={n} aria-label={["主页", "Reels", "私信", "搜索", "个人主页"][n]} onClick={() => { if (n !== 1) setTab(["主页", "Reels", "私信", "搜索", "个人主页"][n]); }}><Icon /></button>)}</nav>
                  {!playing && <div className="ig-reel-paused"><span>▶</span></div>}
                </>
              ) : <div className="ig-reels-empty"><CirclePlay size={44} /><b>Reels</b><span>上传视频内容后会在这里显示</span></div>}
            </div>
          )}
          {!selected && tab === "个人主页" && (
            <>
              <div className="pf">
                <Avatar name={p.owner || "机主"} />
                <div className="ps">
                  <div>
                    <b>{posts.length}</b>
                    <small>帖子</small>
                  </div>
                  <div>
                    <b>—</b>
                    <small>粉丝</small>
                  </div>
                  <div>
                    <b>—</b>
                    <small>关注</small>
                  </div>
                </div>
              </div>
              <p className="pn">{p.owner}</p>
              <div className="ptab">
                <div className="on">
                  <Grid />
                </div>
              </div>
              <div className="pg2">
                {posts.map((i) => (
                  <button key={i.id} onClick={() => openPost(i)}>
                    {i.id === firstCarouselPostId || i.id === secondCarouselPostId || i.id === thirdCarouselPostId ? (
                      <img src={i.id === firstCarouselPostId ? firstCarouselImages[0] : i.id === secondCarouselPostId ? secondCarouselImages[0] : thirdCarouselImages[0]} alt="imwinter carousel post" loading="lazy" />
                    ) : (
                      <Media item={i} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          {!selected && tab === "私信" && (
            <>
              {dms.map((i) => (
                <button className="kzkr" key={i.id} onClick={() => openPost(i)}>
                  <Avatar name={i.sender} src={i.avatar} />
                  <span className="kzkn">
                    <b>{i.title}</b>
                    <small>{i.body}</small>
                  </span>
                </button>
              ))}
              {!dms.length && <Blank />}
            </>
          )}
          {!selected && tab === "搜索" && (
            <>
              <input
                className="mymy-search"
                aria-label="搜索Instagram"
                placeholder="搜索"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              {posts
                .filter((i) => (i.title + i.body + i.sender).includes(draft))
                .map(post)}
            </>
          )}
        </div>
        <nav className="mymy-ig-nav">
          {[Home, CirclePlay, Send, Search, User].map((Icon, n) => (
            <button
              key={n}
              aria-label={["主页", "Reels", "私信", "搜索", "个人主页"][n]}
              aria-pressed={!selected && tab === ["主页", "Reels", "私信", "搜索", "个人主页"][n]}
              onClick={() => {
                setSelected(null);
                setTab(["主页", "Reels", "私信", "搜索", "个人主页"][n]);
                setReelIndex(0);
              }}
            >
              <Icon />
            </button>
          ))}
        </nav>
      </div>
      {sheet && (
        <div className="kzcs">
          <button
            className="kzbk"
            aria-label="关闭评论"
            onClick={() => setSheet(null)}
          />
          <section className="kzsh" role="dialog" aria-label="Instagram评论">
            <div className="mymy-sheet-handle" />
            <header>
              <b>评论</b>
              <button aria-label="关闭评论面板" onClick={() => setSheet(null)}>
                <X />
              </button>
            </header>
            <div className="mymy-comments">
              {[
                ...sheet.comments,
                ...replies
                  .filter((r) => r.startsWith(sheet.id + "\t"))
                  .map((r) => r.split("\t").slice(1).join("\t")),
              ].map((c, n) => (
                <p key={n}>
                  <Avatar name={c.split(":")[0]} />
                  {c}
                </p>
              ))}
            </div>
            <form
              className="cmb2"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  setReplies([...replies, sheet.id + "\t" + draft.trim()]);
                  setDraft("");
                }
              }}
            >
              <input
                aria-label="添加评论"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="添加评论"
                maxLength={500}
              />
              <button>发布</button>
            </form>
          </section>
        </div>
      )}
      {active && (
        <div
          className="mymy-story"
          onPointerDown={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const next =
              e.clientX - box.left < box.width * 0.3 ? story - 1 : story + 1;
            setStory(next > stories.length ? 0 : Math.max(0, next));
          }}
        >
          <div className="mymy-story-bars">
            {stories.map((s, n) => (
              <i key={s.id} className={n < story ? "seen" : ""} />
            ))}
          </div>
          <header>
            <Avatar name={active.sender} src={active.avatar} />
            <b>{active.sender}</b>
            <button
              aria-label="关闭快拍"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setStory(0)}
            >
              <X />
            </button>
          </header>
          <Media item={active} />
          <p>{active.body}</p>
        </div>
      )}
    </div>
  );
}
export function MymyX(p: SkinProps) {
  const [dark, setDark] = useSkinState<boolean>(p, "x-dark", true);
  const [tab, setTab] = useSkinState<string>(p, "mymyTab", "推荐"),
    [likes, setLikes] = useSkinState<string[]>(p, "mymyXLikes", []),
    [reposts, setReposts] = useSkinState<string[]>(p, "mymyXReposts", []),
    [marks, setMarks] = useSkinState<string[]>(p, "mymyXMarks", []),
    [query, setQuery] = useState("");
  const isLiked = (id: string) =>
    typeof p.ui?.["liked-" + id] === "boolean"
      ? Boolean(p.ui["liked-" + id])
      : likes.includes(id);
  const isSaved = (id: string) =>
    typeof p.ui?.["saved-" + id] === "boolean"
      ? Boolean(p.ui["saved-" + id])
      : marks.includes(id);
  const toggle = (id: string, v: string[], set: (x: string[]) => void) =>
    set(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  return (
    <div
      className={"mymy-ui mymy-x " + (dark ? "x-reference-dark" : "")}
      data-mymy="twitter"
    >
      <div className="kzxw">
        <header className="kzxh">
          <button aria-label="关闭当前App" onClick={p.onBack}>
            <ArrowLeft />
          </button>
          <div className="kzxlg">𝕏</div>
          <button aria-label="切换X外观" onClick={() => setDark(!dark)}>
            <User />
          </button>
        </header>
        <div className="kzxtb">
          {["为你推荐", "正在关注", "添加 +", "时间"].map((t) => (
            <button
              className={t === tab ? "on" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "搜索" && (
          <input
            className="mymy-search"
            aria-label="搜索X"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索"
          />
        )}
        <div className="kzxfd">
          {p.items
            .filter((i) => (i.title + i.body).includes(query))
            .map((i) => (
              <article className="kzxt" key={i.id}>
                <Avatar name={i.sender} src={i.avatar} />
                <div className="kzxb">
                  <div className="kzxn">
                    <b>{i.sender}</b>
                    <small>
                      @{i.meta.handle || "user"} · {i.time.slice(-5)}
                    </small>
                    <em>
                      <MoreHorizontal size={18} />
                    </em>
                  </div>
                  <button
                    className="kzxx"
                    onClick={() => {
                      read(p, i);
                      p.onItem(i);
                    }}
                  >
                    {i.body}
                  </button>
                  {i.media && (
                    <button
                      className="kzxv"
                      aria-label="打开媒体"
                      onClick={() => p.onItem(i)}
                    >
                      <Media item={i} />
                    </button>
                  )}
                  <div className="kzxac">
                    <button
                      aria-label={"评论" + i.title}
                      onClick={() => p.onItem(i)}
                    >
                      <MessageCircle />
                      {i.comments.length}
                    </button>
                    <button
                      aria-label={"转发" + i.title}
                      aria-pressed={reposts.includes(i.id)}
                      onClick={() => toggle(i.id, reposts, setReposts)}
                    >
                      <Repeat2 />
                      {reposts.includes(i.id) ? 1 : 0}
                    </button>
                    <button
                      aria-label={"点赞" + i.title}
                      aria-pressed={isLiked(i.id)}
                      onClick={() => {
                        toggle(i.id, likes, setLikes);
                        p.onUi?.("liked-" + i.id, !isLiked(i.id));
                      }}
                    >
                      <Heart fill={isLiked(i.id) ? "#f91880" : "none"} />
                      {i.likes + (isLiked(i.id) ? 1 : 0)}
                    </button>
                    <span>
                      <BarChart2 />
                      {i.meta.views || "—"}
                    </span>
                    <button
                      aria-label={"收藏" + i.title}
                      aria-pressed={isSaved(i.id)}
                      onClick={() => {
                        toggle(i.id, marks, setMarks);
                        p.onUi?.("saved-" + i.id, !isSaved(i.id));
                      }}
                    >
                      <Bookmark />
                    </button>
                    <button aria-label="分享" onClick={() => p.onItem(i)}>
                      <Share />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          {!p.items.length && <Blank />}
        </div>
        <nav className="kzxnav">
          {[Home, Search, Bell, MessageCircle].map((Icon, n) => (
            <button
              key={n}
              aria-label={["时间线", "搜索", "通知", "私信"][n]}
              onClick={() => n < 2 && setTab(n ? "搜索" : "推荐")}
              disabled={n > 1}
            >
              <Icon />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
