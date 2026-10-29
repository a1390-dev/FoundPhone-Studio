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
  RefreshCw,
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
type InstagramFanDm = {
  id: string;
  handle: string;
  text: string;
  translation: string;
  category: "support" | "critical" | "curious" | "passerby";
};
type InstagramFanDmReply = {
  id: string;
  threadId: string;
  handle: string;
  text: string;
  translation: string;
  role: "player" | "npc";
};
function parseInstagramFanDm(raw: string): InstagramFanDm | null {
  try {
    const value = JSON.parse(raw) as Partial<InstagramFanDm>;
    if (typeof value.id === "string" && typeof value.handle === "string" &&
      typeof value.text === "string" && typeof value.translation === "string" &&
      typeof value.category === "string") return value as InstagramFanDm;
  } catch { /* Ignore invalid stored message rows. */ }
  return null;
}
function parseInstagramFanDmReply(raw: string): InstagramFanDmReply | null {
  try {
    const value = JSON.parse(raw) as Partial<InstagramFanDmReply>;
    if (typeof value.id === "string" && typeof value.threadId === "string" &&
      typeof value.handle === "string" && typeof value.text === "string" &&
      typeof value.role === "string") return value as InstagramFanDmReply;
  } catch { /* Ignore invalid stored replies. */ }
  return null;
}
const IG_FAN_DM_RESPONSES: Record<InstagramFanDm["category"], Array<{ text: string; translation: string }>> = {
  support: [
    { text: "답장해 줘서 고마워요. 너무 혼자 감당하지 않았으면 해요.", translation: "谢谢你回复我，希望你不要一个人承受太多。" },
    { text: "괜히 참견한 건 아닌가 걱정했는데 다행이에요.", translation: "我还担心自己是不是多管闲事了，听你这么说就好。" },
    { text: "오늘은 댓글보다 편한 사람들과 함께 있어요.", translation: "今天比起看评论，还是和让你放松的人待在一起吧。" },
    { text: "응원한다는 말은 꼭 전하고 싶었어요. 힘내요 🤍", translation: "我说句实话：还是想把支持你的话传达给你，加油 🤍" },
    { text: "저도 너무 단정 짓지 않으려고 해요. 잘 지나가길 바라요.", translation: "我也不想妄下结论，希望这件事能顺利过去。" },
  ],
  critical: [
    { text: "그냥 온라인 반응이 과열된 것 같아서 한 말이에요.", translation: "我只是觉得网上的反应太过火了，才这么说。" },
    { text: "제 말이 불편했다면 미안해요. 그래도 추측은 조심했으면 해요.", translation: "如果我的话让你不舒服，对不起。但还是希望大家谨慎猜测。" },
    { text: "저도 더 알아보지 않고 말 얹은 건 아닌지 생각 중이에요.", translation: "我说句实话：我也在想自己是不是没弄清楚就跟着评论了。" },
    { text: "누굴 비난하려는 건 아니고 이 분위기가 부담스럽다는 뜻이에요.", translation: "我不是想责怪谁，只是觉得这种氛围让人有压力。" },
    { text: "알겠어요. 사진만 보고 확실하다고 말하긴 어렵겠네요.", translation: "知道了。确实不能只看照片就说事情已经确定。" },
  ],
  curious: [
    { text: "자세히 말하기 곤란하면 대답 안 해도 괜찮아요.", translation: "如果不方便说得太详细，不回答也没关系。" },
    { text: "아, 저는 처음 올라온 글이 진짜 기사인 줄 알았어요.", translation: "我说句实话：啊，我还以为最早那条是正式新闻。" },
    { text: "그럼 아직 확인된 건 없다고 보면 되는 거죠?", translation: "那可以理解为目前还没有任何确认的信息，对吧？" },
    { text: "답장 고마워요. 더 퍼뜨리기보다는 기다려 볼게요.", translation: "谢谢回复。我不会继续传播，先等等看吧。" },
    { text: "저도 타임라인만 보고는 잘 모르겠네요. 얘기가 계속 바뀌어요.", translation: "我看时间线也弄不清楚，大家的说法一直在变。" },
  ],
  passerby: [
    { text: "아 그렇군요. 괜히 궁금해서 메시지했네요, 미안해요.", translation: "我说句实话：原来如此。我只是好奇才发消息的，不好意思。" },
    { text: "답장해 줘서 고마워요. 오늘 인터넷이 정말 시끄럽네요.", translation: "谢谢回复，今天网上确实特别吵。" },
    { text: "저는 이제 그만 보고 다른 일 하러 갈게요. 좋은 하루 보내요.", translation: "我不再看了，去忙别的事啦，祝你今天顺利。" },
    { text: "이런 일은 당사자끼리 잘 정리되길 바라는 게 제일이겠어요.", translation: "这种事还是希望当事人能好好处理吧。" },
    { text: "괜히 더 시끄럽게 만들 생각은 없어요. 조심히 지내요.", translation: "我说句实话：我没有想把事情闹得更大，照顾好自己。" },
  ],
};

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

