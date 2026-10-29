import "./styles.css";
import { StatusGlyph } from "./ios/StatusGlyph";
import { HomeLauncher } from "./launcher/HomeLauncher";
import { useDeviceLayout } from "./launcher/layout";
import "./launcher/launcher.css";
import "./ios/details.css";
import {
  SystemNotifications,
  notificationContent,
} from "./SystemNotifications";
import {
  readLauncherOrigin,
  AppWindow,
  screenOrigin,
} from "./vendor/ios-web/Launcher";
import {
  DeviceLock,
  ControlCenter,
  NativeSettings,
} from "./DeviceSystem";
import { AppArtwork, hasNativeArtwork } from "./AppArtwork";
import { preloadOriginalIconFiles } from "./ios/originalIconFiles";
import { getFields } from "./fields";
import { catalogSkins } from "./skins/catalog";
import "./skins/skins.css";
import "./ios18.css";
import "./device-system.css";
import "./ios/tokens.css";
import "./ios/reference.css";
import "./ios/status-bar.css";
import { RichText } from "./RichText";
import {
  useEffect,
  useCallback,
  memo,
  useState,
  useRef,
  Suspense,
  lazy,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  Plus,
  Search,
  LockKeyhole,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ArrowUp,
  Folder,
  Phone as PhoneIcon,
} from "lucide-react";
import { getApp, type AppPlugin } from "./registry";
import {
  initialRuntime,
  safeMedia,
  type Work,
  type Item,
  type Runtime,
  type UiValue,
} from "./schema";
import { dispatch, choose, visible, advance } from "./engine";
import { db } from "./persistence";

// Large, app-specific UI modules are loaded only when the user opens the
// relevant app or detail view, rather than delaying the first lock screen.
const WeChatSkin = lazy(() =>
  import("./AppSkins").then((m) => ({ default: m.WeChatSkin })),
);
const WhatsAppSkin = lazy(() =>
  import("./AppSkins").then((m) => ({ default: m.WhatsAppSkin })),
);
const SocialDetail = lazy(() =>
  import("./skins/SocialDetails").then((m) => ({ default: m.SocialDetail })),
);
const NativeDetail = lazy(() =>
  import("./ios/Details").then((m) => ({ default: m.NativeDetail })),
);
const NativeCalculator = lazy(() =>
  import("./ios/Calculator").then((m) => ({ default: m.NativeCalculator })),
);
const socialDetailApps = new Set(["twitter"]);
const nativeDetailApps = new Set([
  "notes", "photos", "contacts", "phone", "calendar", "safari",
]);
export const AppIcon = memo(function AppIcon({
  id,
  name,
  small = false,
  custom = "",
  date,
  time,
}: {
  id: string;
  name?: string;
  small?: boolean;
  custom?: string;
  date?: string;
  time?: string;
}) {
  const a = getApp(id);
  const Icon = a.icon;
  return (
    <span className={`app-icon-wrap ${small ? "small" : ""}`}>
      <span className="app-icon" style={{ background: a.color }}>
        {custom ? (
          safeMedia(custom) ? (
            <img src={safeMedia(custom)} alt="自定义图标" decoding="async" />
          ) : (
            <span>{custom.slice(0, 2)}</span>
          )
        ) : hasNativeArtwork(id) ? (
          <AppArtwork id={id} date={date} time={time} />
        ) : (
          <Icon size={small ? 21 : 28} strokeWidth={1.65} />
        )}
      </span>
      {name && <span className="app-name">{name}</span>}
    </span>
  );
}, (prev, next) =>
  prev.id === next.id &&
  prev.name === next.name &&
  prev.small === next.small &&
  prev.custom === next.custom &&
  (prev.id !== "calendar" || prev.date === next.date) &&
  (prev.id !== "clock" || prev.time === next.time));
