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

// These are the exact three replies the player checked in the prior rehearsal.
// Reuse them in the native reply tray instead of inventing a fresh candidate list.
const KKT_CONFIRMED_REPLY_OPTIONS = [
  ["그럼 내가 맛있는 거 준비해 놓고 기다릴게. 너무 무리하지 말고 와.", "那我就准备好吃的等你回来。别太勉强自己，慢慢来。"],
  ["자기 먹고 싶은 걸로 준비해 줄게. 오늘 고생했으니까 집에 와서는 편하게 있어.", "我给你准备你想吃的。今天辛苦了，回家以后就好好放松吧。"],
  ["알겠어, 걱정 마. 내가 기다리고 있을 테니까 일 마무리 잘하고 와.", "好啦，别担心。我会等你的，你安心把工作处理好再回来。"],
] as const;
const KKT_STORY_ROUNDS = [
  {
    time: "20:17",
    npc: [["아직 안 잤어?", "还没睡？"]],
    choices: [],
  },
  {
    time: "20:17",
    npc: [["나 오늘 집에 좀 늦게 들어갈 것 같아.", "我今天可能会晚点回家。"]],
    choices: [],
  },
  {
    time: "20:19",
    npc: [
      ["음… 아마 열한 시쯤?", "嗯……大概十一点左右？"],
      ["아직 마무리할 게 조금 남았어.", "还有一点事情要收尾。"],
      ["너무 늦으면 먼저 자도 돼.", "如果太晚的话，你可以先睡。"],
    ],
    choices: [],
  },
  {
    time: "20:20",
    npc: [
      ["음… 따뜻한 거 먹고 싶어.", "嗯……我想吃点热乎的。"],
      ["네가 해 주는 거면 아무거나 좋아.", "只要是你做的，什么都好。"],
      ["근데 너무 무리하지는 마. 나 때문에 늦게까지 기다리거나 요리하지 말고.", "不过别太勉强自己。别因为我就一直等到很晚，也别特意熬夜做饭。"],
    ],
    choices: [
      ["그럼 내가 맛있는 거 준비해 놓고 기다릴게. 너무 무리하지 말고 와.", "那我就准备好吃的等你回来。别太勉强自己，慢慢来。"],
      ["자기 먹고 싶은 걸로 준비해 줄게. 오늘 고생했으니까 집에 와서는 편하게 있어.", "我给你准备你想吃的。今天辛苦了，回家以后就好好放松吧。"],
      ["알겠어, 걱정 마. 내가 기다리고 있을 테니까 일 마무리 잘하고 와.", "好啦，别担心。我会等你的，你安心把工作处理好再回来。"],
    ],
  },
  {
    time: "20:22",
    npc: [
      ["뭐야, 이렇게 다정하게 말하면 진짜 빨리 집에 가고 싶어지잖아.", "干嘛呀，你这样温柔地跟我说话，我真的会越来越想早点回家嘛。"],
      ["오늘만 조금 더 기다려 줘. 끝나는 대로 바로 갈게.", "今天再稍微等我一下嘛。我一忙完就马上回去。"],
      ["집에 가면 {{playerId}} 옆에 붙어 있을래. 오늘은 좀 많이 안아 줘.", "回家以后我要一直黏在{{playerId}}身边。今天要多抱抱我。"],
    ],
    choices: [],
  },
] as const;
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
    [storyStep, setStoryStep] = useSkinState<number>(p, "mymyKktNativeStoryStepV1", 0),
    [readThreads, setReadThreads] = useSkinState<string[]>(p, "mymyKktReadThreadsV1", []),
    [draft, setDraft] = useState(""),
    [selectedZh, setSelectedZh] = useState(""),
    [candidateOpen, setCandidateOpen] = useState(false),
    [npcTyping, setNpcTyping] = useState(false),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false);
  const sentRef = useRef(sent);
  const deliveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { sentRef.current = sent; }, [sent]);
  useEffect(() => () => {
    if (deliveryTimer.current) clearTimeout(deliveryTimer.current);
  }, []);
  const markThreadRead = (title: string) => {
    if (!readThreads.includes(title)) setReadThreads([...readThreads, title]);
  };
  useEffect(() => {
    if (p.thread) markThreadRead(p.thread);
  }, [p.thread]);
  const unreadCount = (group: { title: string; items: Item[] }) => {
    if (readThreads.includes(group.title)) return 0;
    return group.items.reduce((total, item) => {
      if (item.outgoing || item.read || !item.meta.unread) return total;
      const n = Number(item.meta.unread);
      return total + (Number.isFinite(n) && n > 0 ? n : 1);
    }, 0);
  };
  const list = grouped(p.items).sort(
      (a, b) => Number(b.title === "金旼炡") - Number(a.title === "金旼炡"),
    ),
    messages = [
      ...p.items.filter((i) => i.title === p.thread),
      ...sent.flatMap((raw, index) => {
        try {
          const entry: unknown = JSON.parse(raw);
          if (
            !Array.isArray(entry) ||
            (entry.length !== 3 && entry.length !== 5) ||
            !entry.every((v) => typeof v === "string") ||
            entry[0] !== p.thread
          )
            return [];
          const role = entry.length >= 4 ? entry[3] : "owner";
          const outgoing = role !== "npc";
          return [
            makeItem({
              id: "local-kkt-" + index,
              title: entry[0],
              body: entry[1],
              time: entry[2],
              sender: outgoing ? (p.playerId || p.owner || "机主") : "金旼炡",
              outgoing,
              meta: {
                local: "true",
                translation: entry.length >= 5 ? entry[4] : "",
              },
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
            <span className={"kzname" + (npcTyping ? " kzname-typing" : "")}>{npcTyping ? "正在输入中…" : p.thread}</span>
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
                    {m.media ? <Media item={m} /> : <span className="kkt-korean">{m.body}</span>}
                    {m.meta.translation ? <small className="kkt-translation">{m.meta.translation}</small> : null}
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
              if (!draft.trim()) return;
              const time = KKT_STORY_ROUNDS[storyStep]?.time || p.virtualTime || "20:17";
              const outgoing = JSON.stringify([p.thread, draft.trim(), time, "owner", selectedZh || ""]);
              const next = [...sentRef.current, outgoing];
              sentRef.current = next;
              setSent(next);
              setDraft("");
              setSelectedZh("");
              setCandidateOpen(false);
              if (p.thread === "金旼炡") {
                const nextStep = storyStep + 1;
                const nextRound = KKT_STORY_ROUNDS[nextStep];
                setStoryStep(Math.min(nextStep, KKT_STORY_ROUNDS.length));
                if (nextRound?.npc.length) {
                  setNpcTyping(true);
                  let index = 0;
                  const deliverOne = () => {
                    const entry = nextRound.npc[index++];
                    if (!entry) { setNpcTyping(false); return; }
                    const [ko, zh] = entry;
                    const npcEntry = JSON.stringify([
                      p.thread,
                      ko.replaceAll("{{playerId}}", p.playerId || "你"),
                      nextRound.time,
                      "npc",
                      zh.replaceAll("{{playerId}}", p.playerId || "你"),
                    ]);
                    const updated = [...sentRef.current, npcEntry];
                    sentRef.current = updated;
                    setSent(updated);
                    if (index < nextRound.npc.length) {
                      deliveryTimer.current = setTimeout(deliverOne, 950);
                    } else {
                      deliveryTimer.current = setTimeout(() => setNpcTyping(false), 500);
                    }
                  };
                  deliveryTimer.current = setTimeout(deliverOne, 700);
                }
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
              placeholder={npcTyping ? "正在输入中…" : p.thread === "金旼炡" && (KKT_STORY_ROUNDS[storyStep]?.choices.length || 0) > 0 ? "点击选择一条回复" : "输入消息"}
              value={draft}
              maxLength={2000}
              readOnly={p.thread === "金旼炡" || npcTyping}
              onPointerDown={(e) => {
                if (p.thread !== "金旼炡") return;
                // Never focus the real input on iOS Safari: opening the native
                // keyboard changes the visual viewport and makes the phone jump.
                e.preventDefault();
                if (!npcTyping) setCandidateOpen((open) => !open);
              }}
              onFocus={(e) => {
                if (p.thread === "金旼炡") {
                  setCandidateOpen(true);
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                setDraft(e.target.value);
                setSelectedZh("");
              }}
            />
            <Smile size={22} />
            <button
              className={draft.trim() ? "go" : ""}
              aria-label="发送KKT消息"
              disabled={!draft.trim() || npcTyping}
            >
              发送
            </button>
          </form>
          {p.thread === "金旼炡" && candidateOpen && !npcTyping && (
            <section className="kkt-choice-panel" aria-label="剧情回复选项">
              {(KKT_STORY_ROUNDS[storyStep]?.choices?.length
                ? KKT_STORY_ROUNDS[storyStep].choices
                : KKT_CONFIRMED_REPLY_OPTIONS
              ).map(([ko, zh]) => (
                <button
                  type="button"
                  className={"kkt-choice" + (draft === ko ? " selected" : "")}
                  key={ko}
                  onClick={() => { setDraft(ko); setSelectedZh(zh.replaceAll("{{playerId}}", p.playerId || "你")); }}
                >
                  <span>{ko}</span>
                  <small>{zh.replaceAll("{{playerId}}", p.playerId || "你")}</small>
                </button>
              ))}
            </section>
          )}
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
                    onClick={() => { markThreadRead(g.title); p.onThread(g.title); }}
                  >
                    <Avatar name={g.title} src={last.avatar} />
                    <span className="kzkn">
                      <b>{g.title}</b>
                      <small>{tab === "好友" ? last.sender : last.body}</small>
                    </span>
                    <span className="kzkmt">
                      {last.time.slice(-5)}
                      {unreadCount(g) > 0 && (
                        <i className="kzkbd" aria-label={unreadCount(g) + "条未读消息"}>{unreadCount(g)}</i>
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
    [reelLiked, setReelLiked] = useState<string[]>([]),
    [reelSaved, setReelSaved] = useState<string[]>([]),
    [muted, setMuted] = useState(true),
    [playing, setPlaying] = useState(true);
  const reelStageRef = useRef<HTMLDivElement | null>(null);
  const lastReelSwipeAt = useRef(0);
  const lastReelNavigationAt = useRef(0);
  const reelRecoveryCount = useRef<Record<string, number>>({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [secondCarouselIndex, setSecondCarouselIndex] = useState(0);
  const [thirdCarouselIndex, setThirdCarouselIndex] = useState(0);
  const [fourthCarouselIndex, setFourthCarouselIndex] = useState(0);
  const [reelSwipeDirection, setReelSwipeDirection] = useState<"next" | "previous">("next");
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
  const fourthCarouselPostId = "imwinter-carousel-post-04";
  const secondCarouselImages = ["/media/instagram/slide-01.jpg?v=20261027-q26", "/media/instagram/slide-02.jpg?v=20261027-q26", "/media/instagram/slide-03.jpg?v=20261027-q26", "/media/instagram/slide-04.jpg?v=20261027-q26"];
  const secondCarouselCounts = { likes: 1847293, comments: 28641, reposts: 17382, shares: 42816, saves: 31957 };
  const thirdCarouselImages = ["/media/instagram/post-03/slide-01.jpg?v=20261027-q26", "/media/instagram/post-03/slide-02.jpg?v=20261027-q26", "/media/instagram/post-03/slide-03.jpg?v=20261027-q26", "/media/instagram/post-03/slide-04.jpg?v=20261027-q26"];
  const thirdCarouselCounts = { likes: 2376418, comments: 19382, reposts: 29471, shares: 51608, saves: 64729 };
  const fourthCarouselImages = ["/media/instagram/post-04/slide-01.jpg?v=20261027-q26", "/media/instagram/post-04/slide-02.jpg?v=20261027-q26", "/media/instagram/post-04/slide-03.jpg?v=20261027-q26", "/media/instagram/post-04/slide-04.jpg?v=20261027-q26", "/media/instagram/post-04/slide-05.jpg?v=20261027-q26", "/media/instagram/post-04/slide-06.jpg?v=20261027-q26"];
  const fourthCarouselCounts = { likes: 1965832, comments: 24817, reposts: 21864, shares: 39725, saves: 58241 };
  const fourthCarouselPost = makeItem({ id: fourthCarouselPostId, title: "imwinter", body: "🌻", time: "1天前", sender: "imwinter", avatar: "/media/instagram/post-01/avatar.jpg", kind: "image", media: fourthCarouselImages[0], likes: fourthCarouselCounts.likes, comments: ["🌻🌻🌻", "너무 예뻐요 🤍", "민정아 사랑해"], meta: { handle: "imwinter", verified: "true", carousel: "true" } });
  const thirdCarouselPost = makeItem({ id: thirdCarouselPostId, title: "imwinter", body: "🕶️", time: "1天前", sender: "imwinter", avatar: "/media/instagram/post-01/avatar.jpg", kind: "image", media: thirdCarouselImages[0], likes: thirdCarouselCounts.likes, comments: ["🕶️🕶️🕶️", "너무 예뻐요 🤍", "민정아 사랑해"], meta: { handle: "imwinter", verified: "true", carousel: "true" } });
  const secondCarouselPost = makeItem({ id: secondCarouselPostId, title: "imwinter", body: "🫠", time: "2天前", sender: "imwinter", avatar: "/media/instagram/post-01/avatar.jpg", kind: "image", media: secondCarouselImages[0], likes: secondCarouselCounts.likes, comments: ["너무 예뻐요 🤍", "🫠🫠🫠", "민정아 사랑해"], meta: { handle: "imwinter", verified: "true", carousel: "true" } });
  const firstCarouselImages = [
    "/media/instagram/post-01/slide-01.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-02.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-03.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-04.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-05.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-06.jpg?v=20261027-q26",
    "/media/instagram/post-01/slide-07.jpg?v=20261027-q26",
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
  const posts = [firstCarouselPost, secondCarouselPost, thirdCarouselPost, fourthCarouselPost, ...sourcePosts];
  const toggle = (id: string, values: string[], set: (v: string[]) => void) =>
    set(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  const officialAccount = sourcePosts.find((i) => /aespa_official/i.test(i.sender) || /aespa_official/i.test(i.meta.handle || "")) || sourcePosts[0] || makeItem({
    id: "aespa-official-reel-source",
    title: "aespa_official",
    body: "",
    time: "1天前",
    sender: "aespa_official",
    avatar: "/media/reels/aespa-official-avatar.jpg",
    kind: "video",
    meta: { handle: "aespa_official", verified: "true" },
  });
  const reelVideos = [
    "/media/reels/ig-reel-01.mp4?v=20261027-q26-video",
    "/media/reels/ig-reel-02.mp4?v=20261027-q26-video",
    "/media/reels/ig-reel-03.mp4?v=20261027-q26-video",
    "/media/reels/ig-reel-05.mp4?v=20261027-q26-video",
  ];
  const reelComments = [
    ["무대 너무 좋아요 🤍", "aespa 최고야", "이 영상 계속 보게 돼요"],
    ["민정이 너무 예뻐요 🫶", "aespa 사랑해", "이 조합 최고"],
    ["완전 레전드", "너무 멋있어 🔥", "계속 돌려보는 중"],
    ["🌻🌻🌻", "너무 예뻐요 🤍", "aespa 최고"],
  ];
  const reels: Item[] = reelVideos.map((media, n) => ({
    ...officialAccount,
    id: "aespa-official-reel-" + (n + 1),
    title: "aespa_official Reel " + (n + 1),
    sender: "aespa_official",
    avatar: "/media/reels/aespa-official-avatar.jpg",
    media,
    kind: "video",
    likes: [2240000, 3180000, 1470000, 2670000][n],
    comments: reelComments[n],
    meta: { ...officialAccount.meta, handle: "aespa_official", verified: "true" },
    body: "",
  }));
  const reel = reels[reelIndex];
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
    // iPhone Safari is most reliable with inline muted playback set before play().
    video.playsInline = true;
    video.muted = muted;
    try {
      const result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(() => {
          // Keep the player ready to retry on loadeddata/canplay or an explicit tap.
        });
      }
    } catch {
      // A media readiness event or an explicit tap can retry playback.
    }
  };

  const requestReel = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= reels.length || nextIndex === reelIndex) return;
    const now = Date.now();
    if (now - lastReelNavigationAt.current < 280) return;
    lastReelNavigationAt.current = now;
    setReelSwipeDirection(nextIndex > reelIndex ? "next" : "previous");
    setPlaying(true);
    setReelIndex(nextIndex);
  };

  // Keep playback controls separate from media disposal. On iOS Safari, changing
  // tabs can leave the previous decoder alive unless its source is explicitly released.
  useEffect(() => {
    if (tab !== "Reels" || !reel) return;
    const video = reelStageRef.current?.querySelector<HTMLVideoElement>("video[data-reel-id]");
    if (!video) return;
    video.playsInline = true;
    video.muted = muted;
    if (playing) attemptReelPlayback(video);
    else video.pause();
  }, [reelIndex, tab, muted, playing, reel?.id]);

  useEffect(() => {
    if (tab !== "Reels" || !reel) return;
    const video = reelStageRef.current?.querySelector<HTMLVideoElement>("video[data-reel-id]");
    if (!video) return;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [tab, reelIndex, reel?.id]);

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
    if (i.id === firstCarouselPostId || i.id === secondCarouselPostId || i.id === thirdCarouselPostId || i.id === fourthCarouselPostId) {
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
    const isFourthCarouselPost = i.id === fourthCarouselPostId;
    const isCarouselPost = isFirstCarouselPost || isSecondCarouselPost || isThirdCarouselPost || isFourthCarouselPost;
    const currentCarouselIndex = isFourthCarouselPost ? fourthCarouselIndex : isThirdCarouselPost ? thirdCarouselIndex : isSecondCarouselPost ? secondCarouselIndex : carouselIndex;
    const currentCarouselImages = isFourthCarouselPost ? fourthCarouselImages : isThirdCarouselPost ? thirdCarouselImages : isSecondCarouselPost ? secondCarouselImages : firstCarouselImages;
    const currentCarouselCounts = isFourthCarouselPost ? fourthCarouselCounts : isThirdCarouselPost ? thirdCarouselCounts : isSecondCarouselPost ? secondCarouselCounts : firstCarouselCounts;
    const caption = isFirstCarouselPost ? firstCarouselCaptions[carouselIndex] : i.body;
    const carouselImage = currentCarouselImages[currentCarouselIndex];
    return (
      <article className={"igp " + (isCarouselPost ? "ig-first-post" : "")} key={i.id}>
        <header className="igph">
          {isCarouselPost ? (
            <img className="ig-first-avatar" src={i.avatar} loading="lazy" decoding="async" alt="" />
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
                if (isFourthCarouselPost) setFourthCarouselIndex((current) => Math.max(0, Math.min(fourthCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
                else if (isThirdCarouselPost) setThirdCarouselIndex((current) => Math.max(0, Math.min(thirdCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
                else if (isSecondCarouselPost) setSecondCarouselIndex((current) => Math.max(0, Math.min(secondCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
                else setCarouselIndex((current) => Math.max(0, Math.min(firstCarouselImages.length - 1, current + (delta < 0 ? 1 : -1))));
              }}
            >
              <img
                src={carouselImage}
                alt={caption}
                loading="lazy"
                decoding="async"
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
                onClick={() => isFourthCarouselPost ? setFourthCarouselIndex(index) : isThirdCarouselPost ? setThirdCarouselIndex(index) : isSecondCarouselPost ? setSecondCarouselIndex(index) : setCarouselIndex(index)}
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
        <p className="igt">{isCarouselPost ? (isFirstCarouselPost ? "5天前 · 查看翻译" : isSecondCarouselPost ? "2天前" : "1天前") : i.time}</p>
      </article>
    );
  };
  return (
    <div className="mymy-ui mymy-instagram" data-mymy="instagram">
      <div className="ig">
        <header className={"igh" + (!selected && tab === "搜索" ? " ig-search-header-hidden" : "")}>
          <button
            aria-label={selected ? "返回Instagram动态" : "关闭当前App"}
            onClick={() => (selected ? setSelected(null) : p.onBack())}
          >
            <ArrowLeft />
          </button>
          {selected && (selected.id === firstCarouselPostId || selected.id === secondCarouselPostId || selected.id === thirdCarouselPostId || selected.id === fourthCarouselPostId) ? (
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
              const el = e.currentTarget as HTMLDivElement;
              el.dataset.touchY = String(touch?.clientY ?? 0);
              el.dataset.touchX = String(touch?.clientX ?? 0);
            }} onTouchEndCapture={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const start = Number(el.dataset.touchY ?? NaN);
              const startX = Number(el.dataset.touchX ?? NaN);
              const endTouch = e.changedTouches[0];
              const end = endTouch?.clientY;
              const endX = endTouch?.clientX;
              delete el.dataset.touchY;
              delete el.dataset.touchX;
              if (!Number.isFinite(start) || !Number.isFinite(startX) || end === undefined || endX === undefined) return;
              const delta = end - start;
              const deltaX = endX - startX;
              if (Math.abs(delta) >= 48 && Math.abs(delta) > Math.abs(deltaX) * 1.15 && reels.length) {
                if (delta < 0 && reelIndex < reels.length - 1) {
                  lastReelSwipeAt.current = Date.now();
                  requestReel(reelIndex + 1);
                } else if (delta > 0 && reelIndex > 0) {
                  lastReelSwipeAt.current = Date.now();
                  requestReel(reelIndex - 1);
                }
              }
            }} onTouchCancelCapture={(e) => {
              delete (e.currentTarget as HTMLDivElement).dataset.touchY;
              delete (e.currentTarget as HTMLDivElement).dataset.touchX;
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
                      <video
                        key={reel.id}
                        data-reel-id={reel.id}
                        className={"ig-reel-media ig-reel-video-active " + (reelSwipeDirection === "next" ? "ig-reel-enter-next" : "ig-reel-enter-previous")}
                        src={reel.media}
                        autoPlay={playing}
                        muted={muted}
                        playsInline
                        preload="metadata"
                        onCanPlay={(e) => {
                          const video = e.currentTarget;
                          if (tab === "Reels" && playing && video.paused) attemptReelPlayback(video);
                        }}
                        onEnded={() => setPlaying(false)}
                        onError={(e) => {
                          const failedVideo = e.currentTarget;
                          const attempts = reelRecoveryCount.current[reel.id] ?? 0;
                          if (attempts < 1 && tab === "Reels") {
                            reelRecoveryCount.current[reel.id] = attempts + 1;
                            window.setTimeout(() => {
                              if (reelStageRef.current?.querySelector("video[data-reel-id]") === failedVideo && tab === "Reels") {
                                failedVideo.load();
                                if (playing) attemptReelPlayback(failedVideo);
                              }
                            }, 250);
                          }
                        }}
                        onClick={(e) => {
                          if (Date.now() - lastReelSwipeAt.current < 450) return;
                          const video = e.currentTarget;
                          if (video.paused) {
                            setPlaying(true);
                            attemptReelPlayback(video);
                          } else {
                            video.pause();
                            setPlaying(false);
                          }
                        }}
                      />
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
                    <div className="ig-reel-account"><span className="ig-reel-account-avatar"><img src="/media/reels/aespa-official-avatar.jpg" loading="lazy" decoding="async" alt="" /></span><b>@aespa_official</b><BadgeCheck className="ig-reel-verified" size={17} fill="white" /><button onClick={() => setTab("个人主页")}>追踪</button></div>
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
            <section className="ig-profile-settings">
              <div className="pf">
                <Avatar name={p.owner || "机主"} />
                <div className="ps">
                  <div><b>0</b><small>帖子</small></div>
                  <div><b>—</b><small>粉丝</small></div>
                  <div><b>—</b><small>关注</small></div>
                </div>
              </div>
              <p className="ig-profile-hint">{p.owner || "机主"}</p>
            </section>
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
              <div className="ig-explore-search-row">
                <label className="ig-explore-search">
                  <Search size={22} aria-hidden="true" />
                  <input
                    aria-label="搜索Instagram"
                    placeholder="搜索"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <span className="ig-explore-bookmark" aria-hidden="true">
                  <Bookmark size={27} />
                </span>
              </div>

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