// Exact dialogue and player choices transcribed from the user's current story screenshots.
const KKT_RETURN_TIME_OPTIONS = [
  ["몇 시쯤 들어올 것 같아?", "你大概几点回来？"],
  ["늦으면 몇 시쯤 될 것 같아?", "如果晚的话，大概会到几点？"],
  ["집에 오는 시간 정해지면 알려 줄래?", "确定什么时候回家之后，可以告诉我吗？"],
] as const;
const KKT_NIGHT_SNACK_OPTIONS = [
  ["열한 시에 오면 같이 야식 먹을까?", "如果你十一点回来，我们要不要一起吃夜宵？"],
  ["내가 뭐 준비해 놓을까? 먹고 싶은 거 있어?", "要不要我提前准备点吃的？你想吃什么？"],
  ["밥은 먹었어? 뭐 드시고 싶으세요?", "你吃饭了吗？有什么想吃的吗？"],
] as const;
const KKT_CONFIRMED_REPLY_OPTIONS = [
  ["그럼 내가 맛있는 거 준비해 놓고 기다릴게. 너무 무리하지 말고 와.", "那我就准备好吃的等你回来。别太勉强自己，慢慢来。"],
  ["자기 먹고 싶은 걸로 준비해 줄게. 오늘 고생했으니까 집에 와서는 편하게 있어.", "我给你准备你想吃的。今天辛苦了，回家以后就好好放松吧。"],
  ["알겠어, 걱정 마. 내가 기다리고 있을 테니까 일 마무리 잘하고 와.", "好啦，别担心。我会等你的，你安心把工作处理好再回来。"],
] as const;

