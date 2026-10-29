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
  DeviceKeyboard,
  KeyboardContext,
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
  { category: "support", text: "우리 민정이를 오래 좋아한 팬이에요. 혹시 정말 사귀는 사이라면 민정이 마음 많이 아껴 주세요 🤍", translation: "我是喜欢旼炡很久的粉丝。如果你们真的是恋人，希望你能好好珍惜她 🤍" },
  { category: "support", text: "민정이가 무대에서 늘 행복해 보였으면 좋겠어요. 옆에 있는 사람도 그 마음 지켜 줬으면 해요.", translation: "希望旼炡站在舞台上时一直幸福，也希望身边的人能守护她的心情。" },
  { category: "support", text: "여자친구분께 이런 말 해도 될지 모르겠지만 우리 민정이에게 상처 주지 말아 주세요.", translation: "不知道这样跟女朋友说合不合适，但请不要让我们旼炡受伤。" },
  { category: "support", text: "솔직히 놀랐지만 민정이가 웃을 수 있다면 그게 제일 중요하다고 생각해요.", translation: "说实话我很震惊，但如果旼炡能一直笑着，那才是最重要的。" },
  { category: "support", text: "팬이라서 마음이 복잡하긴 한데 두 사람이 서로 존중하는 사이였으면 좋겠어요.", translation: "身为粉丝心情确实复杂，但希望你们能互相尊重。" },
  { category: "support", text: "우리 애가 밖에서도 편하게 지낼 수 있도록 사생활은 지켜 줬으면 해요.", translation: "希望你能保护她的私人生活，让我们家孩子在外面也能自在生活。" },
  { category: "support", text: "민정이를 좋아하는 입장에서, 힘든 날에는 옆에서 편이 되어 주셨으면 해요.", translation: "作为喜欢旼炡的粉丝，希望她难过时你能站在她这边。" },
  { category: "support", text: "아직 사실인지 모르지만 혹시 맞다면 민정이한테 잘해 주세요. 진심이에요.", translation: "现在还不知道是不是真的，但如果是真的，请对旼炡好一点。我是真心的。" },
  { category: "support", text: "민정이가 쉬는 날만큼은 아이돌이 아니라 한 사람으로 행복했으면 해요.", translation: "希望旼炡休息的时候能作为普通人幸福地生活，而不只是偶像。" },
  { category: "support", text: "팬심 때문에 쉽게 받아들이긴 어렵지만 민정이가 좋은 사람과 있다면 응원하고 싶어요.", translation: "因为粉丝心情，一时很难接受，但如果旼炡和很好的人在一起，我也想支持她。" },
  { category: "support", text: "민정이는 늘 팬들에게 최선을 다했어요. 이제는 본인 행복도 잘 챙겼으면 좋겠어요.", translation: "旼炡一直很努力地对待粉丝，现在也希望她能照顾好自己的幸福。" },
  { category: "support", text: "혹시 기사 때문에 힘들어한다면 너무 미안해하지 않게 곁에서 응원해 주세요.", translation: "如果她因为新闻而难受，希望你能陪着她，让她不必觉得抱歉。" },
  { category: "support", text: "여자친구분도 갑자기 관심을 받게 돼 당황했을 것 같아요. 두 분 다 무사히 지나가길 바라요.", translation: "女朋友突然受到关注应该也很慌张，希望你们都能平安度过。" },
  { category: "support", text: "우리 민정이 사생활을 존중해 주는 분이면 좋겠어요. 그게 팬으로서 제 바람이에요.", translation: "希望你是尊重旼炡私人生活的人，这是我作为粉丝的愿望。" },
  { category: "support", text: "민정이가 누구와 있든 안전하고 존중받았으면 해요. 그건 꼭 부탁드리고 싶어요.", translation: "无论旼炡和谁在一起，我都希望她安全且受到尊重。这点真的拜托了。" },
  { category: "support", text: "이런 DM 보내서 부담스러울 수 있지만 민정이와 서로에게 좋은 사람이 되어 주세요.", translation: "突然发这样的私信可能会让你有压力，但希望你们能成为彼此的好伴侣。" },
  { category: "support", text: "사진 한 장으로 너무 많은 말이 나오는 게 속상해요. 두 분이 괜찮기만 했으면 해요.", translation: "因为一张照片冒出这么多议论，真的很难受。只希望你们都没事。" },
  { category: "support", text: "민정이가 힘들 때 혼자 버티지 않도록 잘 살펴봐 주세요. 팬으로서 부탁해요.", translation: "希望她难过时不用独自撑着，请多关心她。作为粉丝拜托了。" },
  { category: "support", text: "오래 좋아한 만큼 마음이 복잡해도, 민정이 행복이 결국 제일 중요하겠죠.", translation: "因为喜欢她很久，心情难免复杂，但旼炡的幸福终究才是最重要的吧。" },
  { category: "support", text: "정말 연인이라면 서로의 일도 이해하고 편안하게 쉴 수 있는 관계였으면 해요.", translation: "如果你们真的是恋人，希望你们能理解彼此的工作，也能自在地休息。" },
  { category: "support", text: "민정이는 팬들한테 소중한 사람이에요. 그만큼 당신에게도 소중하게 대접받길 바라요.", translation: "旼炡对粉丝来说很珍贵，也希望她在你那里同样被珍惜。" },
  { category: "support", text: "사실이라면 축하해 주고 싶어요. 민정이가 행복해 보이면 저도 조금씩 받아들일게요.", translation: "如果是真的，我想祝福你们。如果旼炡看起来幸福，我也会慢慢接受。" },
  { category: "support", text: "팬이라 조심스럽지만 두 분 모두 악플에 휘둘리지 말고 서로 잘 챙겨요.", translation: "身为粉丝，我还是想谨慎地说：希望你们别被恶评影响，好好照顾彼此。" },
  { category: "critical", text: "우리 민정이한테 진심으로 잘할 자신은 있으세요? 팬이라 괜히 걱정돼서요.", translation: "你有信心真心对旼炡好吗？我是粉丝，所以会忍不住担心。" },
  { category: "critical", text: "솔직히 아직은 마음이 복잡해요. 민정이 마음 다치게 하는 일만 없었으면 해요.", translation: "说实话我现在心情很复杂，只希望不要发生让旼炡受伤的事。" },
  { category: "critical", text: "민정이는 일도 열심히 하고 팬들도 많이 아끼는 사람이에요. 그걸 이해해 주세요.", translation: "旼炡很努力工作，也很珍惜粉丝，希望你能理解这一点。" },
  { category: "critical", text: "갑작스러운 소식이라 쉽게 받아들이긴 어렵네요. 그래도 민정이를 존중해 주셨으면 해요.", translation: "消息来得太突然，我还不太能接受，但希望你能尊重旼炡。" },
  { category: "critical", text: "팬 입장에서 솔직히 질투가 나는 건 어쩔 수 없네요. 그래도 무례하게 굴고 싶진 않아요.", translation: "作为粉丝说实话难免会嫉妒，但我不想因此对你无礼。" },
  { category: "critical", text: "혹시 관심 때문에 민정이 이름을 이용하는 건 아니길 바라요. 그건 정말 싫어요.", translation: "希望你不是为了关注度利用旼炡的名字，那样真的让人讨厌。" },
  { category: "critical", text: "민정이에게 부담을 주거나 일에 방해가 되는 관계는 아니었으면 합니다.", translation: "希望这段关系不会给旼炡带来压力，也不会影响她的工作。" },
  { category: "critical", text: "우리 민정이 활동하는 동안에는 서로의 사생활과 일정을 잘 지켜 줬으면 해요.", translation: "希望在旼炡活动期间，你们能好好保护彼此的私人生活和行程。" },
  { category: "critical", text: "팬들이 왜 예민한지 이해는 해 주셨으면 해요. 오래 지켜본 사람들도 있으니까요.", translation: "希望你能理解粉丝为什么敏感，毕竟有些人已经关注她很久了。" },
  { category: "critical", text: "아직 확인된 것도 없는데 벌써 여자친구라고 확정하는 분위기는 좀 불편해요.", translation: "明明还没确认，大家就已经认定你是女朋友，这种气氛让我不舒服。" },
  { category: "critical", text: "민정이 이름으로 관심을 끄는 행동만은 하지 말아 주세요. 팬들은 그런 걸 제일 걱정해요.", translation: "请不要利用旼炡的名字吸引关注，这是粉丝最担心的事。" },
  { category: "critical", text: "미안하지만 팬 입장에선 마냥 축하하는 말이 나오진 않아요. 시간이 좀 필요해요.", translation: "抱歉，作为粉丝我还没法直接说祝福的话，需要一点时间。" },
  { category: "critical", text: "연애를 하든 말든 민정이 선택이지만, 그 선택이 존중받았으면 좋겠어요.", translation: "无论恋爱与否都是旼炡的选择，但希望她的选择能受到尊重。" },
  { category: "critical", text: "괜히 사진을 해명하라는 압박은 주지 말아 주세요. 민정이도 쉴 권리가 있어요.", translation: "请不要给她压力，逼她解释照片。旼炡也有休息的权利。" },
  { category: "critical", text: "팬들이 속상해하는 걸 무조건 악성 반응으로만 보진 않았으면 해요.", translation: "希望不要把粉丝难过的反应一概看成恶意。" },
  { category: "critical", text: "민정이가 연애 때문에 비난받는 일은 없었으면 하지만, 소식이 너무 갑작스럽긴 해요.", translation: "我不希望旼炡因为恋爱被责怪，但这个消息确实太突然了。" },
  { category: "critical", text: "솔직히 사진이 퍼진 방식도 싫고, 확인도 안 된 이야기가 커지는 것도 싫어요.", translation: "说实话我讨厌照片传播的方式，也讨厌未经证实的说法越闹越大。" },
  { category: "critical", text: "혹시 진짜라면 민정이가 일과 사생활 사이에서 곤란해지지 않게 배려해 주세요.", translation: "如果是真的，希望你能体谅旼炡，不要让她为工作和私生活两难。" },
  { category: "critical", text: "우리 민정이한테 잘해 주는지 팬들은 말보다 행동으로 보게 될 거예요.", translation: "粉丝们会看行动，而不只是听你说，要看你有没有对旼炡好。" },
  { category: "critical", text: "여자친구라는 이유로 민정이의 노력과 커리어가 가려지는 일은 없었으면 합니다.", translation: "希望她不会因为有女朋友而被遮住自己的努力和事业。" },
  { category: "critical", text: "아직은 응원하기 어렵지만 민정이를 공격할 생각은 없어요. 조용히 지켜볼게요.", translation: "我暂时还很难祝福，但不会攻击旼炡。我会安静观察。" },
  { category: "critical", text: "혹시 두 분이 맞더라도 팬들 앞에서 일부러 티 내는 일은 없었으면 해요.", translation: "即使你们真的是恋人，也希望不要刻意在粉丝面前秀出来。" },
  { category: "critical", text: "민정이가 늘 먼저 배려하는 쪽이 되지 않도록 서로 노력해 주세요.", translation: "希望不要总是旼炡单方面迁就，也请你们彼此努力。" },
  { category: "critical", text: "팬들이 궁금해한다고 사생활을 다 공개해야 하는 건 아니지만, 소문 이용은 안 했으면 해요.", translation: "粉丝好奇不代表你们必须公开私生活，但也希望不要利用传闻。" },
  { category: "support", text: "팬 입장에서 솔직히 질투가 나는 건 어쩔 수 없네요. 그래도 무례하게 굴고 싶진 않아요.", translation: "作为粉丝说实话难免会嫉妒，但我不想因此对你无礼。" },
  { category: "critical", text: "팬이라서 마음이 복잡하긴 한데 두 사람이 서로 존중하는 사이였으면 좋겠어요.", translation: "身为粉丝心情确实复杂，但希望你们能互相尊重。" },
  { category: "critical", text: "민정이에게 부담을 주거나 일에 방해가 되는 관계는 아니었으면 합니다.", translation: "希望这段关系不会给旼炡带来压力，也不会影响她的工作。" },
  { category: "support", text: "민정이를 좋아하는 입장에서, 힘든 날에는 옆에서 편이 되어 주셨으면 해요.", translation: "作为喜欢旼炡的粉丝，希望她难过时你能站在她这边。" },
  { category: "critical", text: "팬들이 왜 예민한지 이해는 해 주셨으면 해요. 오래 지켜본 사람들도 있으니까요.", translation: "希望你能理解粉丝为什么敏感，毕竟有些人已经关注她很久了。" },
  { category: "critical", text: "민정이가 쉬는 날만큼은 아이돌이 아니라 한 사람으로 행복했으면 해요.", translation: "希望旼炡休息的时候能作为普通人幸福地生活，而不只是偶像。" },
  { category: "support", text: "민정이 이름으로 관심을 끄는 행동만은 하지 말아 주세요. 팬들은 그런 걸 제일 걱정해요.", translation: "请不要利用旼炡的名字吸引关注，这是粉丝最担心的事。" },
  { category: "critical", text: "민정이는 늘 팬들에게 최선을 다했어요. 이제는 본인 행복도 잘 챙겼으면 좋겠어요.", translation: "旼炡一直很努力地对待粉丝，现在也希望她能照顾好自己的幸福。" },
  { category: "critical", text: "민정이 팬이라서 그런데, 혹시 우리 애를 힘들게 하는 사람이면 좋게 보긴 어려워요.", translation: "我是旼炡的粉丝，如果你会让她难过，我真的很难对你有好感。" },
  { category: "support", text: "嫂子라는 말이 벌써 나오던데 아직 모르는 게 많으니 너무 단정 짓진 않을게요.", translation: "已经有人叫嫂子了，但还有很多未知，我先不妄下定论。" },
  { category: "critical", text: "우리 민정이한테 좋은 사람인지 천천히 지켜볼게요. 부디 잘해 주세요.", translation: "我会慢慢观察你是不是适合旼炡的人，希望你能对她好。" },
  { category: "critical", text: "사실이면 조금 속상하긴 해요. 그래도 민정이를 탓하고 싶지는 않아요.", translation: "如果是真的我确实会有点难过，但我不想责怪旼炡。" },
  { category: "support", text: "민정이한테 피해가 가지 않게 본인 계정에서 추측을 부추기지는 말아 주세요.", translation: "希望你不要在自己的账号里煽动猜测，免得影响旼炡。" },
  { category: "critical", text: "팬심이 있다고 해서 당신에게 막말하고 싶진 않아요. 다만 걱정은 됩니다.", translation: "即使是粉丝，我也不想对你说难听的话，只是确实担心旼炡。" },
  { category: "critical", text: "우리 애가 누군가의 연인으로만 소비되지 않고 계속 빛났으면 해요.", translation: "希望我们家孩子不要只被当成某个人的恋人讨论，而是继续闪闪发光。" },
  { category: "support", text: "팬들이 질투한다고 해서 다 악의를 가진 건 아니에요. 저도 마음을 정리하는 중이에요.", translation: "粉丝会嫉妒不代表都怀有恶意，我也还在整理心情。" },
  { category: "critical", text: "민정이가 행복하면 좋지만, 팬들 마음도 하루아침에 바뀌진 않네요.", translation: "希望旼炡幸福，但粉丝的心情也不可能一夜之间改变。" },
  { category: "curious", text: "혹시 편의점에서 뭘 샀는지까지 추측하는 건 너무 간 거겠죠?", translation: "连在便利店买了什么都要猜，是不是太过了？" },
  { category: "curious", text: "그날 날씨나 시간 때문에 얼굴이 더 안 나온 걸까요?", translation: "是因为那天天气或时间的缘故，脸才看不清吗？" },
  { category: "curious", text: "진짜인지 아닌지보다 왜 사진이 퍼졌는지가 궁금해요.", translation: "比起真假，我更好奇照片为什么会被传开。" },
  { category: "curious", text: "저도 그냥 지나가다 봤는데 다들 어디까지 알고 있는 거예요?", translation: "我只是路过看到的，大家到底掌握多少信息啊？" },
  { category: "curious", text: "혹시 공식 입장 나오기 전까지는 기다려 보는 게 맞겠죠?", translation: "在正式回应出来之前，还是先等等比较好吧？" },
  { category: "passerby", text: "추천에 떠서 들어왔는데 사진 한 장으로 확정하는 건 너무 이른 것 같아요.", translation: "推荐页一直推，我点进来看了，但凭一张照片就下结论也太早了。" },
  { category: "passerby", text: "팬은 아니지만 두 분 다 사생활을 존중받았으면 좋겠어요.", translation: "我不是粉丝，但希望你们的私人生活都能受到尊重。" },
  { category: "passerby", text: "이런 소식은 처음엔 시끄러워도 며칠 지나면 다른 얘기로 바뀌더라고요.", translation: "这种消息刚开始会很吵，过几天大家又会讨论别的了。" },
  { category: "passerby", text: "어떤 사이든 서로 좋은 영향을 주는 관계면 좋겠네요.", translation: "不管是什么关系，希望你们能给彼此带来好的影响。" },
  { category: "passerby", text: "그냥 지나가던 사람인데, 두 분 모두 오늘 하루 무사히 보내세요.", translation: "我只是路过，希望你们今天都能平安度过。" },
  { category: "passerby", text: "사진을 찍은 사람이 누구든 당사자들이 원치 않으면 퍼뜨리지 않았으면 해요.", translation: "不管是谁拍的，如果当事人不愿意，就不该继续传播。" },
  { category: "passerby", text: "뉴스만 보고 왔는데 확인된 건 없어 보이네요. 기다려 보는 게 맞겠어요.", translation: "我看新闻过来的，好像还没有确认的内容，还是等等吧。" },
  { category: "passerby", text: "사생활 얘기가 너무 커지지 않고 조용히 정리되면 좋겠습니다.", translation: "希望私人生活的话题不要越闹越大，能安静地过去就好。" },
  { category: "passerby", text: "아이돌 소식엔 익숙하지 않은데 오늘은 여기저기서 보이네요.", translation: "我不太关注偶像新闻，但今天到处都能看到这件事。" },
  { category: "passerby", text: "누군가를 좋아하는 마음도, 누군가와 사귀는 선택도 존중받았으면 해요.", translation: "无论喜欢一个人的心情，还是和谁交往的选择，都希望能被尊重。" },
  { category: "passerby", text: "이런 상황에서 따뜻한 말 하나라도 힘이 되면 좋겠어요.", translation: "希望在这种情况下，一句温暖的话也能带来一点力量。" },
  { category: "passerby", text: "사실 여부와 상관없이 악성 댓글이 더 커지지는 않았으면 좋겠어요.", translation: "无论真假，都希望恶意评论不要继续扩大。" },
  { category: "passerby", text: "두 분이 맞다면 서로 편안하고 행복한 관계이길 바랍니다.", translation: "如果你们真的是恋人，希望你们能轻松幸福地相处。" },
  { category: "passerby", text: "팬이 아니어도 누군가의 사적인 순간을 몰래 찍는 건 별로예요.", translation: "即使不是粉丝，我也不喜欢偷拍别人的私人时刻。" },
  { category: "passerby", text: "원본이 뭔지 따지는 것보다 왜 사생활을 찍었는지가 더 궁금해요.", translation: "比起追究原图是什么，我更想知道为什么要偷拍私人生活。" },
  { category: "passerby", text: "이 일로 누구도 공격받지 않고 지나갔으면 합니다.", translation: "希望这件事能平安过去，不要有人因此受到攻击。" },
  { category: "passerby", text: "저는 그냥 두 분 다 마음 편히 지내셨으면 좋겠어요.", translation: "我只是希望你们两个人都能安心生活。" },
  { category: "passerby", text: "하루 지나면 또 다른 화제가 생기겠지만, 지금은 말조심하는 게 좋겠네요.", translation: "过一天又会有新话题，但现在还是谨慎发言比较好。" },
  { category: "passerby", text: "우연히 봤는데 사람들이 당사자보다 더 확신하는 게 신기하네요.", translation: "偶然刷到，觉得大家比当事人还笃定，挺奇怪的。" },
  { category: "passerby", text: "진짜든 아니든 사진 속 사람들을 함부로 추측하지 않았으면 해요.", translation: "不管真假，希望大家别随意猜测照片里的人。" },
  { category: "passerby", text: "두 분 모두 주변에서 편하게 이야기할 수 있는 사람들이 있었으면 해요.", translation: "希望你们身边都有能安心倾诉的人。" },
  { category: "passerby", text: "그냥 좋은 소식이든 아니든, 당사자들이 원할 때 말할 수 있으면 좋겠어요.", translation: "不管算不算好消息，都希望当事人能在自己愿意的时候再开口。" },
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
  const [keyboard, setKeyboard] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const appSnapshots = useRef(new Map<string, HTMLElement>());
  const handledKktEventsRef = useRef(new Set<string>());
  const [banner, setBanner] = useState("");
  const [bannerQueue, setBannerQueue] = useState<string[]>([]);
  const noticesSeen = useRef<string[]>([]);
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
  const handleKktIncomingMessage = (rawValue: UiValue) => {
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
    const unreadCount = activeConversation ? 0 : previousUnread + 1;
    // Suppress only the NPC thread that is currently visible. Being in a
    // different KKT conversation is not enough to suppress this NPC's popup.
    const notifications = activeConversation
      ? current.notifications.filter((notice) => kktNoticeThread(notice) !== incoming.thread)
      : [...current.notifications, `KKT|${incoming.thread}:${incoming.text}`];
    if (activeConversation && banner && kktNoticeThread(banner) === incoming.thread) setBanner("");
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
    setKeyboard(false);
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
  const igDmQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-queue-v6"])
    ? s.ui?.instagram?.["scandal-ig-dm-queue-v6"] as string[] : [];
  const igDmVisibleCount = Number(s.ui?.instagram?.["scandal-ig-dm-visible-count-v6"] ?? 0);
  const igDmPopupCount = Number(s.ui?.instagram?.["scandal-ig-dm-popup-count-v6"] ?? 0);
  const igDmBatchStarted = s.ui?.instagram?.["scandal-ig-dm-batch-started-v6"] === true;
  const igDmReplyQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-reply-queue-v6"])
    ? s.ui?.instagram?.["scandal-ig-dm-reply-queue-v6"] as string[] : [];
  const igDmReplyCount = Number(s.ui?.instagram?.["scandal-ig-dm-reply-count-v6"] ?? 0);
  const igDmReplyPopupCount = Number(s.ui?.instagram?.["scandal-ig-dm-reply-popup-count-v6"] ?? 0);
  const igDmScreenActive = app === "instagram" &&
    s.ui?.instagram?.["scandal-ig-dm-screen-active-v6"] === true;
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
        "scandal-ig-dm-batch-started-v6": true,
        "scandal-ig-dm-queue-v6": createInstagramFanDmBatch(),
        "scandal-ig-dm-visible-count-v6": 0,
        "scandal-ig-dm-popup-count-v6": 0,
        "scandal-ig-dm-replies-v6": [],
        "scandal-ig-dm-reply-queue-v6": [],
        "scandal-ig-dm-reply-count-v6": 0,
        "scandal-ig-dm-reply-popup-count-v6": 0,
        "scandal-ig-dm-screen-active-v6": false,
        "scandal-ig-open-thread-v6": "",
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
          twitter: { ...latest.ui?.twitter, "rumor-news-unlocked-v5": true },
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

  // Deliver each KKT notification only while the player is outside Minjeong's
  // chat. If the first alert is opened, the second waits until the player exits.
  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-news-pushed-v5"] !== true ||
      s.ui?.story?.["scandal-kkt-first-notice-v5"] === true ||
      (appViewRef.current.app === "kakao" && appViewRef.current.appThread === "金旼炡")) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-first-notice-v5"] === true ||
        (appViewRef.current.app === "kakao" && appViewRef.current.appThread === "金旼炡")) return;
      update({
        ...latest,
        notifications: [...latest.notifications, "KKT|金旼炡:어디야?"],
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-first-notice-v5": true },
          kakao: {
            ...latest.ui?.kakao,
            "kkt-unread-count:金旼炡": Math.max(
              0,
              Number(latest.ui?.kakao?.["kkt-unread-count:金旼炡"] ?? 0),
            ) + 1,
          },
        },
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [creator, app, appThread, s.ui?.story?.["scandal-news-pushed-v5"], s.ui?.story?.["scandal-kkt-first-notice-v5"]]);

  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-kkt-first-notice-v5"] !== true ||
      s.ui?.story?.["scandal-kkt-second-notice-v5"] === true ||
      (appViewRef.current.app === "kakao" && appViewRef.current.appThread === "金旼炡")) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-second-notice-v5"] === true ||
        (appViewRef.current.app === "kakao" && appViewRef.current.appThread === "金旼炡")) return;
      update({
        ...latest,
        notifications: [...latest.notifications, "KKT|金旼炡:혼자 있어?"],
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-second-notice-v5": true },
          kakao: {
            ...latest.ui?.kakao,
            "kkt-unread-count:金旼炡": Math.max(
              0,
              Number(latest.ui?.kakao?.["kkt-unread-count:金旼炡"] ?? 0),
            ) + 1,
          },
        },
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [creator, app, appThread, s.ui?.story?.["scandal-kkt-first-notice-v5"], s.ui?.story?.["scandal-kkt-second-notice-v5"]]);
  // Deliver Minjeong's 20:17 follow-up on the story timeline, not as a side effect
  // of opening her chat. Existing saves may already contain the line; still send
  // its one-time notification unless it was already handled.
  useEffect(() => {
    const hasOpeningChat = (work.data.kakao || []).some(
      (item) => item.id === "kkt-minjeong-opening-01",
    );
    const firstOpeningNoticeDelivered =
      s.variables?.["kkt-opening-first-notice-delivered-v1"] === true ||
      s.completed.includes("kkt-first-message-after-unlock") ||
      s.notifications.some((notice) => notice === "KKT|金旼炡: 아직 안 잤어?");
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
      const firstOpeningNoticeDelivered =
        latest.variables?.["kkt-opening-first-notice-delivered-v1"] === true ||
        latest.completed.includes("kkt-first-message-after-unlock") ||
        latest.notifications.some((notice) => notice === "KKT|金旼炡: 아직 안 잤어?");
      if (
        !firstOpeningNoticeDelivered ||
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
      }));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [
    creator,
    work.id,
    s.time,
    s.ui?.kakao?.["scandal-precall-started-v5"],
    s.ui?.kakao?.["mymyKktOpeningFollowupNoticeHandledV1"],
    s.variables?.["kkt-opening-first-notice-delivered-v1"],
    s.completed.length,
    s.notifications.length,
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

  useEffect(() => {
    if (creator || s.ui?.kakao?.["scandal-precall-delivered-v5"] !== true) return;
    const current = runtimeRef.current;
    const storyState = current.ui?.story || {};
    if (storyState["scandal-call-countdown-started-v5"] === true ||
      storyState["scandal-call-triggered-v5"] === true || current.incomingCall) return;
    update({
      ...current,
      ui: {
        ...current.ui,
        story: { ...storyState, "scandal-call-countdown-started-v5": true },
      },
    });
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-call-triggered-v5"] === true || latest.incomingCall ||
        latest.ui?.kakao?.["scandal-precall-delivered-v5"] !== true) return;
      update({
        ...latest,
        incomingCall: { caller: "金旼炡", target: "scandal-call", status: "ringing" },
        ui: {
          ...latest.ui,
          story: {
            ...latestStory,
            "scandal-call-triggered-v5": true,
            "scandal-call-dialogue-step-v5": 0,
          },
        },
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [creator, s.ui?.kakao?.["scandal-precall-delivered-v5"]]);
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
    if (current.ui?.instagram?.["scandal-ig-dm-batch-started-v6"] === true) return;
    update(startInstagramDmAfterCall(current));
  }, [creator, s.ui?.kakao?.["scandal-call-decline-messages-finished-v6"], igDmBatchStarted]);

  // The Instagram inbox fills one conversation per second.
  useEffect(() => {
    if (creator || !igDmBatchStarted || igDmVisibleCount >= igDmQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-queue-v6"])
        ? instagramUi["scandal-ig-dm-queue-v6"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-visible-count-v6"] ?? 0);
      if (!queue[index] || index !== igDmVisibleCount) return;
      update({
        ...current,
        ui: {
          ...current.ui,
          instagram: { ...instagramUi, "scandal-ig-dm-visible-count-v6": index + 1 },
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
      const queue = Array.isArray(instagramUi["scandal-ig-dm-queue-v6"])
        ? instagramUi["scandal-ig-dm-queue-v6"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-popup-count-v6"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmPopupCount) return;
      let dm: InstagramFanDm;
      try { dm = JSON.parse(raw) as InstagramFanDm; }
      catch { return; }
      const active = app === "instagram" &&
        instagramUi["scandal-ig-dm-screen-active-v6"] === true;
      const notice = `IGDM|${dm.id}|${dm.handle}: ${dm.text} — ${dm.translation}`;
      update({
        ...current,
        notifications: active ? current.notifications : [...current.notifications, notice],
        ui: {
          ...current.ui,
          instagram: { ...instagramUi, "scandal-ig-dm-popup-count-v6": index + 1 },
        },
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [creator, igDmBatchStarted, igDmPopupCount, igDmQueue.length, app, igDmScreenActive]);

  // Replies are written to the conversation view at one-second intervals.
  useEffect(() => {
    if (creator || igDmReplyCount >= igDmReplyQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const queue = Array.isArray(instagramUi["scandal-ig-dm-reply-queue-v6"])
        ? instagramUi["scandal-ig-dm-reply-queue-v6"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-reply-count-v6"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmReplyCount) return;
      const replies = Array.isArray(instagramUi["scandal-ig-dm-replies-v6"])
        ? instagramUi["scandal-ig-dm-replies-v6"] as string[] : [];
      update({
        ...current,
        ui: {
          ...current.ui,
          instagram: {
            ...instagramUi,
            "scandal-ig-dm-replies-v6": [...replies, raw],
            "scandal-ig-dm-reply-count-v6": index + 1,
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
      const queue = Array.isArray(instagramUi["scandal-ig-dm-reply-queue-v6"])
        ? instagramUi["scandal-ig-dm-reply-queue-v6"] as string[] : [];
      const index = Number(instagramUi["scandal-ig-dm-reply-popup-count-v6"] ?? 0);
      const raw = queue[index];
      if (!raw || index !== igDmReplyPopupCount) return;
      let message: { id: string; threadId: string; handle: string; text: string; translation: string; role: string };
      try { message = JSON.parse(raw) as typeof message; }
      catch { return; }
      const active = app === "instagram" &&
        instagramUi["scandal-ig-dm-screen-active-v6"] === true;
      const notice = `IGDM|${message.threadId}|${message.handle}: ${message.text} — ${message.translation}`;
      update({
        ...current,
        notifications: active ? current.notifications : [...current.notifications, notice],
        ui: {
          ...current.ui,
          instagram: {
            ...instagramUi,
            "scandal-ig-dm-reply-popup-count-v6": index + 1,
          },
        },
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [creator, igDmReplyPopupCount, igDmReplyQueue.length, app, igDmScreenActive]);

  useEffect(() => {
    if (igDmScreenActive && banner.startsWith("IGDM|")) setBanner("");
  }, [igDmScreenActive]);

  const plugin = getApp(app);
  useEffect(() => {
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
        notice.startsWith("KKT|金旼炡:나 오늘 집에 좀 늦게 들어갈 것 같아.");
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
  }, [s.notifications, locked, work.phone.notifications, banner, bannerQueue]);

  // Show notification banners one at a time. A new message queues behind the
  // visible banner instead of replacing it before the player can see it.
  useEffect(() => {
    if (banner || !bannerQueue.length) return;
    setBanner(bannerQueue[0]);
    setBannerQueue((queue) => queue.slice(1));
  }, [banner, bannerQueue]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4500);
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
            "scandal-ig-open-thread-v6": notification.threadId,
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
      <KeyboardContext.Provider value={setKeyboard}>
        <div
          className={`phone-screen wallpaper-${work.phone.wallpaper} ${locked ? "is-locked" : ""} ${app ? "in-app" : ""} ${keyboard ? "keyboard-open" : ""}`}
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
              setKeyboard(false);
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
                  {(callDialogueStep === 1 || callDialogueStep === 4) && (
                    <div className="call-reply-options">
                      <button
                        type="button"
                        onClick={() => {
                          const current = runtimeRef.current;
                          const nextStep = callDialogueStep === 1 ? 3 : 5;
                          update({
                            ...current,
                            ui: {
                              ...current.ui,
                              story: { ...current.ui?.story, "scandal-call-dialogue-step-v5": nextStep },
                            },
                          });
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
                    const call = runtimeRef.current.incomingCall;
                    if (call) {
                      const next = dispatch(
                        work,
                        { ...runtimeRef.current, incomingCall: null },
                        call.status === "ringing" ? "callDeclined" : "callEnded",
                        call.target || call.caller,
                      );
                      if (call.target === "scandal-call" && call.status === "ringing") {
                        next.ui = {
                          ...next.ui,
                          kakao: { ...next.ui?.kakao, "scandal-call-result-v5": "declined" },
                        };
                      }
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
          {keyboard && <DeviceKeyboard close={() => setKeyboard(false)} />}
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
              setKeyboard(false);
              closeCurrentApp();
              setFolder("");
              setPanel("");
            }}
          />
          <div className="screen-dimmer" />
          <div className="hardware-reflection" />
        </div>
      </KeyboardContext.Provider>
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
