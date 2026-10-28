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
  memo,
  useState,
  useRef,
  Suspense,
  lazy,
  type CSSProperties,
} from "react";
import { AnimatePresence } from "motion/react";
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
  { category: "support", text: "사진만으로는 아무것도 단정할 수 없으니까 너무 마음 쓰지 마요.", translation: "光凭照片什么都不能下定论，别太放在心上。" },
  { category: "support", text: "갑자기 이런 일이 생겨서 놀랐겠어요. 오늘은 푹 쉬어요.", translation: "突然发生这种事一定吓到了吧，今天好好休息。" },
  { category: "support", text: "어떤 상황이든 당신이 괜찮았으면 좋겠어요.", translation: "不管是什么情况，都希望你能好好的。" },
  { category: "support", text: "억측하는 말은 너무 신경 쓰지 않았으면 해요 🤍", translation: "希望你不要太在意那些猜测的话 🤍" },
  { category: "support", text: "사진이 흐릿한데 다들 너무 빨리 결론 내리는 것 같아요.", translation: "照片那么模糊，大家下结论也太快了。" },
  { category: "support", text: "힘든 하루였겠지만 밥도 챙겨 먹고 마음 잘 돌봐요.", translation: "今天应该很难熬，记得吃饭，也照顾好自己的心情。" },
  { category: "support", text: "누가 뭐라고 하든 당신 일상도 소중하다는 거 잊지 마요.", translation: "不管别人说什么，都别忘了你的日常生活也很重要。" },
  { category: "support", text: "괜히 상처받지 않았으면 해서 조심스럽게 메시지 남겨요.", translation: "怕你无端受伤，所以小心地给你留条消息。" },
  { category: "support", text: "지나친 추측보다 서로 예의를 지키는 게 먼저인 것 같아요.", translation: "比起过度猜测，我觉得先保持彼此的礼貌更重要。" },
  { category: "support", text: "오늘은 SNS 잠깐 꺼 두고 편하게 있어도 괜찮아요.", translation: "今天暂时关掉社交软件、放松一下也没关系。" },
  { category: "support", text: "어제 무슨 일이 있었든 안전하고 평온했길 바라요.", translation: "不管昨晚发生了什么，希望你平安、平静。" },
  { category: "support", text: "남들이 만든 이야기보다 본인이 느끼는 게 더 중요해요.", translation: "比起别人编出来的故事，你自己的感受更重要。" },
  { category: "support", text: "갑자기 DM 보내서 미안해요. 그냥 응원하고 싶었어요.", translation: "突然发私信不好意思，只是想给你一点支持。" },
  { category: "support", text: "괜찮아질 때까지 천천히 해도 돼요. 서두를 필요 없어요.", translation: "等心情好起来再慢慢来就好，不用着急。" },
  { category: "support", text: "온라인에서 떠드는 사람들보다 실제 주변 사람을 믿어요.", translation: "比起网上议论的人，更应该相信现实中身边的人。" },
  { category: "support", text: "혹시 많이 놀랐다면 오늘은 알림을 꺼 두는 것도 추천해요.", translation: "如果真的被吓到了，今天关掉通知也是个选择。" },
  { category: "support", text: "사실 확인도 안 된 얘기로 누군가를 몰아가지 않았으면 해요.", translation: "希望大家不要用未经证实的消息围攻任何人。" },
  { category: "support", text: "당신이 평범하게 하루를 보낼 수 있길 바라는 사람도 있어요.", translation: "也有人希望你能像平常一样度过一天。" },
  { category: "support", text: "괜찮다는 말 한마디라도 전하고 싶어서 연락했어요.", translation: "只是想告诉你一句，希望你没事。" },
  { category: "support", text: "사생활은 사생활인데 사진 한 장으로 너무 커졌네요.", translation: "私人生活就是私人生活，却因为一张照片闹得这么大。" },
  { category: "support", text: "오늘만큼은 댓글보다 따뜻한 말들을 더 많이 봤으면 해요.", translation: "希望你今天看到的温暖话语能比评论区里的更多。" },
  { category: "support", text: "어떤 선택을 하든 무리하지 말고 스스로를 먼저 챙겨요.", translation: "无论怎么选择，都别勉强自己，先照顾好自己。" },
  { category: "support", text: "괜히 나서서 말 얹지 않고 조용히 응원할게요.", translation: "我不会跟着起哄，只会安静地支持你。" },
  { category: "critical", text: "사진 한 장 때문에 이렇게 시끄러워지는 것도 좀 피곤하네요.", translation: "因为一张照片闹成这样，确实有点烦。" },
  { category: "critical", text: "관심 받고 싶어서 일부러 그런 거라는 말까지 나오던데요.", translation: "甚至有人说这是故意博关注的。" },
  { category: "critical", text: "솔직히 이런 소문에 계속 엮이는 건 별로예요.", translation: "说实话，我不太喜欢总是卷进这种传闻。" },
  { category: "critical", text: "팬들 입장도 생각해 줬으면 한다는 사람도 있더라고요.", translation: "也有人希望能考虑一下粉丝的感受。" },
  { category: "critical", text: "확실한 것도 없는데 괜히 일만 커진 느낌이에요.", translation: "什么都没确定，感觉事情倒是越闹越大。" },
  { category: "critical", text: "이런 사진 찍어서 퍼뜨리는 사람이나 그걸 확대하는 사람이나…", translation: "偷拍照片再传播的人，和跟着放大的人都……" },
  { category: "critical", text: "다들 연예인이면 사생활도 마음대로 소비해도 되는 줄 아나 봐요.", translation: "好像大家觉得只要是艺人，私生活就能随便消费。" },
  { category: "critical", text: "루머 계정들이 또 조회수 올리려고 신났네요.", translation: "传闻账号又为了流量兴奋起来了。" },
  { category: "critical", text: "솔직히 지금은 누구 말도 믿기 어렵네요.", translation: "说实话，现在谁的话都很难相信。" },
  { category: "critical", text: "한 장의 사진으로 사람을 판단하는 건 좀 성급하지 않나요?", translation: "凭一张照片判断一个人，不觉得太草率了吗？" },
  { category: "critical", text: "관종 계정들이 추측을 사실처럼 쓰는 건 정말 별로예요.", translation: "那些博眼球的账号把猜测写得像事实一样，真的很败好感。" },
  { category: "critical", text: "이런 일이 반복되니까 피곤하긴 하네요. 조용히 좀 넘어갔으면.", translation: "这种事一再发生确实很累，希望能安静地过去。" },
  { category: "critical", text: "팬덤 분위기만 더 나빠지는 것 같아서 답답해요.", translation: "感觉只会让粉圈气氛更差，挺让人憋闷的。" },
  { category: "critical", text: "제발 확인 안 된 캡처로 사람 몰아가는 건 그만했으면.", translation: "拜托别再用未经证实的截图围攻别人了。" },
  { category: "critical", text: "누군가는 장난처럼 말하지만 당사자는 불편할 수도 있죠.", translation: "有人说得像开玩笑，但当事人也可能会不舒服。" },
  { category: "critical", text: "소문에 신나서 달려드는 계정들 진짜 한결같네요.", translation: "那些兴奋地冲进传闻里的账号还真是一如既往。" },
  { category: "critical", text: "왜 꼭 남의 밤 산책까지 콘텐츠로 만들어야 하는지 모르겠어요.", translation: "真不明白为什么连别人晚上散个步都要做成内容。" },
  { category: "critical", text: "이쯤 되면 사진보다 사람들 반응이 더 무섭네요.", translation: "到这个地步，比起照片本身，大家的反应更吓人。" },
  { category: "critical", text: "추측성 게시물에 좋아요 누르는 것도 조금은 생각해 봐야죠.", translation: "给猜测帖点赞之前，也该稍微想一想。" },
  { category: "critical", text: "당사자 입장도 모르면서 훈수 두는 건 그만했으면 해요.", translation: "连当事人的立场都不知道，就别再指手画脚了。" },
  { category: "critical", text: "소문 하나로 하루 종일 싸우는 거 보면 다들 지친 것 같아요.", translation: "看大家为了一个传闻吵一整天，感觉所有人都累了。" },
  { category: "critical", text: "관심 끌려고 말을 보태는 계정은 그냥 넘기는 게 답인 듯.", translation: "为了吸引关注添油加醋的账号，还是划走算了。" },
  { category: "critical", text: "진짜라 해도 남이 확인할 일은 아닌 것 같아요.", translation: "就算是真的，也不是旁人该去查证的事。" },
  { category: "critical", text: "이 일로 누굴 공격하는 건 선 넘는 행동이라고 봐요.", translation: "因为这件事去攻击谁，我觉得就是越界了。" },
  { category: "curious", text: "실례지만 사진 속 사람이 정말 본인 맞아요?", translation: "冒昧问一下，照片里的人真的是你吗？" },
  { category: "curious", text: "어제 그 편의점 근처에 계셨던 거예요? 그냥 궁금해서요.", translation: "你昨晚在那家便利店附近吗？只是有点好奇。" },
  { category: "curious", text: "사진이 너무 흐려서 누군지 잘 안 보이던데 무슨 상황이에요?", translation: "照片太模糊了，看不清是谁，究竟是什么情况？" },
  { category: "curious", text: "혹시 기사에 나온 시간대가 맞는지 아세요?", translation: "你知道报道里写的时间对不对吗？" },
  { category: "curious", text: "다른 사람들은 다 아는 분위기라 저만 놓친 건가 싶네요.", translation: "感觉别人都知道了，我还以为只有我错过了。" },
  { category: "curious", text: "그냥 동행한 건지 친구인지 팬들은 엄청 궁금해하네요.", translation: "只是同行还是朋友，粉丝们好像都很好奇。" },
  { category: "curious", text: "혹시 사진이 찍힌 걸 그때 알고 있었어요?", translation: "你当时知道自己被拍了吗？" },
  { category: "curious", text: "타임라인에 계속 떠서 봤는데 원본은 어디서 나온 거래요?", translation: "时间线上一直出现，我想知道原图是从哪里来的？" },
  { category: "curious", text: "제가 맥락을 못 봤는데 처음 올린 계정이 따로 있나요?", translation: "我没看到来龙去脉，最早发布的账号另有其人吗？" },
  { category: "curious", text: "혹시 오해할 만한 각도였던 건지 궁금해요.", translation: "有点好奇是不是拍摄角度容易造成误会。" },
  { category: "curious", text: "사람들이 말하는 아파트 근처가 거기 맞는지 모르겠어요.", translation: "我不确定大家说的公寓附近是不是那个地方。" },
  { category: "curious", text: "지금 올라온 이야기 중에 확인된 사실이 있긴 한가요?", translation: "目前流传的内容里，有什么已经确认的事实吗？" },
  { category: "curious", text: "혹시 두 분이 같이 있는 걸 본 사람이 더 있대요?", translation: "听说还有其他人看到你们在一起吗？" },
  { category: "curious", text: "사진 속 가방 때문에 말이 많던데 그냥 같은 제품 아닌가요?", translation: "大家在讨论照片里的包，说不定只是同款吧？" },
  { category: "curious", text: "아직 아무 말도 안 나온 거죠? 제가 늦게 본 건가 해서요.", translation: "目前还没有任何回应，对吧？我怕是自己看晚了。" },
  { category: "curious", text: "이 상황이 어디서부터 시작됐는지 아는 분 있나요?", translation: "有人知道这件事是从哪里开始的吗？" },
  { category: "curious", text: "댓글마다 설명이 달라서 뭐가 뭔지 모르겠어요.", translation: "每条评论说法都不一样，我已经看糊涂了。" },
  { category: "curious", text: "혹시 편의점에서 뭘 샀는지까지 추측하는 건 너무 간 거겠죠?", translation: "连在便利店买了什么都要猜，是不是太过了？" },
  { category: "curious", text: "그날 날씨나 시간 때문에 얼굴이 더 안 나온 걸까요?", translation: "是因为那天天气或时间的缘故，脸才看不清吗？" },
  { category: "curious", text: "진짜인지 아닌지보다 왜 사진이 퍼졌는지가 궁금해요.", translation: "比起真假，我更好奇照片为什么会被传开。" },
  { category: "curious", text: "저도 그냥 지나가다 봤는데 다들 어디까지 알고 있는 거예요?", translation: "我只是路过看到的，大家到底掌握多少信息啊？" },
  { category: "curious", text: "혹시 공식 입장 나오기 전까지는 기다려 보는 게 맞겠죠?", translation: "在正式回应出来之前，还是先等等比较好吧？" },
  { category: "passerby", text: "추천 탭에 계속 떠서 무슨 일인가 하고 들어와 봤어요.", translation: "推荐页一直推给我，我就进来看看发生了什么。" },
  { category: "passerby", text: "아이돌 소식인 줄 알고 눌렀는데 생각보다 큰 얘기네요.", translation: "我以为只是偶像新闻，点进来才发现讨论这么大。" },
  { category: "passerby", text: "그냥 편의점 다녀온 사진 같은데 인터넷은 정말 빠르네요.", translation: "看起来就像去便利店的照片，网络传播真快。" },
  { category: "passerby", text: "저는 팬은 아닌데 사생활까지 추적하는 건 좀 무섭네요.", translation: "我不是粉丝，但追踪到私人生活有点吓人。" },
  { category: "passerby", text: "퇴근하고 들어왔더니 타임라인이 이 얘기로 가득해요.", translation: "下班回来一看，时间线已经全是这件事了。" },
  { category: "passerby", text: "누군지 잘 모르지만 사진 찍은 사람은 왜 따라다닌 거죠?", translation: "我不太认识她，但拍照的人为什么要跟着别人？" },
  { category: "passerby", text: "이런 건 당사자들이 알아서 할 일 아닌가요.", translation: "这种事不应该由当事人自己处理吗？" },
  { category: "passerby", text: "실시간 검색어처럼 다들 한꺼번에 몰려드는 게 신기하네요.", translation: "大家一下子都涌过来，简直像实时热搜一样。" },
  { category: "passerby", text: "사진 화질이 안 좋은데도 추리를 엄청 하시네요.", translation: "照片画质这么差，大家却推理得很起劲。" },
  { category: "passerby", text: "요즘은 잠깐 외출해도 누군가 사진을 올릴 수 있군요.", translation: "现在只是出个门，也可能有人把照片发上网。" },
  { category: "passerby", text: "댓글 읽다가 원래 무슨 뉴스였는지도 잊어버렸어요.", translation: "看评论看着看着，我都忘了最初是什么新闻。" },
  { category: "passerby", text: "이런 소식은 왜 항상 밤사이에 크게 번지는 걸까요.", translation: "这种消息怎么总是在一夜之间闹大呢？" },
  { category: "passerby", text: "모르는 사람이 봐도 사진만으로는 판단하기 어려워 보여요.", translation: "就算是不认识的人看，也很难只凭照片判断。" },
  { category: "passerby", text: "팬덤 문화는 복잡하네요. 저는 조용히 스크롤할게요.", translation: "粉圈文化真复杂，我还是安静地划走吧。" },
  { category: "passerby", text: "요즘은 확인 전 속보가 너무 많아서 좀 쉬고 싶어요.", translation: "现在未经确认的快讯太多了，有点想休息一下。" },
  { category: "passerby", text: "사람들이 궁금해하는 건 알겠지만 선은 지켰으면 해요.", translation: "我理解大家好奇，但还是希望能有个界限。" },
  { category: "passerby", text: "뉴스 보고 왔는데 아직 확실한 건 없어 보이네요.", translation: "我看新闻过来的，目前好像还没有确切信息。" },
  { category: "passerby", text: "누가 찍었는지 모르겠지만 공개할 사진은 아닌 것 같아요.", translation: "不知道是谁拍的，但我觉得这不是该公开的照片。" },
  { category: "passerby", text: "그냥 오늘 인터넷에서 가장 많이 본 사진이 됐네요.", translation: "这张照片简直成了我今天在网上看到最多的图片。" },
  { category: "passerby", text: "이야기가 너무 빨리 커져서 내일이면 또 다른 얘기로 넘어가겠죠.", translation: "事情闹得太快了，可能明天大家又会讨论别的。" },
  { category: "passerby", text: "당사자들이 불편하지 않게 여기서 더 퍼뜨리진 말았으면.", translation: "希望别再继续扩散了，免得当事人更不舒服。" },
  { category: "passerby", text: "알고리즘이 계속 보여 줘서 왔는데 이제 그만 봐야겠어요.", translation: "算法一直推送，我点进来看了，现在该停下了。" },
];
function createInstagramFanDmBatch(): string[] {
  const records: InstagramFanDm[] = IG_FAN_DM_LINES.map((line, index) => ({
    ...line,
    id: "ig-rumor-dm-" + String(index + 1).padStart(3, "0"),
    handle: "@" + IG_FAN_HANDLE_BASES[index % IG_FAN_HANDLE_BASES.length] + "_" + String(index + 1).padStart(2, "0"),
  }));
  for (let i = records.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [records[i], records[j]] = [records[j], records[i]];
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
  const [appOpenSequence, setAppOpenSequence] = useState(0);
  const [homeRequest, setHomeRequest] = useState(0);
  const [locked, setLocked] = useState(!creator);
  const [pinOpen, setPinOpen] = useState(false);
  const [quickCamera, setQuickCamera] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const appSnapshots = useRef(new Map<string, HTMLElement>());
  const [banner, setBanner] = useState("");
  const noticesSeen = useRef(0);
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
  const kktOpeningNoticeKey = `foundphone.kkt-opening-seen.v1:${encodeURIComponent(playerId || "default")}:${saveGeneration}`;
  const [kktOpeningSeen, setKktOpeningSeen] = useState(() => {
    try { return localStorage.getItem(kktOpeningNoticeKey) === "1"; }
    catch { return false; }
  });
  const kktOpeningSeenRef = useRef(kktOpeningSeen);
  const isKktOpeningNotice = (notice: string) =>
    notice.startsWith("KKT|金旼炡:") && notice.includes("아직 안 잤어?");
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(kktOpeningNoticeKey) === "1"; }
    catch { /* Per-session suppression still works without persistent storage. */ }
    kktOpeningSeenRef.current = seen;
    setKktOpeningSeen(seen);
  }, [kktOpeningNoticeKey]);
  useEffect(() => {
    if (creator) return;
    let hiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= 30 * 60 * 1000 && playerId) {
        setApp("");
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
    setApp("");
    setPanel("");
    setFolder("");
  };
  const update = (next: Runtime) => {
    runtimeRef.current = next;
    setOwn(next);
    onRuntime?.(next);
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
      // Once KKT has been opened for this player run, discard only the opening
      // notification if its pending three-second timer fires after a reload.
      if (kktOpeningSeenRef.current && next.notifications.some(isKktOpeningNotice)) {
        next = {
          ...next,
          notifications: next.notifications.filter((notice) => !isKktOpeningNotice(notice)),
        };
      }
      runtimeRef.current = next;

      const changed =
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
    kktOpeningSeenRef.current = true;
    setKktOpeningSeen(true);
    try { localStorage.setItem(kktOpeningNoticeKey, "1"); }
    catch { /* This run still suppresses repeat opening notices while mounted. */ }
    setBanner((current) => isKktOpeningNotice(current) ? "" : current);
    const current = runtimeRef.current;
    const notifications = current.notifications.filter((notice) => !isKktOpeningNotice(notice));
    if (notifications.length !== current.notifications.length)
      update({ ...current, notifications });
  };
  const open = (id: string, initialThread = "") => {
    if (!work.apps.some((a) => a.id === id && a.installed)) return;
    setAppThread(initialThread);
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

  const unlock = async (pin = "") => {
    if (!work.phone.passcode || pin === work.phone.passcode) {
      if (!creator) await preloadOriginalIconFiles();
      setLocked(false);
      setPinOpen(false);
      event("password", pin);
    } else {
      setPinError("密码不正确");
      setPinOpen(true);
    }
  };
  useEffect(() => {
    if (app && !work.apps.some((a) => a.id === app && a.installed)) setApp("");
  }, [app, work.apps]);
  const displayTime = creator ? work.phone.time : s.time || work.phone.time;
  const callDialogueStep = Number(s.ui?.story?.["scandal-call-dialogue-step-v5"] ?? 0);
  const igDmQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-queue-v6"])
    ? s.ui?.instagram?.["scandal-ig-dm-queue-v6"] as string[] : [];
  const igDmVisibleCount = Number(s.ui?.instagram?.["scandal-ig-dm-visible-count-v6"] ?? 0);
  const igDmBatchStarted = s.ui?.instagram?.["scandal-ig-dm-batch-started-v6"] === true;
  const igDmReplyQueue = Array.isArray(s.ui?.instagram?.["scandal-ig-dm-reply-queue-v6"])
    ? s.ui?.instagram?.["scandal-ig-dm-reply-queue-v6"] as string[] : [];
  const igDmReplyCount = Number(s.ui?.instagram?.["scandal-ig-dm-reply-count-v6"] ?? 0);
  const igDmScreenActive = app === "instagram" &&
    s.ui?.instagram?.["scandal-ig-dm-screen-active-v6"] === true;
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
      (app === "kakao" && appThread === "金旼炡")) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-first-notice-v5"] === true ||
        (app === "kakao" && appThread === "金旼炡")) return;
      update({
        ...latest,
        notifications: [...latest.notifications, "KKT|金旼炡:어디야?"],
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-first-notice-v5": true },
        },
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [creator, app, appThread, s.ui?.story?.["scandal-news-pushed-v5"], s.ui?.story?.["scandal-kkt-first-notice-v5"]]);

  useEffect(() => {
    if (creator || s.ui?.story?.["scandal-kkt-first-notice-v5"] !== true ||
      s.ui?.story?.["scandal-kkt-second-notice-v5"] === true ||
      (app === "kakao" && appThread === "金旼炡")) return;
    const timer = window.setTimeout(() => {
      const latest = runtimeRef.current;
      const latestStory = latest.ui?.story || {};
      if (latestStory["scandal-kkt-second-notice-v5"] === true ||
        (app === "kakao" && appThread === "金旼炡")) return;
      update({
        ...latest,
        notifications: [...latest.notifications, "KKT|金旼炡:혼자 있어?"],
        ui: {
          ...latest.ui,
          story: { ...latestStory, "scandal-kkt-second-notice-v5": true },
        },
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [creator, app, appThread, s.ui?.story?.["scandal-kkt-first-notice-v5"], s.ui?.story?.["scandal-kkt-second-notice-v5"]]);
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
      const instagramUi = current.ui?.instagram || {};
      const next = dispatch(
        work,
        { ...current, incomingCall: null },
        "callEnded",
        "scandal-call",
      );
      next.ui = {
        ...next.ui,
        instagram: {
          ...instagramUi,
          "scandal-ig-dm-batch-started-v6": true,
          "scandal-ig-dm-queue-v6": createInstagramFanDmBatch(),
          "scandal-ig-dm-visible-count-v6": 0,
          "scandal-ig-dm-replies-v6": [],
          "scandal-ig-dm-reply-queue-v6": [],
          "scandal-ig-dm-reply-count-v6": 0,
          "scandal-ig-dm-screen-active-v6": false,
          "scandal-ig-open-thread-v6": "",
        },
      };
      update(next);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [creator, s.incomingCall?.target, s.incomingCall?.status, callDialogueStep]);

  useEffect(() => {
    if (creator || !igDmBatchStarted || igDmVisibleCount >= igDmQueue.length) return;
    const timer = window.setTimeout(() => {
      const current = runtimeRef.current;
      const instagramUi = current.ui?.instagram || {};
      const currentQueue = Array.isArray(instagramUi["scandal-ig-dm-queue-v6"])
        ? instagramUi["scandal-ig-dm-queue-v6"] as string[] : [];
      const currentIndex = Number(instagramUi["scandal-ig-dm-visible-count-v6"] ?? 0);
      const raw = currentQueue[currentIndex];
      if (!raw || currentIndex !== igDmVisibleCount) return;
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
          instagram: {
            ...instagramUi,
            "scandal-ig-dm-visible-count-v6": currentIndex + 1,
          },
        },
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, igDmBatchStarted, igDmVisibleCount, igDmQueue.length, app, igDmScreenActive]);

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
      let message: { id: string; threadId: string; handle: string; text: string; translation: string; role: string };
      try { message = JSON.parse(raw) as typeof message; }
      catch { return; }
      const currentReplies = Array.isArray(instagramUi["scandal-ig-dm-replies-v6"])
        ? instagramUi["scandal-ig-dm-replies-v6"] as string[] : [];
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
            "scandal-ig-dm-replies-v6": [...currentReplies, raw],
            "scandal-ig-dm-reply-count-v6": index + 1,
          },
        },
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [creator, igDmReplyCount, igDmReplyQueue.length, app, igDmScreenActive]);

  useEffect(() => {
    if (igDmScreenActive && banner.startsWith("IGDM|")) setBanner("");
  }, [igDmScreenActive]);

  const plugin = getApp(app);
  useEffect(() => {
    const count = s.notifications.length;
    const latest = s.notifications.at(-1) || "";
    if (
      !locked &&
      work.phone.notifications &&
      count > noticesSeen.current &&
      !(kktOpeningSeenRef.current && isKktOpeningNotice(latest))
    ) {
      setBanner(latest);
      const timer = setTimeout(() => setBanner(""), 4500);
      noticesSeen.current = count;
      return () => clearTimeout(timer);
    }
    noticesSeen.current = count;
  }, [s.notifications.length, locked, work.phone.notifications]);
  const dismissNotice = (index: number) =>
    update({
      ...runtimeRef.current,
      notifications: runtimeRef.current.notifications.filter(
        (_, i) => i !== index,
      ),
    });
  const visibleNoticeEntries = s.notifications
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => !(kktOpeningSeen && isKktOpeningNotice(text)));
  const visibleNotices = visibleNoticeEntries.map((entry) => entry.text);
  const dismissVisibleNotice = (visibleIndex: number) => {
    const originalIndex = visibleNoticeEntries[visibleIndex]?.index;
    if (originalIndex !== undefined) dismissNotice(originalIndex);
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
                setApp("");
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
                  onBack={() => setApp("")}
                  onSettings={onSettings}
                  saveSlots={saveSlots}
                  onSaveSlot={saveToSlot}
                  onLoadSlot={loadFromSlot}
                  onUi={(key, value) => {
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
                  onActiveThread={(nextThread) => setAppThread(nextThread)}
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
                closeStore={() => setApp("")}
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
                      onOpen={() => {
                        setPanel("");
                        if (locked) beginUnlock();
                        else {
                          const latest = runtimeRef.current.notifications.at(-1) || "";
                          const targetApp = notificationContent(latest, work.apps).appId;
                          if (installedApps.some((a) => a.id === targetApp))
                            open(targetApp, targetApp === "kakao" ? notificationContent(latest, work.apps).title : "");
                          else if (installedApps.some((a) => a.id === "messages"))
                            open("messages");
                        }
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
                  setApp("");
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
            <button
              className="device-banner"
              onClick={() => {
                const latest = banner;
                setBanner("");
                const notification = notificationContent(latest, work.apps);
                if (installedApps.some((a) => a.id === notification.appId))
                  open(notification.appId, notification.appId === "kakao" ? notification.title : "");
                else setPanel("notification");
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
            </button>
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
              setApp("");
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