const KKT_STORY_ROUNDS = [
  {
    // The opening question already exists in the story template. After this
    // follow-up arrives, the player can ask when she will be home.
    time: "20:17",
    npc: [],
    choices: KKT_RETURN_TIME_OPTIONS,
  },
  {
    time: "20:19",
    npc: [
      ["음… 아마 열한 시쯤?", "嗯……大概十一点左右？"],
      ["아직 마무리할 게 조금 남았어.", "还有一点事情要收尾。"],
      ["너무 늦으면 먼저 자도 돼.", "如果太晚的话，你可以先睡。"],
    ],
    choices: KKT_NIGHT_SNACK_OPTIONS,
  },
  {
    time: "20:20",
    npc: [
      ["음… 따뜻한 거 먹고 싶어.", "嗯……我想吃点热乎的。"],
      ["네가 해 주는 거면 아무거나 좋아.", "只要是你做的，什么都好。"],
      ["근데 너무 무리하지는 마. 나 때문에 늦게까지 기다리거나 요리하지 말고.", "不过别太勉强自己。别因为我就一直等到很晚，也别特意熬夜做饭。"],
    ],
    choices: KKT_CONFIRMED_REPLY_OPTIONS,
  },
  {
    // Continuation from the player's confirmed 20:20 reply: they meet downstairs
    // and go to the nearby convenience store together.
    time: "20:23",
    npc: [
      ["어, 타이밍 좋네. 나 방금 회사에서 돌아왔어.", "好巧，我刚从公司回来。"],
      ["뭐 사러 가는 길이야? 같이 가자.", "这是要去买东西吗？一起吧。"],
      ["떡볶이도 먹을까? 어묵도 넣으면 맛있을 것 같은데.", "要不要也吃炒年糕？感觉加上鱼饼会很好吃。"],
    ],
    choices: [
      ["좋아, 떡볶이 해 먹자.", "好啊，做炒年糕吃吧。"],
      ["나도 먹고 싶었어. 같이 먹자.", "我也想吃了，一起吃吧。"],
      ["그럼 떡볶이에 어묵도 사자.", "那就买炒年糕和鱼饼的材料吧。"],
    ],
  },
  {
    time: "20:24",
    npc: [
      ["그럼 떡볶이랑 어묵 사고, 계란도 넣을까? 집에 뭐 있는지 알아?", "那就买炒年糕和鱼饼，要不要也买鸡蛋？你知道家里还有什么吗？"],
    ],
    choices: [
      ["응, 계란도 넣으면 맛있겠다. 사자.", "嗯，加鸡蛋应该也很好吃，买吧。"],
      ["집에 있는지 모르니까 그냥 사 두자.", "不知道家里有没有，干脆先买上吧。"],
      ["그럼 계란도 장바구니에 넣자.", "那就把鸡蛋也放进购物篮吧。"],
    ],
  },
  {
    time: "20:25",
    npc: [
      ["다 샀어. 이제 우리 집에 가자.", "买好了，走吧，我们回家。"],
      ["봉투 하나면 되겠지? 내가 들게.", "一个袋子应该就够了吧？我来拿。"],
    ],
    choices: [
      ["봉투 하나면 충분해. 같이 들고 가자.", "一个袋子就够了，我们一起拿回去吧。"],
      ["좋아. 집에 가서 같이 만들어 먹자.", "好，回家一起做来吃吧。"],
      ["좋아, 이 정도면 충분할 것 같아.", "好，这些应该就够了。"],
    ],
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
    [sent, setSent] = useSkinState<string[]>(p, "mymyKktSentV3", []),
    [storyStep, setStoryStep] = useSkinState<number>(p, "mymyKktNativeStoryStepV3", 0),
    [readThreads, setReadThreads] = useSkinState<string[]>(p, "mymyKktReadThreadsV1", []),
    [openingSequenceReleased, setOpeningSequenceReleased] = useSkinState<boolean>(p, "mymyKktOpeningSequenceReleasedV2", false),
    [scandalOpeningRevealCount, setScandalOpeningRevealCount] = useSkinState<number>(p, "mymyKktScandalOpeningRevealCountV1", 0),
    [processedCallResult, setProcessedCallResult] = useSkinState<string>(p, "mymyKktProcessedCallResultV5", ""),
    [processedPreCall, setProcessedPreCall] = useSkinState<string>(p, "mymyKktProcessedPreCallV5", ""),
    [draft, setDraft] = useState(""),
    [selectedZh, setSelectedZh] = useState(""),
    [selectedChoices, setSelectedChoices] = useState<Array<readonly [string, string]>>([]),
    [candidateOpen, setCandidateOpen] = useState(false),
    [npcTyping, setNpcTyping] = useState(false),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState(false);
  const declineReplyPending =
    (p.ui?.["scandal-call-result-v5"] === "declined" ||
      p.ui?.["scandal-call-result-v5"] === "answered-hangup") &&
    p.ui?.["scandal-call-decline-reply-needed-v6"] === true;
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const sentRef = useRef(sent);
  const notifyKktNpcMessage = (thread: string, text: string, translation: string, time: string) => {
    if (!thread || !text) return;
    p.onUi?.("kkt-incoming-message-event", JSON.stringify({
      id: thread + "-" + time + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      thread,
      text,
      translation,
      time,
    }));
  };
  const preCallSequenceStartedRef = useRef(false);
  const storyStepRef = useRef(storyStep);
  useEffect(() => { storyStepRef.current = storyStep; }, [storyStep]);
  const deliveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choiceOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { sentRef.current = sent; }, [sent]);
  useEffect(() => {
    if (p.thread !== "金旼炡" || storyStep < KKT_STORY_ROUNDS.length) return;
    const lastRound = KKT_STORY_ROUNDS[KKT_STORY_ROUNDS.length - 1];
    const completed = sentRef.current.some((raw) => {
      try {
        const entry: unknown = JSON.parse(raw);
        return Array.isArray(entry) && entry[0] === p.thread &&
          entry[2] === lastRound.time && entry[3] === "owner" &&
          lastRound.choices.some(([ko]) => ko === entry[1]);
      } catch {
        return false;
      }
    });
    if (completed) p.onUi?.("convenience-store-event-finished-v5", true);
  }, [p.thread, storyStep]);
  useEffect(() => {
    if (p.thread !== "金旼炡") return;
    const started = p.ui?.["scandal-precall-started-v5"];
    if (started !== true || processedPreCall || preCallSequenceStartedRef.current) return;
    preCallSequenceStartedRef.current = true;
    const messages: Array<[string, string]> = [
      ["어디야?", "你在哪？"],
      ["혼자 있어?", "你一个人吗？"],
    ];
    // Preserve already-read messages. On re-entry, continue at the first
    // undelivered line rather than deleting history and replaying from line one.
    const isDelivered = (ko: string) => sentRef.current.some((raw) => {
      try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) && parsed[0] === p.thread &&
          parsed[1] === ko && parsed[3] === "npc";
      } catch { return false; }
    });
    const firstMissing = messages.findIndex(([ko]) => !isDelivered(ko));
    if (firstMissing < 0) {
      setProcessedPreCall("sent");
      p.onUi?.("scandal-precall-delivered-v5", true);
      return () => { preCallSequenceStartedRef.current = false; };
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const deliver = (index: number) => {
      const entry = messages[index];
      if (!entry) return;
      const [ko, zh] = entry;
      if (!isDelivered(ko)) {
        const updated = [...sentRef.current, JSON.stringify([p.thread, ko, "14:06", "npc", zh])];
        sentRef.current = updated;
        setSent(updated);
        notifyKktNpcMessage(p.thread, ko, zh, "14:06");
      }
      p.onUi?.("scandal-precall-step-v5", index + 1);
      const nextIndex = messages.findIndex(([nextKo], i) => i > index && !isDelivered(nextKo));
      if (nextIndex >= 0) {
        // Each follow-up is a separate delivery, one second after the previous line.
        timer = window.setTimeout(() => deliver(nextIndex), 1000);
      } else {
        setProcessedPreCall("sent");
        p.onUi?.("scandal-precall-delivered-v5", true);
      }
    };
    timer = window.setTimeout(() => deliver(firstMissing), 650);
    return () => {
      if (timer) window.clearTimeout(timer);
      if (processedPreCall !== "sent") preCallSequenceStartedRef.current = false;
    };
  }, [p.thread, p.ui?.["scandal-precall-started-v5"], processedPreCall]);
  useEffect(() => {
    if (p.thread !== "金旼炡") return;
    const result = p.ui?.["scandal-call-result-v5"];
    if (typeof result !== "string" || !result) {
      if (processedCallResult) setProcessedCallResult("");
      return;
    }
    // A missed/declined call gets both lines. If the player answered and
    // then hung up, continue the story but do not accuse them of not answering.
    if ((result !== "declined" && result !== "answered-hangup") || result === processedCallResult) return;
    const queue: Array<[string, string, string, string]> = result === "declined"
      ? [
          ["왜 전화 안 받아?", "怎么不接电话？", "npc", "14:06"],
          ["집에 있어?", "你在家吗？", "npc", "14:06"],
        ]
      : [
          ["집에 있어?", "你在家吗？", "npc", "14:06"],
        ];
    setProcessedCallResult(result);
    setNpcTyping(true);
    let index = 0;
    const deliverCallMessage = () => {
      const entry = queue[index++];
      if (!entry) { setNpcTyping(false); return; }
      const [ko, zh, role, time] = entry;
      const raw = JSON.stringify([p.thread, ko, time, role, zh]);
      const updated = [...sentRef.current, raw];
      sentRef.current = updated;
      setSent(updated);
      if (role === "npc") notifyKktNpcMessage(p.thread, ko, zh, time);
      if (index < queue.length) {
        deliveryTimer.current = setTimeout(deliverCallMessage, 1200 + Math.floor(Math.random() * 500));
      } else {
        deliveryTimer.current = setTimeout(() => {
          setNpcTyping(false);
          p.onUi?.("scandal-call-decline-reply-needed-v6", true);
        }, 450);
      }
    };
    deliveryTimer.current = setTimeout(deliverCallMessage, 700);
  }, [p.thread, p.ui?.["scandal-call-result-v5"], processedCallResult]);
  useEffect(() => {
    if (p.thread !== "金旼炡") return;
    const round = KKT_STORY_ROUNDS[storyStep];
    if (!round?.npc.length) return;
    const missing = round.npc.filter(([ko]) => !sentRef.current.some((raw) => {
      try {
        const entry: unknown = JSON.parse(raw);
        return Array.isArray(entry) && entry[0] === p.thread &&
          entry[1] === ko && entry[2] === round.time && entry[3] === "npc";
      } catch {
        return false;
      }
    }));
    if (!missing.length) return;
    setNpcTyping(true);
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const deliverMissing = () => {
      const entry = missing[index++];
      if (!entry) { setNpcTyping(false); return; }
      const [ko, zh] = entry;
      // Re-check live history to avoid duplicate delivery after re-entry.
      const alreadyDelivered = sentRef.current.some((raw) => {
        try {
          const existing: unknown = JSON.parse(raw);
          return Array.isArray(existing) && existing[0] === p.thread &&
            existing[1] === ko && existing[2] === round.time && existing[3] === "npc";
        } catch {
          return false;
        }
      });
      if (!alreadyDelivered) {
        const localizedKo = ko.replaceAll("{{playerId}}", p.playerId || "你");
        const localizedZh = zh.replaceAll("{{playerId}}", p.playerId || "你");
        const npcEntry = JSON.stringify([
          p.thread, localizedKo, round.time, "npc", localizedZh,
        ]);
        const updated = [...sentRef.current, npcEntry];
        sentRef.current = updated;
        setSent(updated);
        notifyKktNpcMessage(p.thread, localizedKo, localizedZh, round.time);
      }
      if (index < missing.length) timer = setTimeout(deliverMissing, 1500);
      else timer = setTimeout(() => setNpcTyping(false), 500);
    };
    timer = setTimeout(deliverMissing, 800);
    // Pause the current automatic-message sequence when the player leaves this
    // conversation. Reopening it recomputes missing lines and resumes in order.
    return () => {
      if (timer) clearTimeout(timer);
      setNpcTyping(false);
    };
  }, [p.thread, storyStep]);
  useEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    field.style.height = "34px";
    const css = window.getComputedStyle(field);
    const minHeight = Number.parseFloat(css.getPropertyValue("--kkt-composer-min-height")) || 34;
    const maxHeight = Number.parseFloat(css.getPropertyValue("--kkt-composer-max-height")) || 72;
    const height = Math.min(maxHeight, Math.max(minHeight, field.scrollHeight));
    field.style.height = `${height}px`;
    field.style.overflowY = field.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft, p.thread]);
  useEffect(() => () => {
    if (deliveryTimer.current) clearTimeout(deliveryTimer.current);
    if (choiceOpenTimer.current) clearTimeout(choiceOpenTimer.current);
  }, []);
  const markThreadRead = (title: string) => {
    if (!readThreads.includes(title)) setReadThreads([...readThreads, title]);
    // Read state is tracked per conversation in the phone runtime, not just
    // within this mounted KKT component.
    p.onUi?.("kkt-clear-thread-notifications", title);
  };
  useEffect(() => {
    if (p.thread) markThreadRead(p.thread);
  }, [p.thread]);
  const unreadCount = (group: { title: string; items: Item[] }) => {
    const runtimeCount = p.ui?.["kkt-unread-count:" + group.title];
    // Once the phone runtime has a counter for this conversation, it is the
    // source of truth, including zero after the player opens that chat.
    if (runtimeCount !== undefined) {
      const n = Number(runtimeCount);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    if (readThreads.includes(group.title)) return 0;
    return group.items.reduce((total, item) => {
      if (item.outgoing || item.read || !item.meta.unread) return total;
      const n = Number(item.meta.unread);
      return total + (Number.isFinite(n) && n > 0 ? n : 1);
    }, 0);
  };
  // Later NPC messages mark the player's earlier messages as read. This state
  // applies to every KKT storyline, including earlier conversations.
  const lastNpcMessageIndex = new Map<string, number>();
  sent.forEach((raw, index) => {
    try {
      const entry: unknown = JSON.parse(raw);
      if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
      const role = entry.length >= 4 ? entry[3] : "owner";
      if (role === "npc") lastNpcMessageIndex.set(entry[0], index);
    } catch { /* Ignore malformed local chat entries. */ }
  });
  const seenLocalMessages = new Set<string>();
  const localSentItems = sent.flatMap((raw, index): Item[] => {
    try {
      const entry: unknown = JSON.parse(raw);
      if (
        !Array.isArray(entry) ||
        (entry.length !== 3 && entry.length !== 5) ||
        !entry.every((v) => typeof v === "string")
      ) return [];
      const role = entry.length >= 4 ? entry[3] : "owner";
      // Hide identical NPC lines duplicated in previously saved story state.
      const signature = JSON.stringify([entry[0], entry[1], entry[2], role]);
      if (role === "npc" && seenLocalMessages.has(signature)) return [];
      seenLocalMessages.add(signature);
      const outgoing = role !== "npc";
      const unread = outgoing && index > (lastNpcMessageIndex.get(entry[0]) ?? -1);
      return [makeItem({
        id: "local-kkt-" + index,
        title: entry[0],
        body: entry[1],
        time: entry[2],
        sender: outgoing ? (p.playerId || p.owner || "机主") : "金旼炡",
        outgoing,
        meta: {
          local: "true",
          translation: entry.length >= 5 ? entry[4] : "",
          unread: unread ? "1" : "",
        },
      })];
    } catch {
      return [];
    }
  });
  const list = grouped([...p.items, ...localSentItems]).sort(
      (a, b) => Number(b.title === "金旼炡") - Number(a.title === "金旼炡"),
    ),
    allMessages = [
      ...p.items.filter((i) => i.title === p.thread),
      ...localSentItems.filter((i) => i.title === p.thread),
    ],
    // This is the fixed story opening, not a time-format heuristic. The second
    // line can come from runtime state while the first comes from story.json,
    // so matching only the timestamp failed to catch the pair.
    hasOpeningFirst = p.thread === "金旼炡" &&
      allMessages.some((m) => !m.outgoing && m.id === "kkt-minjeong-opening-01"),
    openingFollowup = p.thread === "金旼炡"
      ? allMessages.find((m) => !m.outgoing && m.body === "나 오늘 집에 좀 늦게 들어갈 것 같아.")
      : undefined,
    hideOpeningFollowup = hasOpeningFirst && Boolean(openingFollowup) && !openingSequenceReleased,
    scandalOpeningMessages = p.thread === "金旼炡"
      ? allMessages.filter((m) => !m.outgoing && (m.body === "어디야?" || m.body === "혼자 있어?"))
      : [],
    messages = allMessages.filter((m) => {
      if (hideOpeningFollowup && m.id === openingFollowup?.id) return false;
      const sequenceIndex = scandalOpeningMessages.findIndex((item) => item.id === m.id);
      return sequenceIndex < 0 || sequenceIndex < scandalOpeningRevealCount;
    }),
    scroll = useRef<HTMLDivElement>(null);
  const currentRound = p.thread === "金旼炡" ? KKT_STORY_ROUNDS[storyStep] : undefined;
  const currentRoundNpcComplete = !currentRound || currentRound.npc.every(([ko]) => {
    const expected = ko.replaceAll("{{playerId}}", p.playerId || "你");
    return allMessages.some((m) => !m.outgoing && m.body === expected);
  });
  const kktNpcTurnComplete =
    currentRoundNpcComplete &&
    !hideOpeningFollowup &&
    scandalOpeningRevealCount >= scandalOpeningMessages.length;
  useEffect(() => {
    // Only start the one-second reveal after the follow-up has actually been
    // delivered into runtime state. This avoids a timer racing the Phone.tsx
    // delivery timer and revealing both opening bubbles in the same render.
    if (
      p.thread !== "金旼炡" ||
      !hasOpeningFirst ||
      !openingFollowup ||
      openingSequenceReleased
    ) return;
    const timer = window.setTimeout(() => setOpeningSequenceReleased(true), 1000);
    return () => window.clearTimeout(timer);
  }, [p.thread, hasOpeningFirst, Boolean(openingFollowup), openingSequenceReleased]);
  useEffect(() => {
    if (
      p.thread !== "金旼炡" ||
      scandalOpeningRevealCount >= scandalOpeningMessages.length
    ) return;
    const total = scandalOpeningMessages.length;
    const timer = window.setTimeout(() => {
      setScandalOpeningRevealCount((count) => Math.min(total, count + 1));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [p.thread, scandalOpeningRevealCount, scandalOpeningMessages.length]);
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
                      {m.meta.unread ? (
                        <i className="kkt-message-unread">{m.meta.unread}</i>
                      ) : null}
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
              const isDeclineReply =
                p.thread === "金旼炡" &&
                declineReplyPending &&
                selectedChoices.some(([ko]) => ko === "응.");
              const time = isDeclineReply ? "14:07" : (KKT_STORY_ROUNDS[storyStep]?.time || p.virtualTime || "20:17");
              const outgoingEntries = p.thread === "金旼炡" && selectedChoices.length
                ? selectedChoices.map(([ko, zh]) => JSON.stringify([
                    p.thread, ko, time, "owner", zh.replaceAll("{{playerId}}", p.playerId || "你"),
                  ]))
                : draft.trim()
                  ? [JSON.stringify([p.thread, draft.trim(), time, "owner", selectedZh || ""])]
                  : [];
              if (!outgoingEntries.length) return;
              const next = [...sentRef.current, ...outgoingEntries];
              sentRef.current = next;
              setSent(next);
              setDraft("");
              setSelectedZh("");
              setSelectedChoices([]);
              setCandidateOpen(false);
              if (isDeclineReply) {
                p.onUi?.("scandal-call-decline-reply-needed-v6", false);
                p.onUi?.("scandal-call-player-replied-v6", true);
                setNpcTyping(true);
                const replies: Array<[string, string, string]> = [
                  ["알겠어. 내가 갈게.", "好，我来找你。", "14:07"],
                  ["걱정하지 마.", "别担心。", "14:08"],
                ];
                let replyIndex = 0;
                const deliverCallReply = () => {
                  const entry = replies[replyIndex++];
                  if (!entry) return;
                  const [ko, zh, replyTime] = entry;
                  const npcEntry = JSON.stringify([p.thread, ko, replyTime, "npc", zh]);
                  const updated = [...sentRef.current, npcEntry];
                  sentRef.current = updated;
                  setSent(updated);
                  notifyKktNpcMessage(p.thread, ko, zh, replyTime);
                  if (replyIndex < replies.length) {
                    deliveryTimer.current = setTimeout(deliverCallReply, 1500);
                  } else {
                    deliveryTimer.current = setTimeout(() => {
                      setNpcTyping(false);
                      p.onUi?.("scandal-call-decline-messages-finished-v6", true);
                    }, 450);
                  }
                };
                deliveryTimer.current = setTimeout(deliverCallReply, 1200);
                return;
              }
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
                    notifyKktNpcMessage(
                      p.thread,
                      ko.replaceAll("{{playerId}}", p.playerId || "你"),
                      zh.replaceAll("{{playerId}}", p.playerId || "你"),
                      nextRound.time,
                    );
                    if (index < nextRound.npc.length) {
                      deliveryTimer.current = setTimeout(deliverOne, 2000);
                    } else {
                      deliveryTimer.current = setTimeout(() => setNpcTyping(false), 500);
                    }
                  };
                  deliveryTimer.current = setTimeout(deliverOne, 2000);
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
            <textarea
              ref={composerRef}
              className="kkt-composer-textarea"
              aria-label="KKT消息"
              placeholder="输入消息"
              value={draft}
              rows={1}
              maxLength={2000}
              readOnly={p.thread === "金旼炡" || npcTyping}
              onPointerDown={(e) => {
                if (p.thread !== "金旼炡") return;
                // Never open the iOS keyboard in the scripted KKT chat. Restore
                // the same in-phone tray behavior that worked before the font-only edit.
                e.preventDefault();
                if (npcTyping || (!declineReplyPending && !kktNpcTurnComplete)) return;
                if (choiceOpenTimer.current) clearTimeout(choiceOpenTimer.current);
                setCandidateOpen(false);
                choiceOpenTimer.current = setTimeout(() => setCandidateOpen(true), 500);
              }}
              onFocus={(e) => {
                if (p.thread === "金旼炡") e.currentTarget.blur();
              }}
              onChange={(e) => {
                setDraft(e.target.value);
                setSelectedZh("");
                setSelectedChoices([]);
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
          {p.thread === "金旼炡" && candidateOpen && !npcTyping &&
            (declineReplyPending || kktNpcTurnComplete) &&
            ((declineReplyPending) || (!p.ui?.["scandal-call-result-v5"] && (KKT_STORY_ROUNDS[storyStep]?.choices.length || 0) > 0)) && (
            <section className="kkt-choice-panel" aria-label="剧情回复选项">
              {(declineReplyPending ? [["응.", "嗯。"] as const] : (KKT_STORY_ROUNDS[storyStep]?.choices || [])).map(([ko, zh]) => (
                <button
                  type="button"
                  className={"kkt-choice" + (selectedChoices.some(([chosenKo]) => chosenKo === ko) ? " selected" : "")}
                  key={ko}
                  onClick={() => {
                    const translated = zh.replaceAll("{{playerId}}", p.playerId || "你");
                    const alreadySelected = selectedChoices.some(([chosenKo]) => chosenKo === ko);
                    // One tap means one reply. Never combine several option rows into one send.
                    const nextChoices = alreadySelected ? [] : [[ko, translated] as const];
                    setSelectedChoices(nextChoices);
                    setDraft(nextChoices[0]?.[0] || "");
                    setSelectedZh("");
                  }}
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
                    <Avatar name={g.title} src={[...g.items].reverse().find((item) => item.avatar)?.avatar || last.avatar} />
                    <span className="kzkn">
                      <b>{g.title}</b>
                      <small className="kkt-chat-preview">{tab === "好友" ? last.sender : last.body}</small>
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
  const [fanDmQueue] = useSkinState<string[]>(p, "scandal-ig-dm-queue-v8", []);
  const [fanDmVisibleCount] = useSkinState<number>(p, "scandal-ig-dm-visible-count-v8", 0);
  const [fanDmReplies, setFanDmReplies] = useSkinState<string[]>(p, "scandal-ig-dm-replies-v8", []);
  const [fanDmReadIds, setFanDmReadIds] = useSkinState<string[]>(p, "scandal-ig-dm-read-ids-v2", []);
  const [fanDmUnreadReplyIds, setFanDmUnreadReplyIds] = useSkinState<string[]>(p, "scandal-ig-dm-unread-reply-ids-v2", []);
  const [fanDmReplyQueue, setFanDmReplyQueue] = useSkinState<string[]>(p, "scandal-ig-dm-reply-queue-v8", []);
  const [fanDmOpenRequest, setFanDmOpenRequest] = useSkinState<string>(p, "scandal-ig-open-thread-v8", "");
  const [activeFanDm, setActiveFanDm] = useState("");
  const [fanDmDraft, setFanDmDraft] = useState("");
  const [activeThreadVisibleCount, setActiveThreadVisibleCount] = useState(0);
  const fanDmScrollRef = useRef<HTMLDivElement | null>(null);
  const visibleFanDms = fanDmQueue.slice(0, Math.max(0, fanDmVisibleCount))
    .map(parseInstagramFanDm).filter((dm): dm is InstagramFanDm => dm !== null).reverse();
  const fanDmReplyEntries = fanDmReplies.map(parseInstagramFanDmReply)
    .filter((message): message is InstagramFanDmReply => message !== null);
  const activeFan = visibleFanDms.find((dm) => dm.id === activeFanDm) || null;
  const activeFanMessages: InstagramFanDmReply[] = activeFan ? [
    {
      id: activeFan.id,
      threadId: activeFan.id,
      handle: activeFan.handle,
      text: activeFan.text,
      translation: activeFan.translation,
      role: "npc",
    },
    ...fanDmReplyEntries.filter((message) => message.threadId === activeFan.id),
  ] : [];
  useEffect(() => {
    setActiveThreadVisibleCount(0);
  }, [activeFanDm]);

  useEffect(() => {
    if (!activeFanDm || activeThreadVisibleCount >= activeFanMessages.length) return;
    const timer = window.setTimeout(() => {
      setActiveThreadVisibleCount((count) => Math.min(count + 1, activeFanMessages.length));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeFanDm, activeThreadVisibleCount, activeFanMessages.length]);

  useEffect(() => {
    if (!fanDmOpenRequest) return;
    setTab("私信");
    setActiveFanDm(fanDmOpenRequest);
    if (!fanDmReadIds.includes(fanDmOpenRequest)) {
      setFanDmReadIds([...fanDmReadIds, fanDmOpenRequest]);
    }
    if (fanDmUnreadReplyIds.includes(fanDmOpenRequest)) {
      setFanDmUnreadReplyIds(fanDmUnreadReplyIds.filter((id) => id !== fanDmOpenRequest));
    }
    p.onUi?.("scandal-ig-active-thread-v1", fanDmOpenRequest);
    setFanDmOpenRequest("");
  }, [fanDmOpenRequest, fanDmReadIds, fanDmUnreadReplyIds]);
  useEffect(() => {
    p.onUi?.("scandal-ig-dm-screen-active-v8", tab === "私信" && !selected);
    return () => {
      p.onUi?.("scandal-ig-dm-screen-active-v8", false);
      p.onUi?.("scandal-ig-active-thread-v1", "");
    };
  }, [tab, selected?.id]);
  useEffect(() => {
    const node = fanDmScrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activeFanDm, fanDmVisibleCount, fanDmReplies.length]);
  const sendFanDmReply = () => {
    const text = fanDmDraft.trim();
    if (!text || !activeFan) return;
    const playerMessage: InstagramFanDmReply = {
      id: activeFan.id + "-player-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      threadId: activeFan.id,
      handle: activeFan.handle,
      text,
      translation: "",
      role: "player",
    };
    setFanDmReplies([...fanDmReplies, JSON.stringify(playerMessage)]);
    setFanDmDraft("");
    if (Math.random() >= 0.6) return;
    const pool = [...IG_FAN_DM_RESPONSES[activeFan.category]];
    const responseCount = Math.random() < 0.45 ? 2 : 1;
    const pending: string[] = [];
    for (let index = 0; index < responseCount; index += 1) {
      const choiceIndex = Math.floor(Math.random() * pool.length);
      const choice = pool.splice(choiceIndex, 1)[0];
      if (!choice) continue;
      pending.push(JSON.stringify({
        id: activeFan.id + "-npc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + "-" + index,
        threadId: activeFan.id,
        handle: activeFan.handle,
        text: choice.text,
        translation: choice.translation,
        role: "npc",
      } satisfies InstagramFanDmReply));
    }
    if (pending.length) setFanDmReplyQueue([...fanDmReplyQueue, ...pending]);
  };
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
        <header className={"igh" + (!selected && !activeFanDm && tab === "搜索" ? " ig-search-header-hidden" : "")}>
          <button
            aria-label={activeFanDm ? "返回Instagram私信" : selected ? "返回Instagram动态" : "关闭当前App"}
            onClick={() => {
              if (activeFanDm) { setActiveFanDm(""); setFanDmDraft(""); p.onUi?.("scandal-ig-active-thread-v1", ""); }
              else if (selected) setSelected(null);
              else p.onBack();
            }}
          >
            <ArrowLeft />
          </button>
          {activeFanDm ? (
            <span className="igl2"><b>{activeFan?.handle || "私信"}</b></span>
          ) : selected && (selected.id === firstCarouselPostId || selected.id === secondCarouselPostId || selected.id === thirdCarouselPostId || selected.id === fourthCarouselPostId) ? (
            <span className="igl2 ig-first-detail-title">
              <b>帖子</b>
              <small>imwinter</small>
            </span>
          ) : (
            <span className="igl2">
              {selected ? "帖子" : tab === "主页" ? "Instagram" : tab}
            </span>
          )}
          {activeFanDm ? (
            <span className="ig-first-header-space" aria-hidden="true" />
          ) : selected && (selected.id === firstCarouselPostId || selected.id === secondCarouselPostId || selected.id === thirdCarouselPostId) ? (
            <span className="ig-first-header-space" aria-hidden="true" />
          ) : (
            <button aria-label="打开私信" onClick={() => { setSelected(null); setActiveFanDm(""); setTab("私信"); }}>
              <Send />
            </button>
          )}
        </header>
        <div className="igb">
          {activeFanDm ? (
            <div className="ig-rumor-dm-thread">
              <div className="ig-rumor-dm-history" ref={fanDmScrollRef}>
                {activeFanMessages.slice(0, activeThreadVisibleCount).map((message) => (
                  <article className={"ig-rumor-dm-message " + (message.role === "player" ? "outgoing" : "incoming")} key={message.id}>
                    {message.role !== "player" && (
                      <Avatar name={message.handle || activeFan?.handle || "粉丝"} round />
                    )}
                    <div className="ig-rumor-dm-bubble">
                      <p>{message.text}</p>
                      {message.translation && <small>{message.translation}</small>}
                    </div>
                  </article>
                ))}
              </div>
              <form className="ig-rumor-dm-compose" onSubmit={(e) => { e.preventDefault(); sendFanDmReply(); }}>
                <input
                  aria-label="回复Instagram私信"
                  value={fanDmDraft}
                  onChange={(e) => setFanDmDraft(e.target.value)}
                  placeholder="发送消息…"
                  maxLength={1000}
                />
                <button type="submit" disabled={!fanDmDraft.trim()}>发送</button>
              </form>
            </div>
          ) : (
            <>
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
              {visibleFanDms.map((dm) => {
                const lastReply = [...fanDmReplyEntries].reverse().find((message) => message.threadId === dm.id);
                const previewText = lastReply?.text || dm.text;
                const previewTranslation = lastReply
                  ? lastReply.role === "npc" ? lastReply.translation : ""
                  : dm.translation;
                return (
                  <button className="kzkr ig-rumor-dm-row" key={dm.id} onClick={() => {
                    setSelected(null);
                    setActiveFanDm(dm.id);
                    setTab("私信");
                    if (!fanDmReadIds.includes(dm.id)) setFanDmReadIds([...fanDmReadIds, dm.id]);
                    if (fanDmUnreadReplyIds.includes(dm.id)) {
                      setFanDmUnreadReplyIds(fanDmUnreadReplyIds.filter((id) => id !== dm.id));
                    }
                    p.onUi?.("scandal-ig-active-thread-v1", dm.id);
                  }}>
                    <Avatar name={dm.handle} round />
                    <span className="kzkn">
                      <b>{dm.handle}</b>
                      <small>{previewText}</small>
                      {previewTranslation && <small className="ig-rumor-dm-translation">{previewTranslation}</small>}
                    </span>
                    {(!fanDmReadIds.includes(dm.id) || fanDmUnreadReplyIds.includes(dm.id)) && <span className="ig-rumor-dm-dot" aria-hidden="true" />}
                  </button>
                );
              })}
              {dms.map((i) => (
                <button className="kzkr" key={i.id} onClick={() => openPost(i)}>
                  <Avatar name={i.sender} src={i.avatar} />
                  <span className="kzkn">
                    <b>{i.title}</b>
                    <small>{i.body}</small>
                  </span>
                </button>
              ))}
              {!dms.length && !visibleFanDms.length && <Blank />}
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
            </>
          )}
        </div>
        {!activeFanDm && <nav className="mymy-ig-nav">
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
        </nav>}
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
  const [tab, setTab] = useSkinState<string>(p, "x-feed-tab-rumor-v2", "为你推荐"),
    [likes, setLikes] = useSkinState<string[]>(p, "mymyXLikes", []),
    [reposts, setReposts] = useSkinState<string[]>(p, "mymyXReposts", []),
    [marks, setMarks] = useSkinState<string[]>(p, "mymyXMarks", []),
    [query, setQuery] = useState(""),
    [liveCount, setLiveCount] = useSkinState<number>(p, "x-live-post-count-rumor-v5", 1),
    [userPosts, setUserPosts] = useSkinState<string[]>(p, "mymyXUserPostsV1", []),
    [draft, setDraft] = useState(""),
    [composeOpen, setComposeOpen] = useState(false);
  const rumorNewsUnlocked = p.ui?.["rumor-news-unlocked-v5"] === true;
  const allLiveRumorItems = p.items.filter((i) => i.meta.live === "true" && i.meta.category === "rumor-discussion");
  const liveItems = rumorNewsUnlocked ? allLiveRumorItems.slice(0, 60) : [];
  const localXItems = userPosts.map((body, n) => makeItem({
    id: "local-x-post-" + n,
    title: "本地帖子",
    body,
    sender: p.playerId || p.owner || "机主",
    time: p.virtualTime || "14:06",
    kind: "post",
    likes: 0,
    comments: [],
    meta: { handle: (p.playerId || "you").replace(/^@/, ""), local: "true", views: "1", platform: "twitter" },
  }));
  const feedItems = [
    ...localXItems.slice().reverse(),
    ...liveItems.slice(0, liveCount).reverse(),
    ...p.items.filter((i) => i.meta.category !== "rumor-discussion").slice().sort((a, b) => b.time.localeCompare(a.time)),
  ];
  useEffect(() => {
    if (rumorNewsUnlocked && p.items.some((i) => i.meta.category === "rumor-discussion"))
      p.onUi?.("rumor-feed-opened", true);
  }, [p.items.length, rumorNewsUnlocked]);
  useEffect(() => {
    if (liveCount >= liveItems.length) return;
    const timer = window.setTimeout(
      () => setLiveCount(Math.min(liveItems.length, liveCount + 1)),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [liveCount, liveItems.length]);
  const refreshFeed = () => setLiveCount(Math.min(liveItems.length, liveCount + 2));
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
          <div className="x-header-actions">
            <button aria-label="切换X外观" onClick={() => setDark(!dark)}>
              <User />
            </button>
            <button aria-label="新建X帖子" className="x-compose-button" onClick={() => setComposeOpen(true)}><Plus size={20} /></button>
            <button className="x-feed-refresh" type="button" aria-label="刷新X信息流" title="刷新" onClick={refreshFeed}>
              <RefreshCw size={18} />
            </button>
          </div>
        </header>
        <div className="kzxtb">
          {["为你推荐", "正在关注", "添加 +", "时间"].map((t) => (
            <button
              className={t === tab ? "on" : ""}
              key={t}
              onClick={() => {
                if (t === "添加 +") { setComposeOpen(true); return; }
                setTab(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {composeOpen && (
          <form className="x-compose-card" onSubmit={(e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            const postId = "local-x-post-" + userPosts.length;
            setUserPosts((current) => [...current, body]);
            setDraft("");
            setComposeOpen(false);
            setTab("为你推荐");
            const npcPool = [
              ["时间线路人", "先等更多上下文吧，别急着下结论。"],
              ["普通网友", "我也刷到这个话题了，先把推测和事实分开比较好。"],
              ["小号观察员", "这条我看到了，大家目前的说法还不一致。"],
              ["路过的MY", "讨论的时候也给当事人留点私人空间吧。"],
              ["消息核对中", "目前没有确认信息，先不要把传闻写成事实。"],
              ["晚间刷帖人", "时间线更新真的很快，刚进来就看到新帖。"],
            ];
            const npc = npcPool[Math.floor(Math.random() * npcPool.length)];
            window.setTimeout(() => {
              p.onUi?.("x-auto-replies-" + postId, [npc[0] + "：" + npc[1]]);
            }, 1800 + Math.floor(Math.random() * 3200));
          }}>
            <header><button type="button" onClick={() => setComposeOpen(false)}>取消</button><b>发帖</b><span /></header>
            <div className="x-compose-body"><Avatar name={p.playerId || p.owner || "机主"} /><textarea aria-label="X发帖内容" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="有什么新鲜事？" maxLength={280} /></div>
            <footer><span>◎ 所有人可以回复</span><button type="submit" disabled={!draft.trim()}>发帖</button></footer>
          </form>
        )}
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
          {feedItems
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
                  {i.meta.category === "rumor-discussion" && i.id.endsWith("-01") && (
                    <button className="x-rumor-photo-card" aria-label="打开网传模糊照片的讨论" onClick={() => p.onItem(i)}>
                      <span>夜间便利店 · 模糊网传图</span>
                      <small>身份与拍摄背景均未确认</small>
                    </button>
                  )}
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
                      {i.comments.length +
                        (Array.isArray(p.ui?.["x-auto-replies-" + i.id]) ? (p.ui?.["x-auto-replies-" + i.id] as string[]).length : 0) +
                        (Array.isArray(p.ui?.["replies-" + i.id]) ? (p.ui?.["replies-" + i.id] as string[]).length : 0)}
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
