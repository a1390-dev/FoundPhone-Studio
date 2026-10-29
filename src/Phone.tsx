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
  { category: "critical", fanType: "毒唯", text: "민정이는 무대와 노래만으로도 충분히 주목받을 사람이에요. 연애설만으로 소비하지 않았으면 해요.", translation: "旼炡光靠舞台和音乐就值得被关注，希望别只拿恋爱传闻消费她。" },
  { category: "critical", fanType: "毒唯", text: "사진 한 장만으로 당신을 여자친구라고 확정하는 것도, 아니라고 단정하는 것도 아직은 이르죠.", translation: "只凭一张照片就认定你是女朋友或断言不是，都还太早。" },
  { category: "critical", fanType: "毒唯", text: "윈터 개인 활동을 응원하는 입장이라 이번 일이 음악 이야기까지 덮어 버리는 게 아쉬워요.", translation: "作为支持 Winter 个人活动的粉丝，我不希望这件事把音乐话题都盖过去。" },
  { category: "critical", fanType: "毒唯", text: "민정이가 직접 말하지 않은 관계를 주변 계정이 대신 확정하지 않았으면 합니다.", translation: "希望别的账号不要替旼炡确认她本人没有说过的关系。" },
  { category: "critical", fanType: "毒唯", text: "당신이 실제로 가까운 사람이라면 민정이 일정과 사생활을 서로 존중해 주세요.", translation: "如果你真是她亲近的人，请互相尊重旼炡的行程与私人生活。" },
  { category: "critical", fanType: "毒唯", text: "사진이 퍼지는 상황에서 의미심장한 게시물을 더 올리면 추측만 커질 수 있어요.", translation: "照片正在传播，这时候再发意味不明的帖子只会让猜测变多。" },
  { category: "critical", fanType: "毒唯", text: "팬들이 복잡한 마음을 표현한다고 전부 악의라고 몰아가진 말아 주세요.", translation: "粉丝表达复杂心情不代表全是恶意，希望别一概而论。" },
  { category: "critical", fanType: "毒唯", text: "윈터는 누군가의 연애 상대라는 말 말고도 이야기할 부분이 정말 많아요.", translation: "Winter 除了恋爱对象这种说法，还有很多值得讨论的地方。" },
  { category: "critical", fanType: "毒唯", text: "루머로 팔로워를 늘리려는 계정이 되지 않았으면 좋겠어요. 그건 민정이에게도 부담이에요.", translation: "希望你不要成为靠传闻涨粉的账号，那也会给旼炡带来压力。" },
  { category: "critical", fanType: "毒唯", text: "사실인지 확인되기 전에는 어느 쪽도 정답인 것처럼 말하지 않으려고요.", translation: "在确认真假之前，我不会把任何一方说成已经掌握答案。" },
  { category: "critical", fanType: "毒唯", text: "민정이를 좋아하는 팬이라면 다른 멤버 이름까지 끌어와 비교하는 건 피했으면 해요.", translation: "喜欢旼炡的粉丝也该避免把其他成员扯进来比较。" },
  { category: "critical", fanType: "毒唯", text: "이번 일로 윈터의 무대 평가나 커리어까지 함부로 깎아내리는 건 부당하다고 생각해요.", translation: "我觉得不能因为这件事就随意贬低 Winter 的舞台表现或事业。" },
  { category: "critical", fanType: "毒唯", text: "공식 입장도 없는 상황에서 당신 계정에 해명을 요구하는 건 서로에게 도움이 안 될 수 있어요.", translation: "还没有官方回应，就跑到你的账号要求解释，对双方都未必有帮助。" },
  { category: "critical", fanType: "毒唯", text: "혹시 사실이라도 민정이가 미안해해야 할 일처럼 만들고 싶진 않아요.", translation: "即使传闻是真的，我也不想把它变成旼炡需要道歉的事。" },
  { category: "critical", fanType: "毒唯", text: "민정이의 사생활을 지켜야 한다는 말과 팬들이 놀랐다는 마음은 함께 존재할 수 있어요.", translation: "保护旼炡隐私和粉丝感到震惊，这两种心情可以同时存在。" },
  { category: "critical", fanType: "毒唯", text: "사진 속 인물이 누군지도 확실하지 않은데 상대를 공격하는 계정은 차단하려고요.", translation: "照片里的人都没确认，我打算屏蔽那些攻击对方的账号。" },
  { category: "critical", fanType: "毒唯", text: "윈터 팬덤이 이번 이슈로 서로 편을 가르느라 에너지를 다 쓰지 않았으면 합니다.", translation: "希望 Winter 粉圈不要把精力全耗在这次事件的站队上。" },
  { category: "critical", fanType: "毒唯", text: "당신을 의심하는 사람도 있겠지만, 확인되지 않은 일을 사실처럼 퍼뜨리진 말아 주세요.", translation: "可能有人怀疑你，但请别把未确认的事情当事实传播。" },
  { category: "critical", fanType: "毒唯", text: "민정이가 행복하길 바라면서도 당황스러울 수 있다는 걸 서로 인정했으면 해요.", translation: "希望大家能承认：既希望旼炡幸福，也可能会感到不知所措。" },
  { category: "critical", fanType: "毒唯", text: "사생활을 캐내는 대신 앨범과 무대 이야기를 다시 할 수 있었으면 좋겠어요.", translation: "比起挖私人生活，我更希望大家重新聊专辑和舞台。" },
  { category: "critical", fanType: "毒唯", text: "누군가의 여자친구라는 추측만으로 당신의 인격까지 평가하는 건 조심해야죠.", translation: "仅凭“某人的女朋友”这种猜测就评价你的人格，也该谨慎。" },
  { category: "critical", fanType: "毒唯", text: "윈터가 누구를 만나든 활동을 이어 갈 수 있도록 팬들이 선을 지켰으면 합니다.", translation: "无论 Winter 和谁交往，都希望粉丝守好界限，让她能继续活动。" },
  { category: "critical", fanType: "毒唯", text: "사진을 확대해 단서를 찾는 글보다 최초 게시물과 출처를 확인하는 글이 더 필요해요.", translation: "比起放大照片找线索，我更希望看到核查原帖和来源的内容。" },
  { category: "critical", fanType: "毒唯", text: "민정이 이름을 붙여 자극적인 제목을 만드는 계정은 더 이상 보고 싶지 않아요.", translation: "我不想再看那些挂着旼炡名字做刺激标题的账号。" },
  { category: "critical", fanType: "毒唯", text: "팬들이 불편함을 말하는 것도 가능하지만, 위협이나 모욕까지 갈 필요는 없어요.", translation: "粉丝可以表达不舒服，但没必要上升到威胁或辱骂。" },
  { category: "critical", fanType: "毒唯", text: "당신이 정말 민정이를 아낀다면 서로의 일에 방해가 되지 않도록 배려해 주세요.", translation: "如果你真的珍惜旼炡，就请彼此体谅，别影响对方的工作。" },
  { category: "critical", fanType: "毒唯", text: "확인되지 않은 커플 서사를 만들어서 조회수를 얻는 건 모두를 피곤하게 만들어요.", translation: "编造未经确认的情侣故事来赚流量，只会让所有人疲惫。" },
  { category: "critical", fanType: "毒唯", text: "윈터가 직접 이야기할 때까지 기다리는 게 팬으로서 할 수 있는 일이라고 생각해요.", translation: "我认为等到 Winter 自己开口，是粉丝现在能做的事。" },
  { category: "critical", fanType: "毒唯", text: "이번 논란을 이유로 다른 멤버를 공격하거나 비교하는 건 그만했으면 합니다.", translation: "希望别再以这次争议为由攻击或比较其他成员。" },
  { category: "critical", fanType: "毒唯", text: "저는 아직 마음이 복잡하지만 민정이에게 화살을 돌리거나 당신을 찾아가진 않을 거예요.", translation: "我心情还很复杂，但不会把怒气撒向旼炡，也不会去找你。" },
  { category: "support", fanType: "甜唯", text: "민정이 노래를 들으러 왔다가 이 소식을 봤어요. 오늘도 좋아하는 노래로 하루를 마무리하고 싶네요.", translation: "我是来听旼炡的歌才看到这件事的，今天还是想用喜欢的歌结束一天。" },
  { category: "support", fanType: "甜唯", text: "놀라긴 했지만 민정이가 무대에서 편안하게 웃는 모습을 계속 보고 싶어요.", translation: "虽然很意外，但我还是想继续看到旼炡在舞台上自在地笑。" },
  { category: "support", fanType: "甜唯", text: "사진이 사실이든 아니든 당사자들이 너무 많은 말에 시달리지 않았으면 해요.", translation: "不管照片是真是假，都希望当事人不要被过多议论折磨。" },
  { category: "support", fanType: "甜唯", text: "저는 민정이의 보컬이 좋아요. 오늘은 루머보다 라이브 클립을 다시 보려고요.", translation: "我喜欢旼炡的嗓音，今天比起传闻，我更想重看现场片段。" },
  { category: "support", fanType: "甜唯", text: "두 분이 진짜 연인이라면 서로 편히 쉴 수 있는 관계였으면 좋겠어요.", translation: "如果你们真是恋人，希望你们能成为彼此安心休息的关系。" },
  { category: "support", fanType: "甜唯", text: "팬마다 받아들이는 속도는 다르겠죠. 그래도 서로를 배신자라고 부르지는 말아요.", translation: "每个粉丝接受消息的速度都不同，但不要互相叫对方背叛者。" },
  { category: "support", fanType: "甜唯", text: "민정이는 늘 열심히 해 왔으니 오늘은 본인 컨디션도 잘 챙겼으면 해요.", translation: "旼炡一直很努力，希望她今天也能照顾好自己的状态。" },
  { category: "support", fanType: "甜唯", text: "당신도 갑자기 관심을 받게 됐다면 당황스러울 것 같아요. 무사히 지나가길 바라요.", translation: "如果你也突然受到关注，应该会很慌，希望你能平安度过。" },
  { category: "support", fanType: "甜唯", text: "사진 한 장보다 민정이가 직접 들려준 노래와 무대가 저한테는 더 중요해요.", translation: "比起一张照片，对我来说旼炡亲自呈现的歌曲和舞台更重要。" },
  { category: "support", fanType: "甜唯", text: "사실 확인 전까지는 축하도 비난도 서두르지 않고 조용히 기다리려고요.", translation: "在确认事实之前，我不急着祝福或批评，会安静等待。" },
  { category: "support", fanType: "甜唯", text: "민정이에게 해명을 재촉하는 글이 줄어들었으면 좋겠어요. 쉴 시간도 필요하니까요.", translation: "希望催旼炡解释的帖子少一点，她也需要休息时间。" },
  { category: "support", fanType: "甜唯", text: "혹시 여자친구가 맞더라도 두 사람 모두 존중받았으면 해요.", translation: "即使你真是女朋友，也希望你们两个人都受到尊重。" },
  { category: "support", fanType: "甜唯", text: "오늘 타임라인은 너무 시끄러워서 잠깐 쉬려고요. 서로 조금만 차분해져요.", translation: "今天的时间线太吵了，我准备暂时休息一下。希望大家冷静一点。" },
  { category: "support", fanType: "甜唯", text: "민정이가 팬들에게 준 행복한 순간들은 사진 한 장으로 사라지지 않아요.", translation: "旼炡曾带给粉丝的快乐时刻，不会因为一张照片就消失。" },
  { category: "support", fanType: "甜唯", text: "당신 계정에 답을 요구하는 대신 공식적으로 확인된 내용만 기다려 보려고요.", translation: "我不会跑到你的账号索要答案，而是等正式确认的消息。" },
  { category: "support", fanType: "甜唯", text: "민정이의 다음 무대가 기대돼요. 이번 소문이 활동 전부를 덮지는 않았으면 합니다.", translation: "我很期待旼炡的下一次舞台，希望这次传闻不要盖过她所有活动。" },
  { category: "support", fanType: "甜唯", text: "팬심과 현실을 정리하는 데 시간이 걸려도 다른 사람에게 상처 주진 말아요.", translation: "整理粉丝心情和现实需要时间，但别因此伤害别人。" },
  { category: "support", fanType: "甜唯", text: "민정이가 사생활에서도 편안하고 안전하게 지냈으면 좋겠어요.", translation: "希望旼炡在私生活中也能自在、安全地生活。" },
  { category: "support", fanType: "甜唯", text: "당신이 누구든 두 분이 서로를 존중한다면 더 바랄 건 없겠어요.", translation: "无论你是谁，只要你们彼此尊重，我就没有别的奢求了。" },
  { category: "support", fanType: "甜唯", text: "오늘은 추측글을 더 공유하지 않고 민정이의 예전 무대 영상이나 볼게요.", translation: "今天我不再转发猜测贴，还是去看旼炡以前的舞台视频吧。" },
  { category: "support", fanType: "妈粉", text: "우리 애가 일정 끝나고 따뜻한 밥 먹고 푹 잤으면 좋겠어요.", translation: "希望我们家孩子结束行程后能吃顿热饭、好好睡一觉。" },
  { category: "support", fanType: "妈粉", text: "민정이가 늘 괜찮은 척하지 않아도 되는 사람이 곁에 있었으면 해요.", translation: "希望旼炡身边有人能让她不必总是假装没事。" },
  { category: "support", fanType: "妈粉", text: "당신이 가까운 사람이라면 오늘은 인터넷 반응보다 민정이 컨디션을 먼저 살펴 주세요.", translation: "如果你是她亲近的人，今天请先关心旼炡的状态，而不是网上反应。" },
  { category: "support", fanType: "妈粉", text: "우리 민정이는 누구에게 설명해야만 행복할 수 있는 사람이 아니에요.", translation: "我们旼炡不是非得向谁解释才能幸福的人。" },
  { category: "critical", fanType: "妈粉", text: "팬들이 놀랐다고 해서 민정이가 사과해야 한다고 생각하진 않아요.", translation: "我不认为粉丝感到震惊就意味着旼炡需要道歉。" },
  { category: "support", fanType: "妈粉", text: "상대가 누구든 서로 안전하고 존중받는 게 제일 중요합니다.", translation: "不管对象是谁，彼此安全并受到尊重才是最重要的。" },
  { category: "support", fanType: "妈粉", text: "댓글을 다 읽지 않아도 된다고 말해 줄 사람이 옆에 있었으면 좋겠어요.", translation: "希望她身边有人告诉她，不必把每条评论都看完。" },
  { category: "support", fanType: "妈粉", text: "민정이가 집에 돌아와서는 아무 말 없이 편히 쉬었으면 하네요.", translation: "希望旼炡回家后可以什么都不说，轻松休息。" },
  { category: "support", fanType: "妈粉", text: "사실이라면 서로 배려하면서 민정이가 자기 일도 잘 이어 가게 도와주세요.", translation: "如果是真的，请彼此体谅，也帮助旼炡继续做好自己的工作。" },
  { category: "support", fanType: "妈粉", text: "좋아하는 마음이 크다고 해서 사생활까지 알아야 하는 건 아니잖아요.", translation: "喜欢得再深，也不代表必须知道她的私生活吧。" },
  { category: "support", fanType: "妈粉", text: "사진 때문에 민정이가 죄책감을 느끼지 않도록 주변에서 잘 지켜 줬으면 해요.", translation: "希望身边的人能保护好旼炡，不要让她因为照片感到内疚。" },
  { category: "support", fanType: "妈粉", text: "상대방 계정에 몰려가 공격하는 건 민정이가 바라는 일도 아닐 거예요.", translation: "涌到对方账号攻击，也不会是旼炡希望看到的事。" },
  { category: "support", fanType: "妈粉", text: "마음이 복잡한 팬도 있겠지만 결국 민정이가 편안하게 지내는 게 우선이에요.", translation: "有些粉丝心情复杂，但最终还是旼炡能安心生活更重要。" },
  { category: "support", fanType: "妈粉", text: "오늘만큼은 민정이가 좋아하는 음식 먹고 푹 쉬었으면 좋겠어요.", translation: "希望旼炡今天能吃喜欢的食物，好好休息。" },
  { category: "support", fanType: "妈粉", text: "무슨 관계인지보다 서로를 불편하게 만들지 않고 지내는지가 더 중요하다고 봐요.", translation: "比起你们是什么关系，我觉得相处时是否让彼此舒服更重要。" },
  { category: "critical", fanType: "女友粉", text: "버블에서 민정이가 해 준 말을 혼자 오래 간직했는데 오늘은 마음이 조금 허전해요.", translation: "我珍藏着旼炡在 Bubble 里说过的话，但今天心里有点空落落的。" },
  { category: "critical", fanType: "女友粉", text: "솔직히 질투는 나지만 그 감정으로 민정이에게 선택을 강요할 수는 없겠죠.", translation: "说实话会嫉妒，但不能因为这种感情就逼旼炡做选择。" },
  { category: "support", fanType: "女友粉", text: "당신이 실제 여자친구라면 부럽기도 해요. 그래도 민정이를 소중하게 대해 주세요.", translation: "如果你真是她女朋友，我也会羡慕，但还是希望你珍惜旼炡。" },
  { category: "critical", fanType: "女友粉", text: "오늘은 팬 계정에서 잠깐 로그아웃하려고요. 계속 보면 마음이 더 복잡해질 것 같아요.", translation: "今天我打算暂时退出粉丝账号，继续刷只会让心情更复杂。" },
  { category: "critical", fanType: "女友粉", text: "민정이가 행복하길 바라면서도 서운한 마음이 들어요. 두 감정이 같이 있네요.", translation: "我希望旼炡幸福，同时又会失落，两种心情并存。" },
  { category: "critical", fanType: "女友粉", text: "당신을 미워하고 싶진 않지만 아직 축하한다는 말은 쉽게 나오지 않아요.", translation: "我不想讨厌你，但现在还是很难轻易说出祝福的话。" },
  { category: "critical", fanType: "女友粉", text: "나중에 사실로 밝혀져도 팬들끼리 서로 배신자라고 몰아가진 않았으면 해요.", translation: "即使以后证实是真的，也希望粉丝不要互相指责对方是叛徒。" },
  { category: "critical", fanType: "女友粉", text: "민정이를 좋아했던 시간이 거짓이 된 건 아니겠죠. 오늘은 조금만 쉬어 갈게요.", translation: "喜欢旼炡的那些时光并没有变成假的吧，今天我先休息一下。" },
  { category: "critical", fanType: "女友粉", text: "사진이 자꾸 떠서 현실을 실감하게 되네요. 그래도 당신에게 화풀이하진 않을게요.", translation: "照片反复出现，让我不断意识到现实，但我不会向你发泄。" },
  { category: "support", fanType: "女友粉", text: "갑자기 관심을 받는 당신도 불편할 수 있겠죠. 이 일이 공격으로 번지지 않았으면 해요.", translation: "你突然受到关注也可能很不舒服，希望这件事不要发展成攻击。" },
  { category: "critical", fanType: "女友粉", text: "민정이가 누구를 좋아하는지는 제가 정할 수 없다는 걸 천천히 받아들이는 중이에요.", translation: "我正在慢慢接受：旼炡喜欢谁，不是由我决定的。" },
  { category: "critical", fanType: "女友粉", text: "부럽다는 마음은 있어도 당신의 신상을 캐거나 찾아가고 싶지는 않아요. 그건 선을 넘는 거니까요.", translation: "我会羡慕，但不想挖你的个人信息或去找你，那样越界了。" },
  { category: "critical", fanType: "女友粉", text: "마음을 정리하는 데 시간이 걸릴 것 같지만 민정이가 악플을 받지는 않았으면 합니다.", translation: "我可能需要时间整理心情，但仍希望旼炡不要收到恶评。" },
  { category: "critical", fanType: "女友粉", text: "사실이라면 민정이가 팬들 눈치 때문에 죄책감을 느끼지 않게 곁에서 말해 주세요.", translation: "如果是真的，希望你能陪她说说话，别让她因为粉丝而内疚。" },
  { category: "critical", fanType: "女友粉", text: "오늘은 질투를 인정하고 관련 검색어를 잠시 안 보려고요. 제 감정도 제가 돌봐야죠.", translation: "今天我承认自己的嫉妒，暂时不看相关热搜了；我也得照顾好自己的情绪。" },
  { category: "curious", fanType: "梦女", text: "현실 얘기는 잠깐 내려놓고 상상 속에서는 민정이랑 야식 고르는 장면이나 써 볼래요.", translation: "先把现实话题放一边，我想写一段幻想中和旼炡挑夜宵的场景。" },
  { category: "support", fanType: "梦女", text: "민정이와 데이트하는 상상을 즐기지만 실제 당사자에게 답을 요구하진 않을 거예요.", translation: "我喜欢幻想和旼炡约会，但不会向现实中的当事人索要答案。" },
  { category: "support", fanType: "梦女", text: "마음속에서는 비 오는 날 우산을 같이 쓰고 있어요. 그건 제 상상으로만 남겨 둘게요.", translation: "在我的想象里，我们雨天共撑一把伞，我会把这留在幻想里。" },
  { category: "support", fanType: "梦女", text: "현실 사진을 분석하는 것보다 민정이 직캠을 보고 설레는 게 편하네요.", translation: "比起分析现实照片，看旼炡直拍、自己心动反而更自在。" },
  { category: "support", fanType: "梦女", text: "제가 좋아하는 이야기가 누구의 실제 사생활도 침범하지 않았으면 해요.", translation: "希望我喜欢的故事不要侵犯任何人的现实隐私。" },
  { category: "support", fanType: "梦女", text: "정말 사귀는 사이라면 부럽겠지만 제 상상은 제 마음속 이야기로 둘게요.", translation: "如果你们真在交往，我会羡慕，但我的幻想会留在自己的心里。" },
  { category: "curious", fanType: "梦女", text: "오늘은 팬픽을 고치면서 시간을 보내려 해요. 현실의 누군가에게 설명을 요구하진 않을게요.", translation: "今天我想花时间修改同人文，不会要求现实中的任何人解释。" },
  { category: "support", fanType: "梦女", text: "팬마다 머릿속의 민정이는 다를 수 있으니 자기 상상을 현실이라고 우기지 않았으면 해요.", translation: "每个粉丝心里的旼炡都可能不同，希望别把自己的幻想硬说成现实。" },
  { category: "support", fanType: "梦女", text: "당신이 민정이에게 편안한 사람이라면 좋겠어요. 저는 제 방식대로 계속 응원할게요.", translation: "希望你是能让旼炡安心的人，我会继续用自己的方式支持她。" },
  { category: "support", fanType: "梦女", text: "현실 연애설이 제 상상을 바꿔도 당신을 탓할 일은 아니겠죠.", translation: "现实恋爱传闻改变了我的幻想，也不该怪到你头上。" },
  { category: "support", fanType: "梦女", text: "실제 삶과 제가 즐기는 상상은 다른 거라는 걸 기억하려고요.", translation: "我会记得现实生活和我享受的幻想是两回事。" },
  { category: "support", fanType: "梦女", text: "오늘은 현실에 답을 찾기보다 제가 좋아하는 무대 영상을 볼래요.", translation: "今天比起在现实里找答案，我更想看喜欢的舞台视频。" },
  { category: "curious", fanType: "私生粉", text: "그날 사진 원본을 본 적 있나요? 더 선명한 사진이 있는지 궁금해요.", translation: "你见过那天照片的原图吗？我好奇有没有更清晰的照片。" },
  { category: "curious", fanType: "私生粉", text: "두 분이 언제부터 아는 사이인지 말해 줄 수 있나요? 그냥 너무 궁금해서요.", translation: "能说说你们从什么时候认识的吗？我只是太好奇了。" },
  { category: "critical", fanType: "私生粉", text: "사진에 나온 옷이 맞는지 직접 확인하고 싶어요. 답하기 싫으면 안 해도 돼요.", translation: "我想确认照片里的衣服是不是那件，不想回答也没关系。" },
  { category: "critical", fanType: "私生粉", text: "사귀는 게 맞다면 언제부터인지 알려 주세요. 친구들에게 자랑하고 싶어서요.", translation: "如果你们真的在交往，能告诉我从什么时候开始吗？我想跟朋友说。" },
  { category: "critical", fanType: "私生粉", text: "민정이와 자주 만나는 편인지 궁금해요. 공개할 수 있는 내용만 알려 주세요.", translation: "我很好奇你们是不是经常见面，只说可以公开的内容就好。" },
  { category: "curious", fanType: "私生粉", text: "사진이 처음 올라온 곳을 아는지 물어봐도 될까요? 계속 검색하게 되네요.", translation: "可以问问你知不知道照片最初发在哪里吗？我一直忍不住搜索。" },
  { category: "critical", fanType: "私生粉", text: "두 분이 친한 사이라는 말만 확인해 주면 댓글이 조용해질 것 같아요.", translation: "如果你能确认你们关系亲近，评论区可能就会安静些。" },
  { category: "critical", fanType: "私生粉", text: "당신 프로필을 계속 보게 되네요. 어떤 관계인지 궁금하지만 선은 지켜야겠죠.", translation: "我一直在看你的主页，很好奇你们是什么关系，但也该守住界限吧。" },
  { category: "curious", fanType: "CP粉", text: "윈카 조합을 오래 좋아해서 이번 소식이 낯설어요. 그래도 당신을 공격할 생각은 없어요.", translation: "我喜欢 윈카 这个组合很久了，所以这条消息让我不习惯，但我不打算攻击你。" },
  { category: "curious", fanType: "CP粉", text: "윈닝 팬이라 둘의 케미를 아껴 왔어요. 그렇다고 현실의 누군가를 괴롭힐 이유는 없겠죠.", translation: "我是 윈닝 粉丝，一直珍惜她们的互动，但没有理由因此骚扰现实中的任何人。" },
  { category: "curious", fanType: "CP粉", text: "윈젤을 좋아하지만 팬들의 해석과 현실은 다를 수 있다는 것도 알고 있어요.", translation: "我喜欢 윈젤，但也知道粉丝解读和现实可能不同。" },
  { category: "support", fanType: "CP粉", text: "제가 좋아했던 조합의 순간은 여전히 소중해요. 지키겠다고 다른 사람을 공격하고 싶진 않아요.", translation: "我喜欢的组合瞬间依然珍贵，但我不想为了维护它去攻击别人。" },
  { category: "curious", fanType: "CP粉", text: "오늘은 각자 좋아하는 조합 때문에 싸우는 계정이 많네요. 민정이를 증거처럼 쓰지 말았으면 해요.", translation: "今天很多账号为了自己喜欢的组合吵架，希望别把旼炡当成证明谁的证据。" },
  { category: "curious", fanType: "CP粉", text: "당신과 민정이의 관계는 모르지만 제 해석을 누구에게 강요하지는 않을게요.", translation: "我不知道你和旼炡的关系，但不会把自己的解读强加给别人。" },
  { category: "support", fanType: "普通粉丝", text: "저는 음악 듣다가 이 소식을 봤어요. 확인되지 않은 일로 두 분이 힘들어지지 않았으면 합니다.", translation: "我听歌时刷到了这件事，希望你们不要因为未经确认的消息而受苦。" },
  { category: "support", fanType: "普通粉丝", text: "뉴스 제목은 단정적인데 내용은 추측뿐이네요. 당신 계정까지 찾아가는 사람이 줄었으면 해요.", translation: "新闻标题看起来很肯定，内容却只有猜测，希望跑到你账号的人少一些。" },
  { category: "support", fanType: "普通粉丝", text: "연예인도 누군가를 만날 수 있지만 소문이 뜨면 다들 당황하는 것 같아요.", translation: "我知道艺人也可以交往，但传闻出现时大家还是会慌乱。" },
  { category: "support", fanType: "普通粉丝", text: "두 분 다 원치 않는 관심을 받고 있는 것 같아 안타깝네요.", translation: "你们两个人似乎都受到了不想要的关注，挺让人难过的。" },
  { category: "curious", fanType: "普通粉丝", text: "사실이면 축하할 사람도 있고 시간이 필요한 사람도 있겠죠. 서로 몰아붙이지 말아요.", translation: "如果是真的，有人会祝福，也有人需要时间，别互相逼迫。" },
  { category: "support", fanType: "普通粉丝", text: "다음 공식 무대를 기다릴게요. 확인 전에는 소문을 반복해서 퍼 나르지 않으려고요.", translation: "我会等待下一次正式舞台，在确认之前不反复传播传闻。" },
  { category: "support", fanType: "普通粉丝", text: "인물 관계보다 사진이 어떤 경로로 퍼졌는지가 더 궁금해요.", translation: "比起两人的关系，我更好奇照片是通过什么渠道传播的。" },
  { category: "support", fanType: "普通粉丝", text: "오늘은 두 분 모두 알림을 끄고 편하게 쉴 시간이 있었으면 좋겠어요.", translation: "希望你们今天都能关掉通知，安心休息一会儿。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "이런 소식만 기다렸다는 듯 조롱하는 계정이 보이네요. 확인되지 않은 일로 사람을 깎아내리진 맙시다.", translation: "有些账号像是一直等着这种消息来嘲讽人，别用未经证实的事贬低别人。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "누구든 근거 없이 민정이 커리어를 망친다고 몰아가는 건 과하다고 생각해요.", translation: "不管是谁，毫无根据地说对方会毁掉旼炡的事业，我觉得太过了。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "사진을 핑계로 외모나 성격을 조롱하는 건 논의가 아니라 악의에 가까워 보여요.", translation: "借照片嘲讽外貌或性格，看起来不像讨论，更像恶意。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "소문이 맞든 아니든 당사자에게 막말을 보내는 건 그만했으면 합니다.", translation: "无论传闻真假，希望停止给当事人发难听的话。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "논란으로 조회수만 얻으려는 계정들이 제일 피곤해요. 자극적인 떡밥은 더 만들지 마세요.", translation: "最让人疲惫的是靠争议赚流量的账号，请别再制造刺激性话题。" },
  { category: "critical", fanType: "黑粉借题发挥", text: "좋아하든 싫어하든 확인 전부터 누군가를 범인처럼 몰아가는 건 공정하지 않아요.", translation: "不管喜欢还是讨厌，在确认之前就把人当成罪人并不公平。" },
  { category: "passerby", fanType: "路人", text: "추천 탭에 떠서 봤는데 사진만으로는 아무것도 확실하지 않네요. 일단 지나갈게요.", translation: "推荐页推给我才点进来看，光凭照片什么也确认不了，我先划走了。" },
  { category: "passerby", fanType: "路人", text: "팬은 아니지만 두 사람의 사생활이 하루 종일 구경거리가 되는 건 불편해요.", translation: "我不是粉丝，但两个人的私生活被围观一整天，还是让人不舒服。" },
  { category: "passerby", fanType: "路人", text: "댓글이 너무 빨리 결론을 내리고 있어요. 확인된 내용이 나올 때까지 기다리면 좋겠네요.", translation: "评论区下结论太快了，希望大家等确认消息出来再说。" },
  { category: "passerby", fanType: "路人", text: "며칠 지나면 또 다른 화제가 되겠지만 서로 상처 주는 말은 줄었으면 해요.", translation: "过几天大家可能又讨论别的话题，但希望互相伤害的话能少一点。" },
  { category: "passerby", fanType: "路人", text: "당신도 민정이도 오늘은 알림을 꺼 두고 잠시 쉬었으면 좋겠어요.", translation: "希望你和旼炡今天都能关掉通知休息一会儿。" },
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
        instagramUi["scandal-ig-dm-screen-active-v6"] === true &&
        instagramUi["scandal-ig-open-thread-v6"] === dm.id;
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
                      const currentCallStep = Number(current.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0);
                      const incompleteScandalCall =
                        call.target === "scandal-call" &&
                        (call.status === "ringing" ||
                          (call.status === "answered" && currentCallStep < 6));
                      const next = dispatch(
                        work,
                        { ...current, incomingCall: null },
                        incompleteScandalCall || call.status === "ringing" ? "callDeclined" : "callEnded",
                        call.target || call.caller,
                      );
                      if (incompleteScandalCall) {
                        next.ui = {
                          ...next.ui,
                          kakao: {
                            ...next.ui?.kakao,
                            "scandal-call-result-v5": "declined",
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