type InstagramFanDm = {
  id: string;
  handle: string;
  text: string;
  translation: string;
  category: "support" | "critical" | "curious" | "passerby";
  fanType?: string;
};
const IG_FAN_HANDLE_BASES = [
  "mood_blue", "winterlog", "myday_cloud", "mjjarchive", "after_rain",
  "cafe_11pm", "tiny_mood", "nightwalk", "winterzip", "daily_mood",
  "mango_soda", "idolwatcher", "softpeach", "bluehour_my", "starry_day",
  "moonlit_note", "ordinary_bean", "slow_sunday", "my_little_wave",
  "soda_and_ice", "filmgrain_day", "latebus_home", "cotton_cloud",
  "cloudy_record", "mint_choco", "daydream_kr", "quiet_corner",
  "warm_window", "pocket_diary", "smallplanet",
];
const IG_FAN_DM_LINES: Array<Omit<InstagramFanDm, "id" | "handle">> = [
  { category: "critical", fanType: "毒唯", text: "진짜 네가 민정이 여자친구라는 얘기야? 사진은 흐린데 댓글은 벌써 확정 분위기라 머리가 복잡하네.", translation: "真的是你在和旼炡交往吗？照片明明很模糊，评论却已经像实锤一样，我现在很乱。" },
  { category: "critical", fanType: "毒唯", text: "솔직히 네 계정까지 찾아오게 될 줄은 몰랐어. 이게 사실이면 나 오늘 하루는 진짜 아무것도 못 할 듯.", translation: "说实话没想到自己会找到你的账号。如果这是真的，我今天大概什么都干不下去。" },
  { category: "critical", fanType: "毒唯", text: "혹시 맞다면 굳이 티 내거나 암시하는 글은 올리지 말아 줘. 지금도 타임라인이 너무 시끄러워.", translation: "如果真的是你，就别刻意秀恩爱或发暗示了。现在时间线已经够吵了。" },
  { category: "critical", fanType: "毒唯", text: "사진 한 장으로 확정할 순 없다는 거 아는데도 신경 쓰여. 네 계정에 와서 이러는 나도 좀 웃기지만.", translation: "我知道不能只靠一张照片下结论，可还是忍不住在意。跑来你账号的我自己也挺好笑的。" },
  { category: "critical", fanType: "毒唯", text: "네가 일부러 이 소문을 이용해서 관심받는 건 아니었으면 해. 민정이 이름이 걸리면 일이 너무 커져.", translation: "希望你不是故意利用这次传闻博关注。只要牵扯到旼炡，事情就会变得很大。" },
  { category: "critical", fanType: "毒唯", text: "진짜 연인이라면 적어도 민정이한테 부담을 더 얹는 행동은 하지 말아 줬으면 좋겠어.", translation: "如果你真是她的恋人，至少希望你别做出让旼炡压力更大的事。" },
  { category: "critical", fanType: "毒唯", text: "너는 지금 기분이 어떨지 모르겠지만 팬 입장에선 갑자기 현실을 맞은 느낌이라 쉽지 않네.", translation: "不知道你现在是什么心情，但对粉丝来说这像是突然被现实砸中，真的不容易。" },
  { category: "critical", fanType: "毒唯", text: "나 아직 축하할 마음은 없어. 그렇다고 너한테 막말할 생각도 없는데, 그냥 좀 속상해.", translation: "我现在还说不出祝福，也没打算对你说难听的话，只是很失落。" },
  { category: "critical", fanType: "毒唯", text: "혹시 아니면 아니라고 밝혀 달라는 뜻은 아니야. 다만 네가 모호한 글을 더 올리면 추측만 커질 것 같아.", translation: "我不是要你出来否认，只是如果你继续发模糊的内容，猜测只会越来越多。" },
  { category: "critical", fanType: "毒唯", text: "네가 정말 민정이랑 가까운 사이라면 지금만큼은 조용히 있어 줬으면 해. 모든 시선이 몰리고 있잖아.", translation: "如果你真的和旼炡关系亲近，希望你这段时间先低调一点。所有人的目光都集中在这里了。" },
  { category: "critical", fanType: "毒唯", text: "나도 내가 이렇게 질투할 줄 몰랐어. 네가 뭘 잘못했다고 생각하는 건 아닌데 기분이 이상해.", translation: "我也没想到自己会这么嫉妒。我不是觉得你做错了什么，只是心情很奇怪。" },
  { category: "critical", fanType: "毒唯", text: "사진 속 사람이 너인지도 확실하지 않은데 벌써 네 계정이 퍼지는 건 너무 빠르다. 이걸 즐기지만은 않았으면 해.", translation: "照片里是不是你都没确认，你的账号却已经传开得这么快。希望你别把这件事当成乐趣。" },
  { category: "critical", fanType: "毒唯", text: "네가 민정이랑 찍은 사진이나 의미심장한 말을 더 올리면 난 진짜 받아들이기 더 힘들 것 같아.", translation: "如果你再发和旼炡的照片或意味深长的话，我真的会更难接受。" },
  { category: "critical", fanType: "毒唯", text: "오늘 Bubble 다시 읽다가 괜히 울컥했어. 네가 그 사람이라는 말이 맞는지 아닌지 계속 생각하게 돼.", translation: "今天重读 Bubble 时莫名鼻酸。我一直在想，你到底是不是那个人。" },
  { category: "critical", fanType: "毒唯", text: "이게 사실이면 내가 좋아했던 방식도 바뀌어야 하나 싶어. 네가 밉다기보단 마음이 정리가 안 돼.", translation: "如果这是真的，我甚至在想自己是不是得换一种方式喜欢她。倒不是讨厌你，只是整理不好心情。" },
  { category: "critical", fanType: "毒唯", text: "네가 소문을 부정하든 말든 지금은 아무것도 믿기 어려워. 원본도 없고 다들 말만 보태고 있잖아.", translation: "现在无论你否认还是不说，我都很难相信什么。原图也没有，大家只是在不断添话。" },
  { category: "critical", fanType: "毒唯", text: "너한테 직접 메시지 보내는 게 선 넘는 걸 수도 있겠지. 그래도 지금 마음이 너무 복잡해서 한마디 남겨.", translation: "我知道直接给你发消息可能也越界了，但现在心情太复杂，还是留一句话。" },
  { category: "critical", fanType: "毒唯", text: "네가 누구든 민정이를 이용해서 팔로워 늘리는 사람은 아니었으면 좋겠다. 이 일로 그런 의심까지 생기네.", translation: "无论你是谁，我都希望你不是借旼炡涨粉的人。这件事甚至让我产生这种怀疑。" },
  { category: "critical", fanType: "毒唯", text: "나 지금 네 프로필 들어왔다 나갔다 반복 중이야. 궁금해서가 아니라 확인할수록 더 혼란스러워져.", translation: "我现在反复点开又退出你的主页。并不是越看越好奇，而是越确认越混乱。" },
  { category: "critical", fanType: "毒唯", text: "솔직히 네가 부럽다. 그 말이 못나 보이는 건 아는데 오늘은 그냥 그런 마음까지 드네.", translation: "说实话我羡慕你。我知道这样显得不好看，但今天就是会冒出这种心情。" },
  { category: "critical", fanType: "毒唯", text: "민정이한테 해명하라고 몰아가는 것도 싫고 네가 일부러 관심 끄는 것도 싫어. 그냥 사실이 뭔지 모르겠어.", translation: "我讨厌大家逼旼炡解释，也讨厌你故意吸引关注的可能性。我只是根本不知道事实是什么。" },
  { category: "critical", fanType: "毒唯", text: "네가 일부러 그런 게 아니어도 이제 네 계정에 사람들이 몰릴 거야. 조심했으면 해.", translation: "即使你不是故意的，接下来也会有很多人涌到你的账号。希望你小心一点。" },
  { category: "critical", fanType: "毒唯", text: "이런 사진이 퍼지면 당사자 둘 다 피곤해지는 거 알지? 더 큰 단서처럼 보이는 걸 올리진 않았으면.", translation: "你也知道这种照片传开后当事人都会很累吧？希望你别再发看起来像新线索的东西。" },
  { category: "critical", fanType: "毒唯", text: "아직은 축하한다는 말을 못 하겠어. 내가 생각했던 민정이와 현실이 갑자기 부딪힌 느낌이라.", translation: "我现在还说不出祝福。感觉自己想象中的旼炡和现实突然撞到了一起。" },
  { category: "critical", fanType: "毒唯", text: "네가 진짜 여자친구라면 지금 팬들이 왜 흔들리는지는 알아 줬으면 해. 우리도 감정 정리할 시간이 필요해.", translation: "如果你真是她女朋友，希望你理解粉丝为什么会动摇。我们也需要时间整理情绪。" },
  { category: "critical", fanType: "毒唯", text: "난 네가 싫다고 말하고 싶은 게 아니라 이 상황이 싫어. 근데 네 프로필을 보고 있으면 감정이 이상해져.", translation: "我不是想说讨厌你，我讨厌的是这个情况。但看着你的主页，情绪就会变得很奇怪。" },
  { category: "critical", fanType: "毒唯", text: "확인되지 않은 사진 하나로 네가 욕먹는 것도 과하지만, 그걸 이용해 관심을 모으는 건 더 싫어. 제발 선은 지켜 줘.", translation: "只凭一张未确认的照片就骂你也过分，但利用它吸引关注更让我反感。请守住界限。" },
  { category: "critical", fanType: "毒唯", text: "나 오늘 관련 글 그만 보려고 했는데 네 계정이 추천에 떠서 또 들어왔어. 진짜 마음이 편하지가 않네.", translation: "我今天本来想不再看相关帖子了，结果推荐了你的账号，我又点进来了。心里真的不平静。" },
  { category: "critical", fanType: "毒唯", text: "민정이가 행복했으면 한다는 생각은 여전한데 네가 그 상대일 수 있다고 생각하니 바로 받아들이긴 어렵다.", translation: "我仍然希望旼炡幸福，但一想到你可能就是那个对象，我还是很难立刻接受。" },
  { category: "critical", fanType: "毒唯", text: "혹시 사실이라면 민정이 사생활을 더 공개하지 말아 줘. 팬들이 알아야 한다고 생각하지는 않아.", translation: "如果这是真的，请别再公开旼炡的私生活。我不认为粉丝就有必要知道一切。" },
  { category: "critical", fanType: "甜唯", text: "나 진짜 괜찮은 줄 알았는데 네 프로필 보자마자 속이 철렁했어. 사진 한 장인데 하루 종일 아무것도 손에 안 잡히네.", translation: "我还真以为自己没事，结果一看到你的主页，心一下就沉了。一张照片而已，我却一整天都干不了别的。" },
  { category: "critical", fanType: "甜唯", text: "친구한텐 별일 아니라고 했는데 혼자서는 계속 검색하고 있어. 내가 이렇게까지 민정이를 좋아했나 싶어서 현타 온다.", translation: "我跟朋友说没什么，自己却一直在搜索。突然觉得自己原来这么喜欢旼炡，清醒得有点难受。" },
  { category: "critical", fanType: "甜唯", text: "축하한다는 댓글이 계속 보이는데 나는 그 말이 안 나와. 나도 내가 유치한 거 아는데 지금은 진짜 속상해.", translation: "一直看到祝福的评论，可我就是说不出口。我也知道自己这样有点幼稚，但现在真的很失落。" },
  { category: "critical", fanType: "甜唯", text: "네가 정말 그 사람이라면 좋게 생각해 보려고 해도 마음이 자꾸 꼬여. 민정이한테 화난 건 아닌데 눈물이 날 것 같아.", translation: "如果你真是那个人，我也想尽量往好处想，可心情就是绕不过去。我不是生旼炡的气，但真的快哭了。" },
  { category: "critical", fanType: "甜唯", text: "오늘은 민정이 영상 보려고 앱 켰다가 네 얘기만 보고 나왔어. 좋아하는 마음이 그대로라서 더 아픈가 봐.", translation: "今天打开 App 本来想看旼炡的视频，结果全在看你的消息就退出来了。可能正因为还那么喜欢，才更难受。" },
  { category: "critical", fanType: "甜唯", text: "나만 이런가 싶어서 댓글 읽는데 다들 괜찮은 척하더라. 나는 아직 사진 한 장도 제대로 못 보겠어.", translation: "我以为只有我这样，去看评论发现大家都在装作没事。我现在连那张照片都不敢好好看。" },
  { category: "critical", fanType: "甜唯", text: "네 계정을 안 봐야지 하면서도 또 들어오게 돼. 확인할수록 마음만 더 복잡해져서 나도 내가 싫다.", translation: "我一直告诉自己别看你的账号，却还是会点进来。越确认心里越乱，我都开始讨厌这样的自己了。" },
  { category: "critical", fanType: "甜唯", text: "민정이가 행복하면 좋겠다는 말은 진심인데, 그 행복에 내가 모르는 사람이 있다는 생각은 아직 너무 낯설어.", translation: "希望旼炡幸福这句话是真的，可一想到她的幸福里可能有一个我完全不认识的人，我还是很难适应。" },
  { category: "critical", fanType: "甜唯", text: "네가 뭘 잘못했다고 몰아가고 싶진 않은데 솔직히 부럽고 속상해. 이런 감정을 어디에 둬야 할지 모르겠어.", translation: "我不想把事情说成是你做错了什么，但说实话我羡慕又难过。我不知道该把这种心情放在哪里。" },
  { category: "critical", fanType: "甜唯", text: "내가 좋아했던 건 진짜였는데 현실 앞에선 그 마음이 우스워 보이는 기분이야. 오늘은 그냥 조금 무너져 있을래.", translation: "我曾经的喜欢都是真的，可面对现实时又觉得那份心意有点可笑。今天就让我先难受一会儿吧。" },
  { category: "support", fanType: "甜唯", text: "나도 질투가 아예 없진 않은데 그 감정 때문에 널 몰아붙이는 건 아닌 것 같아. 그냥 아직 적응 중이야.", translation: "我也不是完全不嫉妒，但我觉得不能因为这种情绪就逼你。我只是还在适应。" },
  { category: "support", fanType: "甜唯", text: "네 계정에 들어와서 이 말을 하는 게 웃기지만, 사진만으로는 아무것도 확정할 수 없다는 걸 잊지 않으려고.", translation: "跑到你的账号来说这些有点好笑，但我也想提醒自己，不能凭一张照片确认任何事。" },
  { category: "support", fanType: "甜唯", text: "민정이가 이런 상황에서도 평소처럼 무대에 설 수 있으면 좋겠다. 모든 사람이 한꺼번에 몰려가진 않았으면 해.", translation: "希望旼炡即使面对这种情况，也能像平时一样登台。希望大家不要同时涌去围观。" },
  { category: "support", fanType: "甜唯", text: "네가 실제 연인이라면 갑자기 알려져서 불편할 수도 있겠지. 서로에게 부담이 덜 가는 방향으로 지나가길 바라.", translation: "如果你真是她的恋人，突然被曝光也许很不舒服。希望事情能以不再给双方增加压力的方式过去。" },
  { category: "support", fanType: "甜唯", text: "내가 좋아하던 마음은 그대로인데 상황이 달라진 것 같아 낯설다. 조금 천천히 받아들이려고 해.", translation: "我对她的喜欢没有变，只是情况好像不一样了，觉得陌生。我想慢慢接受。" },
  { category: "support", fanType: "甜唯", text: "이런 일로 너한테 악성 메시지가 많이 가지 않았으면 좋겠어. 사진이 맞는지도 아직 모르잖아.", translation: "希望你不要因为这件事收到太多恶意私信，照片到底对不对都还不知道。" },
  { category: "support", fanType: "甜唯", text: "팬마다 반응이 다를 수밖에 없겠지만, 네 계정에 와서 결론을 요구하는 분위기는 아니었으면 해.", translation: "粉丝的反应肯定各不相同，但希望不要变成大家跑到你的账号逼你给结论。" },
  { category: "support", fanType: "甜唯", text: "확인되기 전까지는 더 공유하지 않으려고. 나도 마음이 복잡해서 잠깐 쉬어야겠다.", translation: "确认之前我不会继续转发。我自己也心情复杂，得暂时休息一下。" },
  { category: "support", fanType: "甜唯", text: "네가 그 사람이라면 민정이에게 잘해 줬으면 하는 마음은 있어. 팬 입장이라 아직 복잡하지만.", translation: "如果你就是那个人，我还是希望你对旼炡好。只是作为粉丝，心情仍然复杂。" },
  { category: "support", fanType: "甜唯", text: "사진보다 댓글이 더 무섭네. 사람들이 모르는 부분까지 너무 쉽게 상상하고 있어.", translation: "评论比照片本身还吓人。大家太轻易地想象自己根本不知道的部分了。" },
  { category: "support", fanType: "妈粉", text: "사진 뜬 뒤로 민정이 걱정돼서 네 계정까지 들어왔어. 혹시 정말 곁에 있는 사람이라면, 오늘만큼은 민정이가 댓글 안 보고 쉬게 해 줘.", translation: "照片出来后我一直担心旼炡，才点进你的账号。如果你真在她身边，至少今天让她别看评论，好好休息。" },
  { category: "critical", fanType: "妈粉", text: "민정이가 팬들한테 미안해해야 하는 분위기로 흐르는 게 속상해. 네가 가까운 사람이라면 그 아이가 죄책감 느끼지 않도록 해 줬으면 해.", translation: "事情变成旼炡需要向粉丝道歉的氛围，让我很难受。如果你是她亲近的人，希望你别让她觉得愧疚。" },
  { category: "support", fanType: "妈粉", text: "솔직히 누가 옆에 있는지보다 민정이가 상처받을까 봐 걱정돼. 네가 그 사람이라면 지금 온라인 반응보다 그 아이 마음부터 살펴 줘.", translation: "说实话，比起她身边是谁，我更担心旼炡会受伤。如果你就是那个人，希望你先顾好她的心情，而不是网上反应。" },
  { category: "support", fanType: "妈粉", text: "네가 그녀를 아끼는 사람이라면 댓글 하나하나 신경 쓰지 않게 도와 줬으면 해. 전부 읽을 필요는 없잖아.", translation: "如果你珍惜她，希望你帮她别去在意每一条评论。她没必要全部看完。" },
  { category: "support", fanType: "妈粉", text: "이런 날은 좋아하는 음식 먹고 푹 쉬는 게 제일이라고 생각해. 네가 가까이 있다면 그럴 수 있게 해 줘.", translation: "我觉得这种时候吃喜欢的食物、好好休息最重要。如果你在她身边，希望你能让她这样做。" },
  { category: "support", fanType: "妈粉", text: "민정이가 누구를 만나든 안전하고 존중받았으면 해. 다만 사적인 이야기가 더 공개되지는 않았으면 좋겠다.", translation: "不管旼炡和谁交往，都希望她安全并受到尊重。只是希望私人内容不要再被公开。" },
  { category: "support", fanType: "妈粉", text: "네가 민정이를 정말 아낀다면 지금은 온라인 반응보다 둘이 편안하게 지내는 걸 먼저 생각해 줘.", translation: "如果你真的珍惜旼炡，现在请先考虑你们能不能自在相处，而不是网上反应。" },
  { category: "support", fanType: "妈粉", text: "민정이가 평소처럼 웃고 활동할 수 있으면 좋겠어. 이 일 때문에 계속 해명해야 하는 분위기는 싫다.", translation: "希望旼炡能像平时一样笑着活动。我不喜欢这件事变成她必须不断解释的氛围。" },
  { category: "support", fanType: "妈粉", text: "네가 누구든 민정이의 사생활을 지켜 줄 수 있는 사람이었으면 해. 팬이라서 더 걱정돼서 메시지했어.", translation: "无论你是谁，希望你能保护旼炡的隐私。我因为是粉丝，所以更担心，才发了这条消息。" },
  { category: "support", fanType: "妈粉", text: "요즘 민정이가 너무 바빠 보였는데 이런 이슈까지 겹쳐 마음이 쓰여. 오늘은 댓글을 좀 멀리했으면.", translation: "最近旼炡看起来很忙，现在又碰上这件事，真让人担心。希望她今天远离评论区。" },
  { category: "support", fanType: "妈粉", text: "네가 실제 연인이라면 서로에게 무리한 설명을 요구하지 말고 편하게 얘기했으면 좋겠다.", translation: "如果你真是她的恋人，希望你们能自在沟通，而不是互相要求解释。" },
  { category: "support", fanType: "妈粉", text: "민정이가 누구를 만나든 팬들 기분을 대신 책임질 필요는 없어. 네가 옆에 있다면 그걸 잊지 않게 해 줘.", translation: "旼炡不必替粉丝的心情负责。不论你们是否交往，如果你在她身边，希望你提醒她这一点。" },
  { category: "support", fanType: "妈粉", text: "네 계정에 사람들이 몰리는 게 걱정된다. 당분간 위치나 일상 사진은 조심해서 올렸으면 좋겠어.", translation: "担心很多人涌到你的账号。最近发地点或日常照片时，希望你稍微小心一点。" },
  { category: "support", fanType: "妈粉", text: "민정이가 좋아하는 일을 오래 할 수 있으면 좋겠다. 연애설이든 뭐든 그 길을 방해하는 일이 없었으면 해.", translation: "希望旼炡能长久做自己喜欢的事。不论传闻真假，都希望别妨碍她走自己的路。" },
  { category: "support", fanType: "妈粉", text: "지금은 누구 잘못인지 따지기보다 민정이가 마음 편히 쉴 수 있는 시간이 필요해 보여.", translation: "现在比起追究谁对谁错，我觉得旼炡更需要能安心休息的时间。" },
  { category: "critical", fanType: "女友粉", text: "나 괜찮다고 생각했는데 네 계정까지 찾아와서 이러고 있네. 진짜 열애설이면 나 며칠은 적응 못 할 듯.", translation: "我以为自己没事，结果还是找到了你的账号。要是真的恋爱传闻，我可能几天都适应不了。" },
  { category: "critical", fanType: "女友粉", text: "버블에서 다정하게 말해 주던 게 생각나서 갑자기 속상해졌어. 내가 혼자 너무 가까운 사람처럼 느꼈나 봐.", translation: "想起她在 Bubble 里温柔说话的样子，突然就难过了。可能是我一个人觉得自己和她很亲近。" },
  { category: "critical", fanType: "女友粉", text: "네가 그 사람이라면 솔직히 부럽다. 나도 이런 마음 드는 게 싫은데 지금은 감정이 잘 안 정리돼.", translation: "如果你就是那个人，说实话我很羡慕。我也不喜欢自己这样，但现在还整理不好情绪。" },
  { category: "critical", fanType: "女友粉", text: "친구한텐 웃으면서 넘겼는데 혼자 있으니까 사진이 계속 생각나. 나 생각보다 민정이를 많이 좋아했나 봐.", translation: "我在朋友面前笑着带过了，独处时却一直想起照片。看来我比自己以为的更喜欢旼炡。" },
  { category: "critical", fanType: "女友粉", text: "축하한다는 말이 안 나와. 민정이가 행복하길 바라면서도 네가 그 상대라고 생각하니 마음이 아파.", translation: "我说不出祝福。明明希望旼炡幸福，可一想到你可能是那个对象，还是心疼。" },
  { category: "critical", fanType: "女友粉", text: "오늘은 팬 계정 로그아웃했어. 계속 보면 질투만 커지고 내가 싫어질 것 같아서.", translation: "今天我退出了粉丝账号。继续看下去只会越来越嫉妒，也会越来越讨厌自己。" },
  { category: "critical", fanType: "女友粉", text: "네가 정말 여자친구라면 내가 좋아하던 Bubble 문장들이 갑자기 다르게 느껴져. 그 말들이 거짓은 아닌데도.", translation: "如果你真是她女朋友，以前喜欢的 Bubble 消息突然有了不同的感觉。明明那些话也不是假的。" },
  { category: "critical", fanType: "女友粉", text: "난 네가 미운 건지 부러운 건지 나도 모르겠어. 이런 메시지 보내는 것부터 내가 많이 흔들렸다는 뜻이겠지.", translation: "我也不知道自己是讨厌你还是羡慕你。光是发这条消息，就说明我已经被影响得很深了。" },
  { category: "critical", fanType: "女友粉", text: "지금 당장 탈덕할 생각은 없는데 예전처럼 아무 생각 없이 좋아할 수 있을지 모르겠다.", translation: "我现在没打算退坑，但不知道还能不能像以前一样毫无顾虑地喜欢她。" },
  { category: "critical", fanType: "女友粉", text: "네가 민정이의 연인일 수도 있다는 생각에 괜히 프로필을 계속 보게 돼. 솔직히 이러는 내가 좀 한심해.", translation: "一想到你可能是旼炡的恋人，就忍不住一直看你的主页。说实话，我都觉得自己有点没出息。" },
  { category: "critical", fanType: "女友粉", text: "내가 혼자 설렜던 시간은 진심이었는데, 현실 앞에선 내가 너무 우스워 보이는 기분이야.", translation: "我独自心动的那些时光都是真心的，但面对现实，却觉得自己特别可笑。" },
  { category: "critical", fanType: "女友粉", text: "축하해야 한다는 걸 머리로는 아는데 마음은 아직 아니야. 네가 뭘 잘못했다고 생각하는 건 아니고 그냥 슬퍼.", translation: "理智上知道应该祝福，但心里还做不到。我不是觉得你做错了什么，只是难过。" },
  { category: "critical", fanType: "女友粉", text: "오늘은 민정이 사진도 못 누르겠어. 좋아하는 마음이 달라진 건 아닌데 보는 게 조금 아프네.", translation: "今天连旼炡的照片都不敢点开。喜欢的心情没变，只是看着会有点痛。" },
  { category: "critical", fanType: "女友粉", text: "나한테는 진짜 큰 소식인데 민정이는 아무렇지 않게 하루를 보내고 있을 수도 있겠지. 그 생각에 또 현타가 와.", translation: "对我来说是很大的消息，可旼炡可能正在照常过一天。想到这里又突然清醒了。" },
  { category: "critical", fanType: "女友粉", text: "네가 부럽다고 하면 내가 너무 유치해 보이겠지만, 지금은 다른 말이 잘 안 떠오른다.", translation: "说羡慕你可能显得很幼稚，但现在我真的想不出别的话。" },
  { category: "critical", fanType: "梦女粉", text: "네가 민정이의 여자친구일지도 모른다는 말 보고 진짜 멘붕 왔어. 나도 이런 내가 웃긴데 오늘은 진짜 못 넘기겠네.", translation: "看到你可能是旼炡女朋友的说法，我真的懵了。我也觉得自己这样很好笑，可今天真的没法轻轻带过。" },
  { category: "critical", fanType: "梦女粉", text: "나 민정이랑 결혼한다고 진심 믿은 건 아닌데, 왜 네 계정 보니까 내 세계관이 무너지는 기분이지ㅋㅋ", translation: "我又不是真的相信自己会和旼炡结婚，可为什么看到你的账号，感觉自己的世界观塌了啊哈哈。" },
  { category: "critical", fanType: "梦女粉", text: "네가 진짜라면 솔직히 너무 질투 나. 민정이가 누군가한테 다정하게 굴고 있을 거 생각하니까 상상이 안 돼.", translation: "如果真的是你，说实话我嫉妒得不行。一想到旼炡可能会对某个人温柔，我就没法想象。" },
  { category: "critical", fanType: "梦女粉", text: "내 최애가 현실에서 누군가를 만날 수 있다는 건 알았는데 막상 사진으로 보니까 얘기가 다르네.", translation: "我知道最喜欢的人在现实中可能会和别人交往，可真正看到照片又是另一回事。" },
  { category: "critical", fanType: "梦女粉", text: "네가 일부러 커플 티 내는 사람은 아니었으면 해. 지금은 작은 단서 하나에도 팬들이 의미를 붙이게 되거든.", translation: "希望你不是故意秀情侣感的人。现在粉丝连一个小线索都会赋予意义。" },
  { category: "critical", fanType: "梦女粉", text: "내 망상은 내가 알아서 할 테니까 현실에서 괜히 암시하는 글만 안 올렸으면 좋겠다. 그게 지금 내 바람이야.", translation: "我的幻想我自己会处理，所以希望你别在现实里发暗示性内容。这就是我现在唯一的愿望。" },
  { category: "critical", fanType: "梦女粉", text: "민정이가 내 남자친구인 척 상상하며 좋아했던 시간이 갑자기 민망해져. 네가 맞다면 더더욱 그렇겠지.", translation: "以前幻想旼炡是自己男朋友的日子，突然变得很不好意思。如果真的是你，这种感觉更强烈。" },
  { category: "critical", fanType: "梦女粉", text: "오늘은 상상 계정에 숨어 있으려 했는데 관련 사진이 계속 떠. 현실 좀 그만 보게 해 줬으면 싶다.", translation: "今天本来想躲在幻想账号里，可相关照片一直出现。真希望能暂时别让我看到现实。" },
  { category: "critical", fanType: "梦女粉", text: "나 진짜 질투나서 네 프로필 안 보려고 했는데 결국 눌렀어. 이런 감정 처음이라 나도 당황스럽다.", translation: "我真的因为嫉妒不想看你的主页，最后还是点开了。这种情绪我也是第一次经历，自己都慌了。" },
  { category: "critical", fanType: "梦女粉", text: "너한테 화를 내고 싶은 건 아닌데, 내가 좋아하던 상상에 현실의 네가 들어온 느낌이라 좀 괴롭다.", translation: "我不是想对你发火，只是感觉现实中的你突然闯进了我喜欢的幻想里，有点难受。" },
  { category: "critical", fanType: "梦女粉", text: "내가 민정이를 좋아하는 방식이 너무 일방적이었다는 걸 알면서도 이런 소식은 쉽게 못 넘기겠어.", translation: "我知道自己喜欢旼炡的方式本来就是单方面的，可这种消息还是很难轻易放下。" },
  { category: "critical", fanType: "梦女粉", text: "네가 민정이한테 잘해 주길 바라는 마음도 있는데, 동시에 네가 너무 부럽고 싫은 마음도 있어서 복잡해.", translation: "我也希望你能对旼炡好，但同时又很羡慕你，甚至有些讨厌你，所以心情很复杂。" },
  { category: "curious", fanType: "私生粉", text: "사진 속 사람이 너라면 언제부터 아는 사이인지 궁금해. 대답하기 싫으면 안 해도 되지만 계속 생각나네.", translation: "如果照片里的人是你，我很好奇你们从什么时候认识的。不想回答也没关系，只是一直忍不住想。" },
  { category: "curious", fanType: "私生粉", text: "그날 사진 원본을 본 적 있어? 지금 도는 건 다 잘린 이미지라서 더 궁금해졌어.", translation: "你见过那天照片的原图吗？现在传播的都是裁剪图，所以我更好奇了。" },
  { category: "curious", fanType: "私生粉", text: "혹시 네가 민정이랑 친한 사이라는 건 맞아? 확인만 하고 더 이상 묻진 않을게.", translation: "你和旼炡关系亲近这件事是真的吗？我只想确认一下，不会再追问。" },
  { category: "curious", fanType: "私生粉", text: "너랑 민정이가 실제로 만나는 거라면 처음 만난 계기 정도는 알려진 게 있어? 괜히 검색만 늘어가네.", translation: "如果你和旼炡真的在交往，有公开过怎么认识的吗？我只是越搜越好奇。" },
  { category: "curious", fanType: "私生粉", text: "사진이 올라온 계정을 찾으려다가 네 프로필까지 오게 됐어. 원래 어디서 시작된 건지 알고 싶다.", translation: "本来想找照片最初发布的账号，结果点到了你的主页。我想知道这事最早从哪里开始的。" },
  { category: "curious", fanType: "私生粉", text: "너랑 민정이 관계가 사실인지 아닌지 계속 검색하게 돼. 뭔가 확실한 게 나오면 좋겠어.", translation: "我一直在搜索你和旼炡的关系是真是假。真希望能出现一些确定的信息。" },
  { category: "curious", fanType: "私生粉", text: "사진 속 옷이 같은 건지 궁금해서 네 게시물까지 봤어. 내가 너무 파고드는 거면 여기서 멈출게.", translation: "我因为好奇照片里的衣服是不是同一件，连你的帖子都看了。如果我挖得太深，就到此为止。" },
  { category: "curious", fanType: "私生粉", text: "네가 직접 밝힌 게 없으니 더 궁금해지는 것 같아. 그렇다고 사생활을 캐는 게 옳다는 건 아니지만.", translation: "因为你没有亲自说过什么，反而更让人好奇。虽然我也知道不该挖隐私。" },
  { category: "critical", fanType: "事业粉", text: "몇 달 동안 다음 활동 기다렸는데 오늘은 검색해도 네 얘기와 사진뿐이야. 민정이가 준비한 무대가 이 이슈에 묻힐까 봐 진짜 속상해.", translation: "我等下一次活动等了好几个月，今天一搜索却全是你和照片。我真的很难过，怕旼炡准备的舞台被这件事淹没。" },
  { category: "critical", fanType: "事业粉", text: "이번 일 때문에 홍보 일정까지 바뀌면 어떡하나 계속 생각하게 돼. 네가 일부러 이슈를 키우는 건 아니었으면 좋겠어.", translation: "我一直担心这件事会不会连宣传日程都改变。希望你不是故意把话题闹大的。" },
  { category: "critical", fanType: "事业粉", text: "앨범 얘기하던 계정들이 갑자기 전부 열애설만 올리는 중이네. 네가 맞는지보다 민정이 활동이 안 묻혔으면 좋겠어.", translation: "之前聊专辑的账号突然全在发恋爱传闻。比起是不是你，我更希望旼炡的活动别被埋没。" },
  { category: "critical", fanType: "事业粉", text: "솔직히 기사 제목만 보면 확정된 줄 알겠어. 네가 아는 게 있다면 일부러 단서를 흘려서 더 시끄럽게 만들진 말아 줘.", translation: "说实话只看新闻标题还以为已经实锤了。如果你知道什么，也请别故意放线索让事情更吵。" },
  { category: "support", fanType: "事业粉", text: "네가 누군지보다 사진이 어디서 퍼졌는지가 더 중요한 것 같아. 당사자 사생활은 보호됐으면 해.", translation: "比起你是谁，我觉得照片从哪里传播出来更重要。希望当事人的隐私能被保护。" },
  { category: "support", fanType: "事业粉", text: "팬들이 갑자기 몰려가서 너한테 답을 요구하지 않았으면 해. 다들 궁금해도 넘지 말아야 할 선은 있잖아.", translation: "希望粉丝不要突然涌到你这里索要答案。大家再好奇，也有不该越过的界限。" },
  { category: "critical", fanType: "普通粉丝", text: "나 이런 거에 별로 흔들리지 않는 편인데 이번엔 네 계정까지 찾아오게 되네. 사진이랑 댓글을 보고 나니까 괜히 심란해.", translation: "我平时不太会被这种事影响，这次却还是找到了你的账号。看完照片和评论后，心里莫名烦乱。" },
  { category: "curious", fanType: "普通粉丝", text: "솔직히 네가 누군지 궁금해서 들어왔는데, 보면 볼수록 확인된 건 없고 내 상상만 늘어나네. 이쯤에서 멈춰야겠다.", translation: "说实话我是好奇你是谁才点进来的，但越看越发现没什么实锤，只有自己的想象越来越多。我该停下来了。" },
  { category: "critical", fanType: "普通粉丝", text: "처음엔 그냥 가십인 줄 알았는데 하루 종일 머릿속에 남아 있네. 내가 생각보다 민정이를 신경 쓰고 있었나 봐.", translation: "一开始以为只是八卦，结果一整天都挥之不去。看来我比想象中更在意旼炡。" },
  { category: "critical", fanType: "普通粉丝", text: "네가 맞는지 아닌지 확인하고 싶은 마음이랑 이걸 더 보면 안 될 것 같은 마음이 계속 싸워. 오늘은 진짜 피곤하다.", translation: "想确认是不是你，和觉得自己不该继续看的念头一直在打架。今天真的累了。" },
  { category: "curious", fanType: "普通粉丝", text: "사진이 계속 올라오는데 출처가 다 달라서 더 헷갈려. 공식적으로 나온 내용이 있으면 좋겠네.", translation: "照片一直在传播，但来源各不相同，反而更混乱。希望能有正式消息。" },
  { category: "curious", fanType: "普通粉丝", text: "나도 아직 어떻게 생각해야 할지 모르겠어. 누가 뭐라고 해도 당사자들이 제일 피곤하겠지.", translation: "我也不知道该怎么想。无论大家说什么，当事人应该才是最累的。" },
  { category: "curious", fanType: "普通粉丝", text: "처음엔 그냥 지나쳤는데 하루 종일 실검에 떠서 들어와 봤어. 확인 전까지는 판단 보류하려고.", translation: "一开始我直接划过去了，但它一整天都在热搜上，就点进来看看。确认前我先保留判断。" },
  { category: "curious", fanType: "普通粉丝", text: "댓글에서 서로 다른 얘기만 해서 네 계정까지 와 봤어. 더 퍼뜨릴 생각은 없고 그냥 상황이 궁금했어.", translation: "评论区说法完全不一样，所以我点进了你的账号。我没打算继续传播，只是好奇情况。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "이 상황을 이용해서 관심받으려는 건 아니길 바라. 아직 사실도 아닌데 네 계정까지 퍼지는 게 불편하네.", translation: "希望你不是在利用这件事博关注。事情还没确认，你的账号却已经传开，让人不舒服。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "민정이 열애설이 뜨면 꼭 상대방까지 평가하는 글이 나오더라. 외모나 인성 추측은 좀 멈췄으면 해.", translation: "旼炡一有恋爱传闻，就有人开始评价对方。希望大家别再猜外貌和人品。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "솔직히 이런 이슈로 조회수 얻으려는 계정들이 제일 피곤해. 네가 그런 식으로 행동하지는 말아 줘.", translation: "说实话，最让人疲惫的是靠这种话题赚流量的账号。希望你不要那样做。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "네가 맞든 아니든 사람을 몰아세우는 댓글은 선 넘었다고 생각해. 다만 모호한 암시도 더해지지 않았으면 해.", translation: "不管是不是你，围攻当事人的评论都越界了。不过也希望不要再增加模糊暗示。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "사진 속 사람이 누군지 맞히겠다고 계정마다 찾아가는 건 너무 과해. 이쯤에서 다들 멈췄으면 좋겠다.", translation: "为了认出照片里的人就挨个搜账号，真的太过了。希望大家到此为止。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "루머만으로 민정이 커리어가 끝난 것처럼 말하는 것도, 상대방을 악역으로 만드는 것도 과하다고 봐.", translation: "只凭传闻就说旼炡事业完了，或者把对方塑造成反派，我觉得都太过了。" },
  { category: "passerby", fanType: "路人", text: "추천에 떠서 봤는데 아직 사실은 아무것도 모르겠네요. 사진만으로 결론 내리는 건 이른 것 같아요.", translation: "推荐页推给我才点进来看，目前其实什么都不知道。只凭照片下结论太早了。" },
  { category: "passerby", fanType: "路人", text: "팬은 아니지만 이렇게 사적인 사진이 하루 종일 돌아다니는 건 좀 불편해요. 당사자들이 쉬었으면 좋겠네요.", translation: "我不是粉丝，但私人照片这样传播一整天让人不舒服。希望当事人能休息一下。" },
  { category: "passerby", fanType: "路人", text: "댓글이 서로 다른 말을 해서 뭐가 맞는지 모르겠어요. 확인된 기사 나오기 전까진 그냥 지켜보려고요.", translation: "评论说法不一，我也不知道什么是真的。正式核实前先观望吧。" },
  { category: "passerby", fanType: "路人", text: "오늘은 이 얘기만 계속 떠서 피곤하네요. 며칠 지나면 좀 잦아들겠죠.", translation: "今天一直刷到这个话题，挺疲惫的。过几天应该会平息一些吧。" },
  { category: "passerby", fanType: "路人", text: "당신도 갑자기 관심을 받게 됐다면 불편하겠어요. 더 이상 사적인 정보가 퍼지지 않았으면 합니다.", translation: "如果你也突然受到这么多关注，应该会很不舒服。希望不要再传播更多私人信息。" },
];
function createInstagramFanDmBatch(): string[] {
  const records: InstagramFanDm[] = IG_FAN_DM_LINES.map((line, index) => ({
    ...line,
    id: "ig-rumor-dm-" + String(index + 1).padStart(3, "0"),
    handle: "@" + IG_FAN_HANDLE_BASES[index % IG_FAN_HANDLE_BASES.length] + "_" + String(index + 1).padStart(2, "0"),
  }));
  for (let i = records.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = records[i];
    const target = records[j];
    if (!current || !target) continue;
    records[i] = target;
    records[j] = current;
  }
  return records.map((record) => JSON.stringify(record));
}

type PhoneProps = Omit<Parameters<typeof PhoneRuntime>[0], "deviceLayout">;
export function Phone(props: PhoneProps) {
  const deviceLayout = useDeviceLayout(props.work, props.creator);
  return (
    <PhoneRuntime
      {...props}
      work={deviceLayout.work}
      deviceLayout={deviceLayout}
    />
  );
}
function PhoneRuntime({
  deviceLayout,
  work,
  creator = false,
  onEdit,
  onAdd,
  onSettings,
  onOpen,
  runtime: external,
  onRuntime,
}: {
  deviceLayout: ReturnType<typeof useDeviceLayout>;
  work: Work;
  creator?: boolean;
  onEdit?: (app: string, item: Item) => void;
  onAdd?: (app: string) => void;
  onSettings?: () => void;
  onOpen?: (app: string) => void;
  runtime?: Runtime;
  onRuntime?: (s: Runtime) => void;
}) {
  const [app, setApp] = useState("");
  const [appThread, setAppThread] = useState("");
  // Async NPC messages may call callbacks captured when an earlier thread was open.
  // Keep the live foreground app/thread in a ref so popup decisions never use stale state.
  const appViewRef = useRef({ app, appThread });
  const closeCurrentApp = useCallback(() => {
    appViewRef.current = { ...appViewRef.current, app: "" };
    setApp("");
  }, []);
  const setActiveAppThread = useCallback((thread: string) => {
    appViewRef.current = { ...appViewRef.current, appThread: thread };
    setAppThread(thread);
  }, []);
  const [appOpenSequence, setAppOpenSequence] = useState(0);
  const [homeRequest, setHomeRequest] = useState(0);
  const [locked, setLocked] = useState(!creator);
  const [pinOpen, setPinOpen] = useState(false);
  const [quickCamera, setQuickCamera] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const appSnapshots = useRef(new Map<string, HTMLElement>());
  const handledKktEventsRef = useRef(new Set<string>());
  const [banner, setBanner] = useState("");
  const [bannerQueue, setBannerQueue] = useState<string[]>([]);
  const [callReplyVisible, setCallReplyVisible] = useState(false);
  // null means the existing saved notifications haven't been baselined yet;
  // show only notifications added after the first mounted runtime snapshot.
  const noticesSeen = useRef<string[] | null>(null);
  const [contextApp, setContextApp] = useState("");
  const [deviceScale, setDeviceScale] = useState(0.84);
  const shell = useRef<HTMLDivElement>(null);
  const gesture = useRef({ x: 0, y: 0, time: 0, zone: "" });
  const [launchOrigin, setLaunchOrigin] = useState(screenOrigin);

  const beginUnlock = () => {
    setPinError("");
    setQuickCamera(false);
    if (work.phone.passcode) setPinOpen(true);
    else unlock();
  };

  // Allow Safari's native iPhone keyboard to handle real text composition.
  // The focused controls use inverse-scaled font sizing in CSS to keep the
  // rendered text at 16px and avoid WebKit zooming the entire simulator.
  // After focus, pin chat histories to their latest message as the viewport
  // changes for the native keyboard.
  const scrollOnEditableFocus = (origin: EventTarget | null) => {
    if (!(origin instanceof HTMLElement)) return;
    if (!origin.matches('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="file"]):not([type="color"]), select, [contenteditable="true"]')) return;
    const screen = shell.current?.querySelector<HTMLElement>(".phone-screen");
    if (!screen) return;

    const panes = new Set<HTMLElement>();
    const kktRoot = origin.closest<HTMLElement>(".mymy-ui.mymy-kakao");
    if (kktRoot && origin.closest(".kzinp")) {
      const pane = kktRoot.querySelector<HTMLElement>(".msgs");
      if (pane) panes.add(pane);
    }

    const igThread = origin.closest<HTMLElement>(".ig-rumor-dm-thread");
    if (igThread) {
      const pane = igThread.querySelector<HTMLElement>(".ig-rumor-dm-history");
      if (pane) panes.add(pane);
    }

    if (origin.closest(".skin-compose")) {
      const pane = screen.querySelector<HTMLElement>(".skin-messages");
      if (pane) panes.add(pane);
    }

    // For other reply composers, find the nearest scrollable history containing
    // the field. Search forms and ordinary non-chat inputs do not move the feed.
    if (!panes.size) {
      let node = origin.parentElement;
      while (node && node !== screen) {
        const className = typeof node.className === "string" ? node.className : "";
        const isLikelyHistory =
          /message|conversation|chat|thread|comment|reply|timeline|msgs/i.test(className);
        const style = window.getComputedStyle(node);
        const isScrollable =
          (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay") &&
          node.scrollHeight > node.clientHeight + 1;
        if (isLikelyHistory && isScrollable) {
          panes.add(node);
          break;
        }
        node = node.parentElement;
      }
    }
    if (!panes.size) return;

    const scrollToLatest = () => {
      for (const pane of panes) {
        if (pane.isConnected && pane.clientHeight > 0) pane.scrollTop = pane.scrollHeight;
      }
    };
    window.requestAnimationFrame(() => {
      scrollToLatest();
      window.requestAnimationFrame(scrollToLatest);
      // The delay lets the native keyboard finish resizing Safari's visual viewport.
      window.setTimeout(scrollToLatest, 300);
    });
  };


  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const gestureConsumed = useRef(false);
  const [pinError, setPinError] = useState("");
  const [folder, setFolder] = useState("");
  const [panel, setPanel] = useState("");
  const [own, setOwn] = useState(() => initialRuntime(work));
  const [saveSlots, setSaveSlots] = useState<Array<{ id: string; state: Runtime } | undefined>>([undefined, undefined, undefined]);
  const [ready, setReady] = useState(creator || !!external);
  const [loadError, setLoadError] = useState("");
  const [playerId, setPlayerId] = useState(() => {
    try { return localStorage.getItem("foundphone.player-id.v1")?.trim() || ""; }
    catch { return ""; }
  });
  const [saveGeneration, setSaveGeneration] = useState(() => {
    try {
      const savedId = localStorage.getItem("foundphone.player-id.v1")?.trim();
      return savedId
        ? localStorage.getItem(`foundphone.player-run.v1:${encodeURIComponent(savedId)}`) || "legacy"
        : "legacy";
    } catch { return "legacy"; }
  });
  const [resumePromptKey, setResumePromptKey] = useState(0);

  useEffect(() => {
    if (creator) return;
    let hiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= 30 * 60 * 1000 && playerId) {
        closeCurrentApp();
        setPinOpen(false);
        setQuickCamera(false);
        setLocked(true);
        setResumePromptKey((value) => value + 1);
      }
      hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [creator, playerId]);

  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const fit = () => {
      // Size the device from its fixed simulator stage, not window.innerHeight
      // or visualViewport: iOS Safari shrinks those while the keyboard is open.
      // Using that temporary height caused the phone to jump/shrink after ID entry.
      const stage = el.parentElement;
      if (!stage) return;
      const availableWidth = stage.clientWidth - 24;
      const availableHeight = stage.clientHeight - (creator ? 170 : external ? 150 : 40);
      if (availableWidth <= 0 || availableHeight <= 0) return;
      setDeviceScale(
        Math.max(
          0.4,
          Math.min(1, availableWidth / 407, availableHeight / 866),
        ),
      );
    };
    const observer = new ResizeObserver(fit);
    const stage = el.parentElement;
    if (stage) observer.observe(stage);
    // Do not listen to the visual viewport: its height changes with the iOS
    // keyboard and is not the dimensions of the simulated phone stage.
    window.addEventListener("orientationchange", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", fit);
    };
  }, [creator, ready]);
  const s = external ?? own;
  const runtimeRef = useRef(s);
  runtimeRef.current = s;
  const playerSaveName = playerId || "未设置玩家ID";
  const autoSaveBase = `${work.id}:default:${encodeURIComponent(playerSaveName)}`;
  const autoSaveId = saveGeneration === "legacy"
    ? autoSaveBase
    : `${autoSaveBase}:${saveGeneration}`;
  const slotId = (index: number) => saveGeneration === "legacy"
    ? `${work.id}:manual-slot-${index + 1}`
    : `${work.id}:manual-slot:${encodeURIComponent(playerSaveName)}:${saveGeneration}:${index + 1}`;
  const startNewPlayer = (value: string) => {
    const generation = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      localStorage.setItem("foundphone.player-id.v1", value);
      localStorage.setItem(`foundphone.player-run.v1:${encodeURIComponent(value)}`, generation);
    } catch { /* This session can still start if storage is unavailable. */ }
    // The new player gets a separate autosave key and fresh runtime below.
    // Keep the mounted phone in place; unmounting it here can trigger a second
    // viewport-size calculation while Safari is dismissing the ID keyboard.
    setLoadError("");
    setSaveSlots([undefined, undefined, undefined]);
    setPlayerId(value);
    setSaveGeneration(generation);
    setOwn(dispatch(work, initialRuntime(work), "start"));
  };
  useEffect(() => {
    let active = true;
    if (creator || external) return;
    void Promise.all([0, 1, 2].map((index) => db.saves.get(slotId(index))))
      .then((slots) => { if (active) setSaveSlots(slots); })
      .catch(() => {});
    return () => { active = false; };
  }, [work.id, creator, external, playerId, saveGeneration]);
  const saveToSlot = async (index: number) => {
    const entry = { id: slotId(index), state: { ...runtimeRef.current, workId: work.id, revision: work.updatedAt } };
    await db.saves.put(entry);
    setSaveSlots((previous) => previous.map((slot, i) => i === index ? entry : slot));
  };
  const loadFromSlot = async (index: number) => {
    const entry = saveSlots[index] ?? await db.saves.get(slotId(index));
    if (!entry) return;
    const restored = { ...entry.state, workId: work.id, revision: work.updatedAt };
    runtimeRef.current = restored;
    setOwn(restored);
    onRuntime?.(restored);
    closeCurrentApp();
    setPanel("");
    setFolder("");
  };
  const update = (next: Runtime) => {
    runtimeRef.current = next;
    setOwn(next);
    onRuntime?.(next);
  };
  const kktNoticeThread = (notice: string): string | null => {
    if (!notice.startsWith("KKT|")) return null;
    const payload = notice.slice(4);
    const separator = payload.search(/[:：]/);
    return separator > 0 ? payload.slice(0, separator).trim() : null;
  };
  const clearKktThreadNotifications = (thread: string) => {
    if (!thread) return;
    const current = runtimeRef.current;
    const unreadKey = "kkt-unread-count:" + thread;
    const notifications = current.notifications.filter((notice) => kktNoticeThread(notice) !== thread);
    const storyState = { ...current.ui?.story };
    // Opening a chat clears notices already received, but must not mark a
    // not-yet-delivered follow-up as consumed. The second Minjeong notice
    // remains queued and fires automatically once this chat is no longer open.
    const next = {
      ...current,
      notifications,
      ui: {
        ...current.ui,
        story: storyState,
        kakao: { ...current.ui?.kakao, [unreadKey]: 0 },
      },
    };
    if (banner && kktNoticeThread(banner) === thread) setBanner("");
    update(next);
  };
  const handleKktIncomingMessage = (rawValue: UiValue, forcePopup = false) => {
    if (typeof rawValue !== "string") return;
    let incoming: { id?: string; thread?: string; text?: string; translation?: string };
    try { incoming = JSON.parse(rawValue) as typeof incoming; }
    catch { return; }
    if (!incoming.id || !incoming.thread || !incoming.text) return;
    if (handledKktEventsRef.current.has(incoming.id)) return;
    handledKktEventsRef.current.add(incoming.id);
    if (handledKktEventsRef.current.size > 300) {
      handledKktEventsRef.current = new Set([...handledKktEventsRef.current].slice(-150));
    }
    const current = runtimeRef.current;
    const unreadKey = "kkt-unread-count:" + incoming.thread;
    const view = appViewRef.current;
    const activeConversation = view.app === "kakao" && view.appThread === incoming.thread;
    // Count each incoming NPC message until the player opens this conversation
    // again. Messages arriving in the visible chat still count for the inbox,
    // matching the supplied KKT list reference after the player backs out.
    // Messages received while this exact chat is open are read immediately.
    // Do not leave a badge behind when the player later exits the conversation.
    const storedUnread = current.ui?.kakao?.[unreadKey];
    // The opening NPC line already has one unread item in the story data.
    // Seed the runtime counter from that metadata before counting the follow-up,
    // otherwise setting a runtime value of 1 accidentally hides the first unread.
    const templateUnread = (work.data.kakao || []).reduce((total, item) => {
      if (item.title !== incoming.thread || item.outgoing || item.read) return total;
      const rawUnread = item.meta?.unread;
      if (!rawUnread) return total;
      const value = Number(rawUnread);
      return total + (Number.isFinite(value) && value > 0 ? value : 1);
    }, 0);
    const previousUnread = storedUnread === undefined
      ? templateUnread
      : Math.max(0, Number(storedUnread) || 0);
    const shouldPopup = forcePopup || !activeConversation;
    const unreadCount = shouldPopup ? previousUnread + 1 : 0;
    // Ordinary incoming messages are read immediately while their chat is open.
    // The two scripted opening messages are the exception: each must produce its
    // own ordered notification and unread increment, even if the first banner was tapped.
    const notifications = shouldPopup
      ? [...current.notifications, `KKT|${incoming.thread}:${incoming.text}`]
      : current.notifications.filter((notice) => kktNoticeThread(notice) !== incoming.thread);
    if (!shouldPopup && activeConversation && banner && kktNoticeThread(banner) === incoming.thread) setBanner("");
    update({
      ...current,
      notifications,
      ui: {
        ...current.ui,
        kakao: { ...current.ui?.kakao, [unreadKey]: unreadCount },
      },
    });
  };
  useEffect(() => {
    let active = true;
    if (creator || external) return;
    void db.saves
      .get(autoSaveId)
      .then((saved) => {
        if (!active) return;
        if (saved && saved.state.revision === work.updatedAt)
          setOwn(saved.state);
        else {
          setOwn(dispatch(work, initialRuntime(work), "start"));
          if (saved) setLoadError("作品已更新，已开始新的进度。");
        }
        setReady(true);
      })
      .catch(() => {
        setOwn(dispatch(work, initialRuntime(work), "start"));
        setLoadError("无法读取本地存档。本次仍可游玩。");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [work.id, work.updatedAt, creator, external, autoSaveId]);
  useEffect(() => {
    if (!creator && !external && ready)
      void db.saves
        .put({ id: autoSaveId, state: own })
        .catch(() => setLoadError("存档失败，请检查浏览器存储权限。"));
  }, [own, creator, work.id, autoSaveId, external, ready]);
  useEffect(() => {
    if (creator || !ready) return;
    const interval = setInterval(() => {
      const previous = runtimeRef.current;
      let next = advance(work, previous, 1000);
      let handledKktState = false;
      const newlyAddedNotices = next.notifications.slice(previous.notifications.length);
      if (newlyAddedNotices.length) {
        const removeIndexes = new Set<number>();
        const kakaoUi = { ...next.ui?.kakao };
        newlyAddedNotices.forEach((notice, offset) => {
          const thread = kktNoticeThread(notice);
          if (!thread) return;
          const unreadKey = "kkt-unread-count:" + thread;
          const view = appViewRef.current;
          if (view.app === "kakao" && view.appThread === thread) {
            // Only the matching visible NPC conversation consumes this silently.
            removeIndexes.add(previous.notifications.length + offset);
            kakaoUi[unreadKey] = 0;
          } else {
            // Another NPC's message must still pop up, even while KKT is open
            // on a different person. Keep the notice for the OS banner.
            kakaoUi[unreadKey] = Math.max(0, Number(kakaoUi[unreadKey] ?? 0)) + 1;
          }
          handledKktState = true;
        });
        if (handledKktState) {
          next = {
            ...next,
            notifications: next.notifications.filter((_, index) => !removeIndexes.has(index)),
            ui: { ...next.ui, kakao: kakaoUi },
          };
        }
      }
      runtimeRef.current = next;

      const changed =
        handledKktState ||
        next.time !== previous.time ||
        next.trace.join() !== previous.trace.join() ||
        next.notifications.join("\u0000") !== previous.notifications.join("\u0000") ||
        (next.scheduled?.length ?? 0) !== (previous.scheduled?.length ?? 0);

      if (changed) {
        update(next);
      } else if (
        work.mode !== "explore" &&
        (next.scheduled?.length ?? 0) > 0 &&
        Math.floor((next.elapsedMs ?? 0) / 5000) !==
          Math.floor((previous.elapsedMs ?? 0) / 5000)
      ) {
        // Preserve timer progress without forcing a full phone rerender every second.
        void db.saves
          .put({ id: autoSaveId, state: { ...next, workId: work.id, revision: work.updatedAt } })
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [creator, ready, work.id, work.updatedAt, work.mode, autoSaveId]);
  const event = (event: string, target: string) => {
    if (!creator) update(dispatch(work, runtimeRef.current, event, target));
  };
  const captureApp = () => {
    if (!app) return;
    const current = shell.current?.querySelector<HTMLElement>(".app-screen");
    if (!current) return;
    const snapshot = current.cloneNode(true) as HTMLElement;
    snapshot.style.transform = "none";
    snapshot.style.opacity = "1";
    snapshot.style.filter = "none";
    snapshot.style.borderRadius = "0";
    snapshot.querySelectorAll("audio").forEach((el) => el.remove());
    snapshot.querySelectorAll("video").forEach((el) => {
      el.removeAttribute("autoplay");
      el.removeAttribute("src");
    });
    snapshot.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    appSnapshots.current.set(app, snapshot);
    for (const id of appSnapshots.current.keys())
      if (!recent.includes(id) && id !== app) appSnapshots.current.delete(id);
  };
  const markKktOpeningAsSeen = () => {
    // The active KKT conversation is the only place where its messages are read
    // silently. Clear this conversation's unread badge and queued notices.
    clearKktThreadNotifications("金旼炡");
  };
  const open = (id: string, initialThread = "") => {
    if (!work.apps.some((a) => a.id === id && a.installed)) return;
    appViewRef.current = { app: id, appThread: initialThread };
    setActiveAppThread(initialThread);
    if (id === "kakao" && initialThread) clearKktThreadNotifications(initialThread);
    setAppOpenSequence((value) => value + 1);
    setApp(id);
    setRecent((v) => [id, ...v.filter((a) => a !== id)].slice(0, 8));
    setFolder("");
    setPanel("");
    onOpen?.(id);
    event("openApp", id);
  };
  const installedApps = work.apps.filter((a) => a.installed);
  const apps = installedApps.filter((a) => a.visible);
  useEffect(() => {
    if (!creator) void preloadOriginalIconFiles();
  }, [creator]);

  const unlock = (pin = "") => {
    if (!work.phone.passcode || pin === work.phone.passcode) {
      // Keep icon preloading in the background. Unlocking must not depend on
      // every image decode finishing, which can stall on mobile Safari.
      if (!creator) void preloadOriginalIconFiles();
      setPinError("");
      setLocked(false);
      setPinOpen(false);
      event("password", pin);
    } else {
      setPinError("密码不正确");
      setPinOpen(true);
    }
  };
  useEffect(() => {
    if (app && !work.apps.some((a) => a.id === app && a.installed)) closeCurrentApp();
  }, [app, work.apps]);
  const displayTime = creator ? work.phone.time : s.time || work.phone.time;
  const callDialogueStep = Number(s.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0);
  const igDmQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-queue-v8"])
    ? s.ui?.instagram?.["scandal-ig-dm-queue-v8"] as string[] : [];
  const igDmVisibleCount = Number(s.ui?.instagram?.["scandal-ig-dm-visible-count-v8"] ?? 0);
  const igDmPopupCount = Number(s.ui?.instagram?.["scandal-ig-dm-popup-count-v8"] ?? 0);
  const igDmBatchStarted = s.ui?.instagram?.["scandal-ig-dm-batch-started-v8"] === true;
  const igDmReplyQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-reply-queue-v8"])
    ? s.ui?.instagram?.["scandal-ig-dm-reply-queue-v8"] as string[] : [];
  const igDmReplyCount = Number(s.ui?.instagram?.["scandal-ig-dm-reply-count-v8"] ?? 0);
  const igDmReplyPopupCount = Number(s.ui?.instagram?.["scandal-ig-dm-reply-popup-count-v8"] ?? 0);
  const startInstagramDmAfterCall = (current: Runtime): Runtime => {
    const instagramUi = current.ui?.instagram || {};
    const next = dispatch(
      work,
      { ...current, incomingCall: null },
      "callEnded",
      "scandal-call",
    );
    next.ui = {
      ...next.ui,
      kakao: {
        ...next.ui?.kakao,
        "scandal-call-decline-messages-finished-v6": false,
      },
      instagram: {
        ...instagramUi,
        "scandal-ig-dm-batch-started-v8": true,
        "scandal-ig-dm-queue-v8": createInstagramFanDmBatch(),
        "scandal-ig-dm-visible-count-v8": 0,
        "scandal-ig-dm-popup-count-v8": 0,
        "scandal-ig-dm-replies-v8": [],
        "scandal-ig-dm-reply-queue-v8": [],
        "scandal-ig-dm-reply-count-v8": 0,
        "scandal-ig-dm-reply-popup-count-v8": 0,
        "scandal-ig-dm-screen-active-v8": false,
        "scandal-ig-open-thread-v8": "",
        "scandal-ig-active-thread-v1": "",
      },
    };
    return next;
  };
  useEffect(() => {
    if (creator || s.ui?.kakao?.["convenience-store-event-finished-v5"] !== true) return;
    const current = runtimeRef.current;
    const storyState = current.ui?.story || {};
    if (storyState["scandal-news-countdown-started-v5"] === true ||
      storyState["scandal-news-pushed-v5"] === true) return;
    update({
      ...current,
      ui: {
        ...current.ui,
        story: { ...storyState, "scandal-news-countdown-started-v5": true },
      },
    });
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-news-pushed-v5"] === true) return;
      const twitterName = work.apps.find((a) => a.id === "twitter")?.name || "X";
      const newsNotice = `${twitterName}:突发新闻：疑似 aespa Winter 昨夜与女性同行的模糊照片正在传播`;
      update({
        ...latest,
        date: "2026-10-28",
        time: "14:06",
        notifications: [...latest.notifications, newsNotice],
        ui: {
          ...latest.ui,
          story: {
            ...latestStory,
            "rumor-day-started": true,
            "scandal-news-pushed-v5": true,
            "scandal-kkt-first-notice-v5": false,
            "scandal-kkt-second-notice-v5": false,
          },
          twitter: { ...latest.ui?.twitter, "rumor-news-unlocked-v6": true },
          kakao: {
            ...latest.ui?.kakao,
            "scandal-call-result-v5": "",
            "scandal-precall-started-v5": false,
            "scandal-precall-delivered-v5": false,
          },
        },
      });
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [creator, s.ui?.kakao?.["convenience-store-event-finished-v5"]]);

  useEffect(() => {
    if (
      creator ||
      s.ui?.story?.["scandal-news-pushed-v5"] !== true ||
      s.ui?.threads?.["rumor-news-unlocked-v6"] === true
    ) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      if (latest.ui?.story?.["scandal-news-pushed-v5"] !== true) return;
      update({
        ...latest,
        ui: {
          ...latest.ui,
          threads: {
            ...latest.ui?.threads,
            "rumor-news-unlocked-v6": true,
          },
        },
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [creator, s.ui?.story?.["scandal-news-pushed-v5"], s.ui?.threads?.["rumor-news-unlocked-v6"]]);

  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-news-pushed-v5"] !== true) return;
    const latest = runtimeRef.current;
    const kakao = latest.ui?.kakao || {};
    if (kakao["scandal-kkt-opening-sequence-started-v1"] === true) return;
    const secondNoticeAlreadySent =
      latest.ui?.story?.["scandal-kkt-second-notice-v5"] === true;
    update({
      ...latest,
      ui: {
        ...latest.ui,
        kakao: {
          ...kakao,
          "scandal-kkt-opening-sequence-started-v1": true,
          "scandal-kkt-opening-sequence-delivered-v1": secondNoticeAlreadySent,
        },
      },
    });
  }, [creator, s.ui?.story?.["scandal-news-pushed-v5"]]);

  // Deliver the two KKT notices in order even when the chat is open. The active
  // conversation only determines whether a notification/unread badge is needed.
  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-news-pushed-v5"] !== true ||
      s.ui?.story?.["scandal-kkt-first-notice-v5"] === true) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-first-notice-v5"] === true) return;
      const thread = "金旼炡";
      const text = "어디야?";
      const sentRaw = latest.ui?.kakao?.["mymyKktSentV3"];
      const sent = Array.isArray(sentRaw) ? sentRaw.filter((item): item is string => typeof item === "string") : [];
      const alreadySent = sent.some((raw) => {
        try {
          const row: unknown = JSON.parse(raw);
          return Array.isArray(row) && row[0] === thread && row[1] === text && row[3] === "npc";
        } catch { return false; }
      });
      const activeConversation = appViewRef.current.app === "kakao" && appViewRef.current.appThread === thread;
      const notifications = activeConversation ? latest.notifications : [...latest.notifications, `KKT|${thread}:${text}`];
      update({
        ...latest,
        notifications,
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-first-notice-v5": true },
          kakao: {
            ...latest.ui?.kakao,
            "mymyKktSentV3": alreadySent ? sent : [...sent, JSON.stringify([thread, text, "20:18", "npc", "你在哪里？"])],
            "kkt-unread-count:金旼炡": activeConversation ? 0 : Math.max(
              0,
              Number(latest.ui?.kakao?.["kkt-unread-count:金旼炡"] ?? 0),
            ) + 1,
          },
        },
      });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [creator, s.ui?.story?.["scandal-news-pushed-v5"], s.ui?.story?.["scandal-kkt-first-notice-v5"]]);

  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-kkt-first-notice-v5"] !== true ||
      s.ui?.story?.["scandal-kkt-second-notice-v5"] === true) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-second-notice-v5"] === true) return;
      const thread = "金旼炡";
      const text = "혼자 있어?";
      const sentRaw = latest.ui?.kakao?.["mymyKktSentV3"];
      const sent = Array.isArray(sentRaw) ? sentRaw.filter((item): item is string => typeof item === "string") : [];
      const alreadySent = sent.some((raw) => {
        try {
          const row: unknown = JSON.parse(raw);
          return Array.isArray(row) && row[0] === thread && row[1] === text && row[3] === "npc";
        } catch { return false; }
      });
      const activeConversation = appViewRef.current.app === "kakao" && appViewRef.current.appThread === thread;
      const notifications = activeConversation ? latest.notifications : [...latest.notifications, `KKT|${thread}:${text}`];
      update({
        ...latest,
        notifications,
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-second-notice-v5": true },
          kakao: {
            ...latest.ui?.kakao,
            "mymyKktSentV3": alreadySent ? sent : [...sent, JSON.stringify([thread, text, "20:19", "npc", "你一个人吗？"])],
            "scandal-kkt-opening-sequence-delivered-v1": true,
            "kkt-unread-count:金旼炡": activeConversation ? 0 : Math.max(
              0,
              Number(latest.ui?.kakao?.["kkt-unread-count:金旼炡"] ?? 0),
            ) + 1,
          },
        },
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [creator, s.ui?.story?.["scandal-kkt-first-notice-v5"], s.ui?.story?.["scandal-kkt-second-notice-v5"]]);
  // Treat the first message as delivered once the timed story event completes.
  // Use a boolean dependency, not the notifications array: dismissing/opening the
  // first banner must not cancel or restart the second message's scheduled delivery.
  const firstOpeningNoticeDelivered =
    s.variables?.["kkt-opening-first-notice-delivered-v1"] === true ||
    s.completed.includes("kkt-first-message-after-unlock");

  useEffect(() => {
    const hasOpeningChat = (work.data.kakao || []).some(
      (item) => item.id === "kkt-minjeong-opening-01",
    );
    if (
      creator ||
      !hasOpeningChat ||
      !firstOpeningNoticeDelivered ||
      s.time?.startsWith("14:") ||
      s.ui?.kakao?.["scandal-precall-started-v5"] === true ||
      s.ui?.kakao?.["mymyKktOpeningFollowupNoticeHandledV1"] === true
    ) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestKakao = latest.ui?.kakao || {};
      const latestFirstOpeningNoticeDelivered =
        latest.variables?.["kkt-opening-first-notice-delivered-v1"] === true ||
        latest.completed.includes("kkt-first-message-after-unlock");
      if (
        !latestFirstOpeningNoticeDelivered ||
        latest.time?.startsWith("14:") ||
        latestKakao["scandal-precall-started-v5"] === true ||
        latestKakao["mymyKktOpeningFollowupNoticeHandledV1"] === true
      ) return;
      const saved = latestKakao["mymyKktSentV3"];
      const sent = Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string") : [];
      const text = "나 오늘 집에 좀 늦게 들어갈 것 같아.";
      const alreadyInChat = sent.some((raw) => {
        try {
          const row: unknown = JSON.parse(raw);
          return Array.isArray(row) && row[0] === "金旼炡" && row[1] === text && row[3] === "npc";
        } catch { return false; }
      });
      const nextSent = alreadyInChat
        ? sent
        : [...sent, JSON.stringify(["金旼炡", text, "20:17", "npc", "我今天可能会晚点回家。"])];
      update({
        ...latest,
        ui: {
          ...latest.ui,
          kakao: {
            ...latestKakao,
            "mymyKktSentV3": nextSent,
            "mymyKktOpeningFollowupNoticeHandledV1": true,
          },
        },
      });
      handleKktIncomingMessage(JSON.stringify({
        id: "minjeong-opening-followup-20-17-v1",
        thread: "金旼炡",
        text,
        translation: "我今天可能会晚点回家。",
        time: "20:17",
      }), true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [
    creator,
    work.id,
    s.time,
    s.ui?.kakao?.["scandal-precall-started-v5"],
    s.ui?.kakao?.["mymyKktOpeningFollowupNoticeHandledV1"],
    firstOpeningNoticeDelivered,
  ]);

  // If either lead-in message arrives while Minjeong's chat is visible, consume
  // its deferred system notice immediately so leaving the chat does not pop a stale message.
  useEffect(() => {
    if (
      creator ||
      app !== "kakao" ||
      appThread !== "金旼炡" ||
      s.ui?.kakao?.["scandal-precall-started-v5"] !== true
    ) return;
    const saved = s.ui?.kakao?.["mymyKktSentV3"];
    const sent = Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string") : [];
    const hasNpcLine = (text: string) => sent.some((raw) => {
      try {
        const row: unknown = JSON.parse(raw);
        return Array.isArray(row) && row[0] === "金旼炡" && row[1] === text && row[3] === "npc";
      } catch { return false; }
    });
    const latest = runtimeRef.current;
    const latestStory = latest.ui?.story || {};
    const firstDelivered = hasNpcLine("어디야?");
    const secondDelivered = hasNpcLine("혼자 있어?");
    const nextStory = {
      ...latestStory,
      ...(firstDelivered ? { "scandal-kkt-first-notice-v5": true } : {}),
      ...(secondDelivered ? { "scandal-kkt-second-notice-v5": true } : {}),
    };
    if (
      nextStory["scandal-kkt-first-notice-v5"] === latestStory["scandal-kkt-first-notice-v5"] &&
      nextStory["scandal-kkt-second-notice-v5"] === latestStory["scandal-kkt-second-notice-v5"]
    ) return;
    const notifications = latest.notifications.filter((notice) => kktNoticeThread(notice) !== "金旼炡");
    if (banner && kktNoticeThread(banner) === "金旼炡") setBanner("");
    update({
      ...latest,
      notifications,
      ui: {
        ...latest.ui,
        story: nextStory,
        kakao: { ...latest.ui?.kakao, "kkt-unread-count:金旼炡": 0 },
      },
    });
  }, [
    creator,
    app,
    appThread,
    s.ui?.kakao?.["scandal-precall-started-v5"],
    s.ui?.kakao?.["mymyKktSentV3"],
    s.ui?.story?.["scandal-kkt-first-notice-v5"],
    s.ui?.story?.["scandal-kkt-second-notice-v5"],
  ]);

  // The call countdown starts only after the second pre-call KKT line has
  // been delivered while the player is viewing that exact conversation. If
  // they leave during the three-second wait, cancel it and restart on return.
  useEffect(() => {
    if (
      creator ||
      s.ui?.kakao?.["scandal-precall-delivered-v5"] !== true ||
      app !== "kakao" ||
      appThread !== "金旼炡"
    ) return;
    const current = runtimeRef.current;
    const storyState = current.ui?.story || {};
    if (storyState["scandal-call-triggered-v5"] === true || current.incomingCall) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      const viewingKktThread =
        appViewRef.current.app === "kakao" &&
        appViewRef.current.appThread === "金旼炡";
      if (
        !viewingKktThread ||
        latestStory["scandal-call-triggered-v5"] === true ||
        latest.incomingCall ||
        latest.ui?.kakao?.["scandal-precall-delivered-v5"] !== true
      ) return;
      update({
        ...latest,
        incomingCall: { caller: "金旼炡", target: "scandal-call", status: "ringing" },
        ui: {
          ...latest.ui,
          story: {
            ...latestStory,
            "scandal-call-countdown-started-v5": true,
            "scandal-call-triggered-v5": true,
            "scandal-call-dialogue-step-v5": 0,
          },
        },
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [
    creator,
    app,
    appThread,
    s.ui?.kakao?.["scandal-precall-delivered-v5"],
    s.ui?.story?.["scandal-call-triggered-v5"],
  ]);
  useEffect(() => {
    if (creator || s.incomingCall?.target !== "scandal-call" ||
      s.incomingCall.status !== "answered") return;
    if (![0, 3, 5].includes(callDialogueStep)) return;
    const nextStep = callDialogueStep === 0 ? 1 : callDialogueStep === 3 ? 4 : 6;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      if (current.incomingCall?.target !== "scandal-call" ||
        current.incomingCall.status !== "answered" ||
        Number(current.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0) !== callDialogueStep) return;
      update({
        ...current,
        ui: {
          ...current.ui,
          story: { ...current.ui?.story, "scandal-call-dialogue-step-v5": nextStep },
        },
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, s.incomingCall?.target, s.incomingCall?.status, callDialogueStep]);

  // Show each player reply option one second after the preceding NPC line
  // appears. The delay belongs before the option is visible, not after tapping it.
  useEffect(() => {
    setCallReplyVisible(false);
    if (
      creator ||
      s.incomingCall?.target !== "scandal-call" ||
      s.incomingCall.status !== "answered" ||
      (callDialogueStep !== 1 && callDialogueStep !== 4)
    ) return;
    const expectedStep = callDialogueStep;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      if (
        current.incomingCall?.target === "scandal-call" &&
        current.incomingCall.status === "answered" &&
        Number(current.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0) === expectedStep
      ) setCallReplyVisible(true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, s.incomingCall?.target, s.incomingCall?.status, callDialogueStep]);
  // The final in-call line is the end of the scripted conversation. Hang up
  // automatically, then start the one-by-one Instagram DM influx.
  useEffect(() => {
    if (creator || s.incomingCall?.target !== "scandal-call" ||
      s.incomingCall.status !== "answered" || callDialogueStep < 6) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      if (current.incomingCall?.target !== "scandal-call" ||
        current.incomingCall.status !== "answered" ||
        Number(current.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0) < 6) return;
      update(startInstagramDmAfterCall(current));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [creator, s.incomingCall?.target, s.incomingCall?.status, callDialogueStep]);

  // If the player declines, let the fixed KakaoTalk exchange finish first.
  useEffect(() => {
    if (creator ||
      s.ui?.kakao?.["scandal-call-decline-messages-finished-v6"] !== true ||
      igDmBatchStarted) return;
    const current = runtimeRef.current;
    if (current.ui?.instagram?.["scandal-ig-dm-batch-started-v8"] === true) return;
    update(startInstagramDmAfterCall(current));
  }, [creator, s.ui?.kakao?.["scandal-call-decline-messages-finished-v6"], igDmBatchStarted]);

  // The Instagram inbox fills one conversation per second.
  useEffect(() => {
    if (creator || !igDmBatchStarted || igDmVisibleCount >= igDmQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-queue-v8"])
        ? instagramUi["scandal-ig-dm-queue-v8"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-visible-count-v8"] ?? 0);
      if (!queue[index] || index !== igDmVisibleCount) return;
      update({
        ...current,
        ui: {
          ...current.ui,
          instagram: { ...instagramUi, "scandal-ig-dm-visible-count-v8": index + 1 },
        },
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, igDmBatchStarted, igDmVisibleCount, igDmQueue.length]);

  // Notification pop-ups are a separate queue: one per two seconds.
  useEffect(() => {
    if (creator || !igDmBatchStarted || igDmPopupCount >= igDmQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-queue-v8"])
        ? instagramUi["scandal-ig-dm-queue-v8"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-popup-count-v8"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmPopupCount) return;
      let dm: InstagramFanDm;
      try { dm = JSON.parse(raw) as InstagramFanDm; }
      catch { return; }
      const notice = `IGDM|${dm.id}|${dm.handle}: ${dm.text} — ${dm.translation}`;
      const instagramDmScreenOpen =
        appViewRef.current.app === "instagram" &&
        instagramUi["scandal-ig-dm-screen-active-v8"] === true;
      update({
        ...current,
        notifications: instagramDmScreenOpen
          ? current.notifications
          : [...current.notifications, notice],
        ui: {
          ...current.ui,
          instagram: { ...instagramUi, "scandal-ig-dm-popup-count-v8": index + 1 },
        },
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [creator, igDmBatchStarted, igDmPopupCount, igDmQueue.length]);

  // Replies are written to the conversation view at one-second intervals.
  useEffect(() => {
    if (creator || igDmReplyCount >= igDmReplyQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-reply-queue-v8"])
        ? instagramUi["scandal-ig-dm-reply-queue-v8"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-reply-count-v8"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmReplyCount) return;
      let deliveredReply: { threadId: string };
      try { deliveredReply = JSON.parse(raw) as { threadId: string }; }
      catch { return; }
      if (typeof deliveredReply.threadId !== "string") return;
      const replies = Array.isArray(instagramUi["scandal-ig-dm-replies-v8"])
        ? instagramUi["scandal-ig-dm-replies-v8"] as string[] : [];
      const unreadRaw = instagramUi["scandal-ig-dm-unread-reply-ids-v2"];
      const unreadIds = Array.isArray(unreadRaw) ? unreadRaw.filter((id): id is string => typeof id === "string") : [];
      const viewingThisThread =
        instagramUi["scandal-ig-dm-screen-active-v8"] === true &&
        instagramUi["scandal-ig-active-thread-v1"] === deliveredReply.threadId;
      const nextUnreadIds = viewingThisThread
        ? unreadIds.filter((id) => id !== deliveredReply.threadId)
        : Array.from(new Set([...unreadIds, deliveredReply.threadId]));
      update({
        ...current,
        ui: {
          ...current.ui,
          instagram: {
            ...instagramUi,
            "scandal-ig-dm-replies-v8": [...replies, raw],
            "scandal-ig-dm-reply-count-v8": index + 1,
            "scandal-ig-dm-unread-reply-ids-v2": nextUnreadIds,
          },
        },
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, igDmReplyCount, igDmReplyQueue.length]);

  // Replies only trigger system pop-ups every two seconds.
  useEffect(() => {
    if (creator || igDmReplyPopupCount >= igDmReplyQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-reply-queue-v8"])
        ? instagramUi["scandal-ig-dm-reply-queue-v8"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-reply-popup-count-v8"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmReplyPopupCount) return;
      let message: { id: string; threadId: string; handle: string; text: string; translation: string; role: string };
      try { message = JSON.parse(raw) as typeof message; }
      catch { return; }
      const notice = `IGDM|${message.threadId}|${message.handle}: ${message.text} — ${message.translation}`;
      const instagramDmScreenOpen =
        appViewRef.current.app === "instagram" &&
        instagramUi["scandal-ig-dm-screen-active-v8"] === true;
      update({
        ...current,
        notifications: instagramDmScreenOpen
          ? current.notifications
          : [...current.notifications, notice],
        ui: {
          ...current.ui,
          instagram: {
            ...instagramUi,
            "scandal-ig-dm-reply-popup-count-v8": index + 1,
          },
        },
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [creator, igDmReplyPopupCount, igDmReplyQueue.length]);

  // IG DM notification banners remain visible while browsing Instagram.

  useEffect(() => {
    const readingInstagramDms =
      app === "instagram" &&
      s.ui?.instagram?.["scandal-ig-dm-screen-active-v8"] === true;
    if (!readingInstagramDms) return;

    const current = runtimeRef.current;
    const remainingNotifications = current.notifications.filter(
      (notice) => !notice.startsWith("IGDM|"),
    );
    if (remainingNotifications.length !== current.notifications.length) {
      update({ ...current, notifications: remainingNotifications });
    }
    setBannerQueue((queue) => queue.filter((notice) => !notice.startsWith("IGDM|")));
    setBanner((currentBanner) => currentBanner.startsWith("IGDM|") ? "" : currentBanner);
  }, [app, s.ui?.instagram?.["scandal-ig-dm-screen-active-v8"]]);

  const plugin = getApp(app);
  useEffect(() => {
    if (!ready) return;
    if (noticesSeen.current === null) {
      // Wait until the IndexedDB save has loaded so historical notifications
      // are not replayed as fresh pop-ups on every app launch.
      noticesSeen.current = [...s.notifications];
      return;
    }
    const previousCounts = new Map<string, number>();
    for (const notice of noticesSeen.current) {
      previousCounts.set(notice, (previousCounts.get(notice) ?? 0) + 1);
    }
    const newNotices = s.notifications.filter((notice) => {
      const remaining = previousCounts.get(notice) ?? 0;
      if (remaining > 0) {
        previousCounts.set(notice, remaining - 1);
        return false;
      }
      return true;
    });
    noticesSeen.current = [...s.notifications];
    if (!locked && work.phone.notifications && newNotices.length) {
      const isOpeningKktNotice = (notice: string) =>
        notice === "KKT|金旼炡: 아직 안 잤어?" ||
        notice.startsWith("KKT|金旼炡:나 오늘 집에 좀 늦게 들어갈 것 같아.") ||
        notice === "KKT|金旼炡:어디야?" ||
        notice === "KKT|金旼炡:혼자 있어?";
      // Preserve the existing latest-notice behavior for unrelated apps. Only
      // queue this two-message KKT opening so its second banner cannot replace
      // the first one before it has been shown.
      const keepOpeningSequenceInOrder =
        isOpeningKktNotice(banner) ||
        bannerQueue.some(isOpeningKktNotice) ||
        newNotices.some(isOpeningKktNotice) ||
        bannerQueue.length > 0;
      if (keepOpeningSequenceInOrder) {
        if (!banner && bannerQueue.length === 0) {
          setBanner(newNotices[0]);
          if (newNotices.length > 1) {
            setBannerQueue((queue) => [...queue, ...newNotices.slice(1)]);
          }
        } else {
          setBannerQueue((queue) => [...queue, ...newNotices]);
        }
      } else {
        setBanner(newNotices.at(-1) || "");
      }
    }
  }, [ready, s.notifications, locked, work.phone.notifications, banner, bannerQueue]);

  // Show notification banners one at a time. A new message queues behind the
  // visible banner instead of replacing it before the player can see it.
  useEffect(() => {
    if (banner || !bannerQueue.length) return;
    setBanner(bannerQueue[0]);
    setBannerQueue((queue) => queue.slice(1));
  }, [banner, bannerQueue]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(
      () => setBanner(""),
      banner.startsWith("KKT|") ? 2000 : 4500,
    );
    return () => window.clearTimeout(timer);
  }, [banner]);
  const dismissNotice = (index: number) =>
    update({
      ...runtimeRef.current,
      notifications: runtimeRef.current.notifications.filter(
        (_, i) => i !== index,
      ),
    });
  const visibleNoticeEntries = s.notifications
    .map((text, index) => ({ text, index }));
  const visibleNotices = visibleNoticeEntries.map((entry) => entry.text);
  const dismissVisibleNotice = (visibleIndex: number) => {
    const originalIndex = visibleNoticeEntries[visibleIndex]?.index;
    if (originalIndex !== undefined) dismissNotice(originalIndex);
  };
  const openNotification = (noticeText: string) => {
    const notification = notificationContent(noticeText, work.apps);
    if (notification.appId === "instagram" && "threadId" in notification && notification.threadId) {
      const current = runtimeRef.current;
      update({
        ...current,
        ui: {
          ...current.ui,
          instagram: {
            ...current.ui?.instagram,
            mymyTab: "私信",
            "scandal-ig-open-thread-v8": notification.threadId,
          },
        },
      });
      open("instagram");
    } else if (installedApps.some((a) => a.id === notification.appId)) {
      open(notification.appId, notification.appId === "kakao" ? notification.title : "");
    } else if (installedApps.some((a) => a.id === "messages")) {
      open("messages");
    } else {
      setPanel("notification");
    }
  };
  if (!ready) return <div className="phone-loading">正在恢复进度…</div>;
  return (
    <div
      ref={shell}
      style={{
        "--phone-scale": deviceScale,
        "--phone-input-font-size": `${16 / Math.max(deviceScale, 0.4)}px`,
        "--kkt-composer-font-size": `${12 / Math.max(deviceScale, 0.4)}px`,
        "--kkt-composer-min-height": `${34 / Math.max(deviceScale, 0.4)}px`,
        "--kkt-composer-max-height": `${72 / Math.max(deviceScale, 0.4)}px`,
      } as CSSProperties}
      className={`phone-shell ios18 ${work.phone.theme === "dark" ? "dark-phone" : ""}`}
    >
        <div
          className={`phone-screen wallpaper-${work.phone.wallpaper} ${locked ? "is-locked" : ""} ${app ? "in-app" : ""}`}
          onFocusCapture={(event) => scrollOnEditableFocus(event.target)}
          data-app={app}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            gestureConsumed.current = false;
            const button = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-app-id]",
            );
            if (button) {
              pressTimer.current = setTimeout(() => {
                gestureConsumed.current = true;
                setContextApp(button.dataset.appId || "");
              }, 550);
            }
            const box = e.currentTarget.getBoundingClientRect(),
              x = (e.clientX - box.left) / deviceScale,
              y = (e.clientY - box.top) / deviceScale;
            gesture.current = {
              x,
              y,
              time: Date.now(),
              zone: y < 58 ? "top" : y > 818 ? "bottom" : locked ? "lock" : "",
            };
          }}
          onPointerMove={(e) => {
            if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5)
              clearTimeout(pressTimer.current);
          }}
          onPointerCancel={() => clearTimeout(pressTimer.current)}
          onPointerUp={(e) => {
            clearTimeout(pressTimer.current);
            const box = e.currentTarget.getBoundingClientRect(),
              y = (e.clientY - box.top) / deviceScale,
              g = gesture.current;
            const dy = y - g.y;
            if (g.zone === "top" && dy > 65)
              setPanel(g.x > 230 ? "control" : "notification");
            else if ((g.zone === "bottom" || g.zone === "lock") && dy < -55) {
              gestureConsumed.current = true;
              if (!locked) captureApp();
              if (panel) {
                setPanel("");
              } else if (locked) {
                beginUnlock();
              } else if (g.zone === "bottom" && Date.now() - g.time > 450) {
                captureApp();
                setPanel("switcher");
              } else {
                closeCurrentApp();
                setPanel("");
                setFolder("");
              }
            }
          }}
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest(
              ".home-app-grid button,.dock button",
            );
            if (target) {
              setLaunchOrigin(
                readLauncherOrigin(target as HTMLElement, e.currentTarget),
              );
            }
          }}
        >
          <div className="wallpaper-orb orb-one" />
          <div className="wallpaper-orb orb-two" />
          <div className="status-bar">
            <button
              onClick={() =>
                setPanel(panel === "notification" ? "" : "notification")
              }
              className="status-time"
              aria-label="通知中心"
            >
              {displayTime}
              <StatusGlyph kind="silent" />
            </button>
            <div className="dynamic-island" />
            <button
              className="signals"
              onClick={() => setPanel(panel === "control" ? "" : "control")}
              aria-label="控制中心"
            >
              <StatusGlyph kind="cellular" />
              <StatusGlyph kind="wifi" />
              <span
                className={`ios-battery${work.phone.battery <= 20 ? " low-battery" : ""}`}
              >
                <span style={{ width: `${work.phone.battery}%` }} />
                <b>{work.phone.battery}</b>
              </span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {locked && !(quickCamera && app === "camera") ? (
              <DeviceLock
                key={resumePromptKey}
                canContinue={ready}
                onNewPlayer={startNewPlayer}
                phoneScale={deviceScale}
                work={
                  s.date
                    ? { ...work, phone: { ...work.phone, date: s.date } }
                    : work
                }
                time={displayTime}
                pinOpen={pinOpen}
                setPinOpen={setPinOpen}
                error={pinError}
                onUnlock={unlock}
                onLight={() => setPanel("light")}
                onCamera={() => {
                  setQuickCamera(true);
                  open("camera");
                }}
              />
            ) : app && app !== "appstore" ? (
              <AppWindow
                key={app + ":" + appOpenSequence}
                className={`app-screen engine-${plugin.engine} skin-${app}`}
                creator={creator}
                origin={launchOrigin}
              >
                <AppContent
                  app={plugin}
                  name={
                    work.apps.find((a) => a.id === app)?.name ?? plugin.name
                  }
                  items={[
                    ...(work.data[app] ?? []),
                    ...(s.messages[app] ?? []),
                  ]}
                  creator={creator}
                  state={s}
                  onRead={(id) => event("read", id)}
                  onEdit={(item) => onEdit?.(app, item)}
                  onAdd={() => onAdd?.(app)}
                  onBack={closeCurrentApp}
                  onSettings={onSettings}
                  saveSlots={saveSlots}
                  onSaveSlot={saveToSlot}
                  onLoadSlot={loadFromSlot}
                  onUi={(key, value) => {
                    if (app === "kakao" && key === "kkt-incoming-message-event") {
                      handleKktIncomingMessage(value);
                      return;
                    }
                    if (app === "kakao" && key === "kkt-clear-thread-notifications" && typeof value === "string") {
                      clearKktThreadNotifications(value);
                      return;
                    }
                    const current = runtimeRef.current;
                    update(
                      dispatch(
                        work,
                        {
                          ...current,
                          ui: {
                            ...current.ui,
                            [app]: { ...current.ui?.[app], [key]: value },
                          },
                        },
                        "variable",
                        `ui:${app}:${key}`,
                      ),
                    );
                  }}
                  work={work}
                  initialThread={appThread}
                  playerId={playerId}
                  onActiveThread={setActiveAppThread}
                  onKktOpeningSeen={markKktOpeningAsSeen}
                  onRequestCall={() => {
                    const current = runtimeRef.current;
                    const storyState = current.ui?.story || {};
                    // The X news event is the prerequisite. Do not require the
                    // second OS notification here: opening the first KKT alert
                    // is how players enter this conversation, and the next OS
                    // alert is deliberately held back while the chat is open.
                    if (storyState["scandal-news-pushed-v5"] !== true ||
                      storyState["scandal-call-triggered-v5"] === true ||
                      current.ui?.kakao?.["scandal-precall-started-v5"] === true ||
                      current.incomingCall) return;
                    update({
                      ...current,
                      ui: {
                        ...current.ui,
                        story: {
                          ...storyState,
                          "scandal-kkt-chat-opened-v5": true,
                          // Both NPC lines will arrive inside this open chat.
                          // Consume OS-notice flags so no popup blocks tapping.
                          "scandal-kkt-first-notice-v5": true,
                          "scandal-kkt-second-notice-v5": true,
                        },
                        kakao: {
                          ...current.ui?.kakao,
                          "scandal-precall-started-v5": true,
                          "scandal-precall-delivered-v5": false,
                        },
                      },
                    });
                  }}
                />
              </AppWindow>
            ) : (
              <HomeLauncher
                key={
                  "home-" + homeRequest + (app === "appstore" ? "store" : "")
                }
                storeOpen={app === "appstore"}
                closeStore={closeCurrentApp}
                work={work}
                layout={deviceLayout.layout}
                change={deviceLayout.change}
                importLayout={deviceLayout.importLayout}
                error={deviceLayout.error}
                open={open}
                onFolder={setFolder}
                search={() => setPanel("search")}
                time={displayTime}
                icon={(a, small) => (
                  <AppIcon
                    key={a.id}
                    id={a.id}
                    name={small ? undefined : a.name}
                    small={small}
                    custom={a.icon}
                    date={a.id === "calendar" ? s.date || work.phone.date : undefined}
                    time={a.id === "clock" ? s.time : undefined}
                  />
                )}
                clearApp={(id) =>
                  update({
                    ...runtimeRef.current,
                    messages: Object.fromEntries(
                      Object.entries(runtimeRef.current.messages).filter(
                        ([app]) => app !== id,
                      ),
                    ),
                  })
                }
              />
            )}
          </AnimatePresence>
          {folder && (
            <div className="folder-overlay" onClick={() => setFolder("")}>
              <h2>{folder}</h2>
              <div className="folder-apps" onClick={(e) => e.stopPropagation()}>
                {apps
                  .filter((a) => a.folder === folder)
                  .map((a) => (
                    <button key={a.id} onClick={() => open(a.id)}>
                      <AppIcon id={a.id} name={a.name} custom={a.icon} />
                    </button>
                  ))}
              </div>
              <button className="glass-btn" onClick={() => setFolder("")}>
                关闭文件夹
              </button>
            </div>
          )}
          {panel === "control" && (
            <ControlCenter
              battery={work.phone.battery}
              network={work.phone.network}
              close={() => setPanel("")}
            />
          )}
          {panel && panel !== "control" && panel !== "switcher" && (
            <div
              className={`system-panel ${panel === "light" ? "flash-on" : ""}`}
            >
              <button className="panel-close" onClick={() => setPanel("")}>
                关闭 <ChevronLeft size={14} />
              </button>
              {panel === "notification" ? (
                <>
                  <h2>通知中心</h2>
                  {work.phone.notifications && visibleNotices.length ? (
                    <SystemNotifications
                      notices={visibleNotices}
                      apps={work.apps}
                      onOpen={(noticeText) => {
                        setPanel("");
                        if (locked) beginUnlock();
                        else openNotification(noticeText);
                      }}
                      onDismiss={dismissVisibleNotice}
                    />
                  ) : (
                    <p>没有新通知</p>
                  )}
                </>
              ) : panel === "search" ? (
                <>
                  <h2>搜索 App</h2>
                  <AppSearch apps={installedApps} open={open} />
                </>
              ) : (
                <h2>手电筒已打开</h2>
              )}
            </div>
          )}
          {!creator && s.choices.length > 0 && !locked && (
            <div className="story-overlay">
              <span className="eyebrow">故事来到一个岔路口</span>
              <h3>你会如何选择？</h3>
              {s.choices.map((c) => (
                <button
                  key={c.target}
                  onClick={() => update(choose(work, s, c.target))}
                >
                  {c.label}
                  <ArrowUp size={15} />
                </button>
              ))}
            </div>
          )}
          {!creator && s.endings.length > 0 && !locked && (
            <div className="story-overlay ending">
              <span className="eyebrow">ENDING · {s.endings.length}</span>
              <h2>故事在这里停泊。</h2>
              <p>{s.endings[s.endings.length - 1]}</p>
              <button
                onClick={() => {
                  update(dispatch(work, initialRuntime(work), "start"));
                  closeCurrentApp();
                  setLocked(true);
                }}
              >
                重新开始
              </button>
            </div>
          )}
          {!creator && s.incomingCall && (
            <div className={"incoming-call-screen" + (s.incomingCall.target === "scandal-call" && s.incomingCall.status === "answered" ? " incoming-call-screen-chat" : "")}>
              <small>
                {s.incomingCall.target === "scandal-call" && s.incomingCall.status === "answered"
                  ? "KakaoTalk · 通话中"
                  : s.incomingCall.status === "ringing"
                    ? "来电 · 作品内模拟"
                    : "通话中 · 作品内模拟"}
              </small>
              <div className="incoming-avatar">
                {s.incomingCall.caller === "金旼炡" ? (
                  <img src="/avatars/p3.jpg" alt="金旼炡" />
                ) : s.incomingCall.caller.slice(0, 1)}
              </div>
              <h2>{s.incomingCall.caller}</h2>
              <p className="incoming-call-kind">{s.incomingCall.status === "ringing" ? "移动电话 · 来电" : "正在通话"}</p>
              {s.incomingCall.status === "answered" &&
                (() => {
                  const record = work.data.phone?.find(
                    (i) => i.id === s.incomingCall?.target,
                  );
                  if (s.incomingCall?.target === "scandal-call") return null;
                  return record?.kind === "audio" && safeMedia(record.media) ? (
                    <audio controls src={safeMedia(record.media)} />
                  ) : (
                    <p>这是一通虚构来电。</p>
                  );
                })()}
              {s.incomingCall.target === "scandal-call" && s.incomingCall.status === "answered" && (
                <div className="call-chat-panel">
                  <div className="call-chat-log" aria-live="polite">
                    <div className="call-dialogue-row call-dialogue-npc">
                      <div className="call-dialogue-bubble">
                        <div>괜찮아, 걱정하지 마.</div>
                        <small>你别担心。</small>
                      </div>
                    </div>
                    {callDialogueStep >= 1 && (
                      <div className="call-dialogue-row call-dialogue-npc">
                        <div className="call-dialogue-bubble">
                          <div>내가 처리할게.</div>
                          <small>我来处理。</small>
                        </div>
                      </div>
                    )}
                    {callDialogueStep >= 3 && (
                      <div className="call-dialogue-row call-dialogue-player">
                        <div className="call-dialogue-bubble">
                          <div>알겠어.</div>
                          <small>好。</small>
                        </div>
                      </div>
                    )}
                    {callDialogueStep >= 4 && (
                      <div className="call-dialogue-row call-dialogue-npc">
                        <div className="call-dialogue-bubble">
                          <div>집에 있어?</div>
                          <small>你在家吗？</small>
                        </div>
                      </div>
                    )}
                    {callDialogueStep >= 5 && (
                      <div className="call-dialogue-row call-dialogue-player">
                        <div className="call-dialogue-bubble">
                          <div>응.</div>
                          <small>嗯。</small>
                        </div>
                      </div>
                    )}
                    {callDialogueStep >= 6 && (
                      <div className="call-dialogue-row call-dialogue-npc">
                        <div className="call-dialogue-bubble">
                          <div>알겠어. 내가 갈게.</div>
                          <small>好，我来找你。</small>
                        </div>
                      </div>
                    )}
                  </div>
                  {(callDialogueStep === 1 || callDialogueStep === 4) && callReplyVisible && (
                    <div className="call-reply-options">
                      <button
                        type="button"
                        onClick={() => {
                          const current = runtimeRef.current;
                          const currentStep = Number(current.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0);
                          if (current.incomingCall?.target === "scandal-call" &&
                            current.incomingCall.status === "answered" &&
                            (currentStep === 1 || currentStep === 4)) {
                            const nextStep = currentStep === 1 ? 3 : 5;
                            setCallReplyVisible(false);
                            update({
                              ...current,
                              ui: {
                                ...current.ui,
                                story: { ...current.ui?.story, "scandal-call-dialogue-step-v5": nextStep },
                              },
                            });
                          }
                        }}
                      >
                        <span>{callDialogueStep === 1 ? "알겠어." : "응."}</span>
                        <small>{callDialogueStep === 1 ? "好。" : "嗯。"}</small>
                        <b>发送</b>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="incoming-actions">
                <button
                  className="decline-call"
                  onClick={() => {
                    const current = runtimeRef.current;
                    const call = current.incomingCall;
                    if (call) {
                      const isScandalCall = call.target === "scandal-call";
                      const wasAnswered = call.status === "answered";
                      const next = dispatch(
                        work,
                        { ...current, incomingCall: null },
                        isScandalCall && !wasAnswered ? "callDeclined" : call.status === "ringing" ? "callDeclined" : "callEnded",
                        call.target || call.caller,
                      );
                      if (isScandalCall) {
                        // Only an unanswered/declined call should trigger the
                        // "왜 전화 안 받아?" line. An answered manual hang-up
                        // continues the alternate follow-up without that accusation.
                        next.ui = {
                          ...next.ui,
                          kakao: {
                            ...next.ui?.kakao,
                            "scandal-call-result-v5": wasAnswered ? "answered-hangup" : "declined",
                            "scandal-call-decline-reply-needed-v6": false,
                            "scandal-call-decline-messages-finished-v6": false,
                          },
                          story: {
                            ...next.ui?.story,
                            "scandal-call-dialogue-step-v5": 0,
                          },
                        };
                      }
                      setCallReplyVisible(false);
                      update(next);
                    }
                  }}
                >
                  <PhoneIcon size={25} />
                  <span>
                    {s.incomingCall.status === "ringing" ? "拒接" : "挂断"}
                  </span>
                </button>
                {s.incomingCall.status === "ringing" && (
                  <button
                    className="accept-call"
                    onClick={() => {
                      const call = runtimeRef.current.incomingCall;
                      if (call) {
                        const next = dispatch(
                          work,
                          {
                            ...runtimeRef.current,
                            incomingCall: { ...call, status: "answered" },
                          },
                          "callAnswered",
                          call.target || call.caller,
                        );
                        if (call.target === "scandal-call") {
                          next.ui = {
                            ...next.ui,
                            story: { ...next.ui?.story, "scandal-call-dialogue-step-v5": 0 },
                          };
                        }
                        update(next);
                      }
                    }}
                  >
                    <PhoneIcon size={25} />
                    <span>接听</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {banner && !locked && (
            <motion.button
              className="device-banner"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.12}
              whileDrag={{ scale: 0.985 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -45 || info.velocity.y < -350) {
                  // Dismissing the banner hides only this visual toast. The
                  // underlying notification and the incoming-message queue remain.
                  setBanner("");
                }
              }}
              onClick={() => {
                const latest = banner;
                setBanner("");
                openNotification(latest);
              }}
            >
              <AppIcon
                id={notificationContent(banner, work.apps).appId}
                small
              />
              <span>
                <strong>{notificationContent(banner, work.apps).title}</strong>
                <span>{notificationContent(banner, work.apps).body}</span>
              </span>
            </motion.button>
          )}
          {panel === "switcher" && (
            <div className="device-switcher">
              <div className="switcher-cards">
                {recent
                  .filter(
                    (id) =>
                      installedApps.some((a) => a.id === id) &&
                      appSnapshots.current.has(id),
                  )
                  .map((id) => (
                    <button
                      className="recent-app-card"
                      key={id}
                      onClick={() => open(id)}
                    >
                      <span className="recent-app-label">
                        <AppIcon id={id} small />
                        <strong>
                          {work.apps.find((a) => a.id === id)?.name}
                        </strong>
                      </span>
                      <span className="recent-app-window">
                        <span
                          className="recent-app-snapshot"
                          aria-hidden="true"
                          inert
                          ref={(el) => {
                            const snapshot = appSnapshots.current.get(id);
                            if (el && snapshot)
                              el.replaceChildren(snapshot.cloneNode(true));
                          }}
                        />
                      </span>
                    </button>
                  ))}
              </div>
              <button className="switcher-done" onClick={() => setPanel("")}>
                完成
              </button>
            </div>
          )}
          {contextApp && (
            <div
              className="home-context-shade"
              onClick={() => setContextApp("")}
            >
              <div className="home-context-menu">
                <AppIcon id={contextApp} />
                <strong>
                  {work.apps.find((a) => a.id === contextApp)?.name}
                </strong>
                <button
                  onClick={() => {
                    open(contextApp);
                    setContextApp("");
                  }}
                >
                  打开 App
                </button>
                <button
                  onClick={() => {
                    setContextApp("");
                    setPanel("search");
                  }}
                >
                  在 App 库中查看
                </button>
                <button onClick={() => setContextApp("")}>取消</button>
              </div>
            </div>
          )}
          {loadError && (
            <button className="runtime-error" onClick={() => setLoadError("")}>
              {loadError}
            </button>
          )}
          <button
            className="home-indicator"
            aria-label="返回桌面"
            onClick={() => {
              if (gestureConsumed.current) return;
              if (locked) {
                beginUnlock();
                return;
              }
              captureApp();
              setHomeRequest((n) => n + 1);
              closeCurrentApp();
              setFolder("");
              setPanel("");
            }}
          />
          <div className="screen-dimmer" />
          <div className="hardware-reflection" />
        </div>
    </div>
  );
}
function AppSearch({
  apps,
  open,
}: {
  apps: Work["apps"];
  open: (id: string) => void;
}) {
  const [q, set] = useState("");
  return (
    <>
      <input
        autoFocus
        value={q}
        placeholder="App 名称"
        onChange={(e) => set(e.target.value)}
      />
      {apps
        .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
        .map((a) => (
          <button
            className="search-result"
            key={a.id}
            onClick={() => open(a.id)}
          >
            <AppIcon id={a.id} small />
            {a.name}
          </button>
        ))}
    </>
  );
}
function Media({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio controls src={src} />
    ) : item.kind === "video" ? (
      <video controls playsInline src={src} />
    ) : (
      <img loading="lazy" src={src} alt={item.title} />
    )
  ) : (
    <div
      className={`original-art art-${item.id.includes("ticket") ? "ticket" : "rain"}`}
    >
      <span>
        {item.id.includes("ticket") ? "城南 / SOUTHBOUND" : "after the rain"}
      </span>
      <strong>{item.id.includes("ticket") ? "09 · 01" : "雨 后"}</strong>
      <small>
        {item.id.includes("ticket")
          ? "16:30 · 一张未完成的约定"
          : "a little moment of quiet"}
      </small>
    </div>
  );
}
function AppContent({
  app,
  name,
  items,
  creator,
  state,
  onRead,
  onEdit,
  onAdd,
  onBack,
  onSettings,
  onUi,
  saveSlots,
  onSaveSlot,
  onLoadSlot,
  work,
  initialThread = "",
  playerId = "",
  onActiveThread,
  onKktOpeningSeen,
  onRequestCall,
}: {
  app: AppPlugin;
  name: string;
  items: Item[];
  creator: boolean;
  state: Runtime;
  onRead: (id: string) => void;
  onEdit: (item: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  onSettings?: () => void;
  onUi?: (key: string, value: UiValue) => void;
  saveSlots?: Array<{ id: string; state: Runtime } | undefined>;
  onSaveSlot?: (index: number) => void | Promise<void>;
  onLoadSlot?: (index: number) => void | Promise<void>;
  work: Work;
  initialThread?: string;
  playerId?: string;
  onActiveThread?: (thread: string) => void;
  onKktOpeningSeen?: () => void;
  onRequestCall?: () => void;
}) {
  const [detail, setDetail] = useState<Item | null>(null);
  const [thread, setThread] = useState(initialThread || "");
  useEffect(() => {
    if (app.id === "kakao" && thread === "金旼炡" && !creator) {
      onKktOpeningSeen?.();
      onRequestCall?.();
    }
  }, [app.id, thread, creator]);
  const [tab, setTab] = useState(app.tabs[0]);
  const [q, setQ] = useState("");
  const [pw, setPw] = useState("");
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [pwError, setPwError] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const shown = items
    .filter((i) => creator || visible(i, state))
    .filter((i) =>
      (i.title + i.body + i.sender).toLowerCase().includes(q.toLowerCase()),
    );
  const filtered =
    tab === "收藏"
      ? shown.filter((i) => i.favorite)
      : tab === app.tabs[0]
        ? shown
        : shown.filter((i) => i.folder === tab);
  const read = (i: Item) => {
    if (creator) {
      onEdit(i);
      return;
    }
    setDetail(i);
    if (!i.password || unlocks.includes(i.id)) onRead(i.id);
  };
  const chats = [...new Set(shown.map((i) => i.title))];
  const back = () => {
    if (detail) setDetail(null);
    else if (thread) setThread("");
    else onBack();
  };
  const Skin =
    app.id === "wechat"
      ? WeChatSkin
      : app.id === "whatsapp"
        ? WhatsAppSkin
        : (catalogSkins[app.id as keyof typeof catalogSkins] ?? null);
  const detailView = detail ? (
    <div className="phone-content detail-content">
      {detail.password && !creator && !unlocks.includes(detail.id) ? (
        <div className="locked-note">
          <LockKeyhole size={36} />
          <h3>这条内容已锁定</h3>
          <input
            type="password"
            placeholder="内容密码"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            onClick={() => {
              if (pw === detail.password) {
                setUnlocks([...unlocks, detail.id]);
                onRead(detail.id);
                setPwError("");
              } else setPwError("密码不正确");
            }}
          >
            解锁内容
          </button>
          <small>{pwError}</small>
        </div>
      ) : (
        <>
          <small className="detail-meta">
            {detail.time} · {detail.sender}
          </small>
          <h2>{detail.title}</h2>
          {(detail.media || ["media", "social"].includes(app.engine)) && (
            <Media item={detail} />
          )}
          <RichText value={detail.richText} fallback={detail.body} />
          <dl className="item-metadata">
            {getFields(app.id)
              .filter((f) => detail.meta?.[f.key])
              .map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{detail.meta[f.key]}</dd>
                </div>
              ))}
          </dl>
          {detail.folder && (
            <span className="folder-label">
              <Folder size={12} />
              {detail.folder}
            </span>
          )}
          {detail.comments.map((c, i) => (
            <p key={i} className="comment">
              {c}
            </p>
          ))}
        </>
      )}
    </div>
  ) : null;
  if (Skin)
    return (
      <>
        <div className="catalog-slot" hidden={!!detail}>
          <Suspense fallback={<div className="catalog-loading">正在打开…</div>}>
            <Skin
              appId={app.id}
              owner={work.phone.owner}
              virtualTime={state.time}
              playerId={playerId}
              ui={state.ui?.[app.id]}
              onUi={creator ? undefined : onUi}
              name={name}
              items={shown}
              creator={creator}
              onRead={onRead}
              onItem={read}
              onAdd={onAdd}
              onBack={onBack}
              thread={thread}
              onThread={(nextThread) => {
                setThread(nextThread);
                onActiveThread?.(nextThread);
                if (app.id === "kakao" && nextThread === "金旼炡" && !creator)
                  onKktOpeningSeen?.();
              }}
            />
          </Suspense>
        </div>
        {detail && (
          <Suspense fallback={<div className="catalog-loading">正在打开…</div>}>
            {socialDetailApps.has(app.id) &&
            (!detail.password || unlocks.includes(detail.id)) ? (
              <SocialDetail
                app={app.id}
                item={detail}
                back={back}
                owner={work.phone.owner}
                ui={state.ui?.[app.id]}
                onUi={onUi}
              />
            ) : nativeDetailApps.has(app.id) &&
              (!detail.password || unlocks.includes(detail.id)) ? (
              <NativeDetail app={app.id} item={detail} back={back} />
            ) : (
              <>
                <div className="app-nav">
                  <button aria-label="返回" onClick={back}>
                    <ChevronLeft size={23} />
                  </button>
                  <strong>{detail.title}</strong>
                  <span />
                </div>
                {detailView}
              </>
            )}
          </Suspense>
        )}
      </>
    );
  return (
    <>
      <div className="app-nav">
        <button onClick={back} aria-label="返回">
          <ChevronLeft size={23} />
          {detail || thread ? "返回" : ""}
        </button>
        <strong>{thread || name}</strong>
        <button
          onClick={
            creator
              ? onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(
                      ".app-screen .phone-search input",
                    )
                    ?.focus()
          }
          aria-label={creator ? "新增内容" : "搜索内容"}
        >
          {creator ? <Plus size={22} /> : <Search size={20} />}
        </button>
      </div>
      {app.id === "settings" && !detail ? (
        <NativeSettings
          work={work}
          items={items}
          creator={creator}
          onItem={read}
          onSettings={onSettings}
          saveSlots={saveSlots ?? [undefined, undefined, undefined]}
          onSaveSlot={onSaveSlot ?? (() => {})}
          onLoadSlot={onLoadSlot ?? (() => {})}
        />
      ) : app.id === "calculator" && !detail ? (
        <Suspense fallback={<div className="catalog-loading">正在打开…</div>}>
          <NativeCalculator
            items={shown}
            onRead={read}
            ui={state.ui?.[app.id]}
            onUi={onUi}
          />
        </Suspense>
      ) : detail ? (
        detailView
      ) : app.engine === "messaging" && thread ? (
        <div className="chat-content">
          <div className="chat-time">2026 年 9 月 1 日</div>
          {shown
            .filter((i) => i.title === thread)
            .map((i) => (
              <button
                key={i.id}
                className={`message-row ${i.outgoing ? "outgoing" : ""}`}
                onClick={() => (creator ? onEdit(i) : onRead(i.id))}
              >
                <span className="avatar">{i.sender.slice(0, 1)}</span>
                <span className="bubble">
                  {i.kind === "image" ||
                  i.kind === "audio" ||
                  i.kind === "video" ? (
                    <Media item={i} />
                  ) : i.kind === "transfer" ? (
                    <span className="transfer">
                      ¥ {i.body}
                      <small>虚构转账记录</small>
                    </span>
                  ) : (
                    i.body
                  )}
                  <small>
                    {i.time.slice(-5)} {i.read ? "✓✓" : ""}
                  </small>
                  {creator && (i.hidden || i.unlock) && (
                    <LockKeyhole size={12} />
                  )}
                </span>
              </button>
            ))}
          {creator ? (
            <button className="chat-compose" onClick={onAdd}>
              ＋ 添加一条消息
            </button>
          ) : (
            <div className="chat-compose muted">
              根据剧情推进，互动回复将在这里出现。
            </div>
          )}
        </div>
      ) : (
        <div
          className={`phone-content ${app.engine === "social" ? "feed-content" : ""}`}
        >
          {app.engine !== "media" && (
            <div className="phone-search">
              <Search size={15} />
              <input
                placeholder={`搜索${name}`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          {app.engine === "messaging" ? (
            chats.map((t) => {
              const list = shown.filter((i) => i.title === t),
                last = list[list.length - 1];
              return (
                <button
                  className="contact-row"
                  key={t}
                  onClick={() => {
                    setThread(t);
                    onRead(t);
                  }}
                >
                  <span className="avatar" style={{ background: app.color }}>
                    {t.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{t}</strong>
                    <p>{last.body}</p>
                  </span>
                  <small>{last.time.slice(-5)}</small>
                </button>
              );
            })
          ) : app.engine === "media" ? (
            <>
              <div className="media-heading">
                <h1>{tab}</h1>
                <p>{filtered.length} 个故事片段</p>
              </div>
              <div className="media-grid">
                {filtered.map((i) => (
                  <button key={i.id} onClick={() => read(i)}>
                    <Media item={i} />
                    <span>
                      {i.title} {creator && i.hidden ? "· 隐藏" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : app.engine === "social" ? (
            filtered.map((i) => (
              <article className="social-post" key={i.id}>
                <div className="post-author">
                  <span className="avatar" style={{ background: app.color }}>
                    {i.sender.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{i.sender}</strong>
                    <small>{i.time}</small>
                  </div>
                  <button aria-label="查看帖子详情" onClick={() => read(i)}>
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <button className="post-image" onClick={() => read(i)}>
                  <Media item={i} />
                </button>
                <div className="post-actions">
                  <button
                    aria-label="虚构点赞"
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((id) => id !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={22}
                      fill={likes.includes(i.id) ? "#d67670" : "none"}
                    />
                  </button>
                  <button aria-label="查看评论" onClick={() => read(i)}>
                    <MessageCircle size={22} />
                  </button>
                  <small>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)} 次虚构喜欢
                  </small>
                </div>
                <button className="post-text" onClick={() => read(i)}>
                  <strong>{i.title}</strong>
                  <p>{i.body}</p>
                </button>
              </article>
            ))
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                className={`record-row ${app.engine === "document" ? "document-row" : ""}`}
                onClick={() => read(i)}
              >
                <div className="record-symbol">
                  {app.engine === "records" ? (
                    <app.icon size={20} />
                  ) : (
                    <span>{i.title.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <strong>{i.title}</strong>
                  <p>{i.body.split("\n")[0]}</p>
                  <small>
                    {i.time} {i.folder && `· ${i.folder}`}
                  </small>
                </div>
                {i.password || i.hidden ? (
                  <LockKeyhole size={14} />
                ) : (
                  <ChevronLeft className="chevron-right" size={16} />
                )}
              </button>
            ))
          )}
          {!filtered.length && app.engine !== "messaging" && (
            <div className="empty-app">
              <app.icon size={36} />
              <h3>这一页还很安静</h3>
              <p>
                {creator
                  ? "添加属于这个 App 的故事内容。"
                  : "暂时没有可浏览的内容。"}
              </p>
            </div>
          )}
          {creator && (
            <button className="phone-add" onClick={onAdd}>
              <Plus size={15} />
              添加
              {app.engine === "messaging"
                ? "聊天"
                : app.engine === "social"
                  ? "帖子"
                  : app.engine === "media"
                    ? "素材"
                    : "内容"}
            </button>
          )}
        </div>
      )}
      {!detail &&
        !thread &&
        app.id !== "calculator" &&
        app.id !== "settings" && (
          <div className="app-tabs">
            {app.tabs.map((t, i) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {i === 0 ? (
                  <MessageCircle size={17} />
                ) : i === 1 ? (
                  <Search size={17} />
                ) : (
                  <UsersIcon />
                )}
                <span>{t}</span>
              </button>
            ))}
          </div>
        )}
    </>
  );
}
function UsersIcon() {
  return <PhoneIcon size={17} />;
}
