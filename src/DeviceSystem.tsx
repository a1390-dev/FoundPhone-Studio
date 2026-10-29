import {
  ConnectivityModule,
  SliderModule,
} from "./vendor/ios-web/ControlModules";
import { UnlockHandle } from "./vendor/ios-web/UnlockHandle";
import { useState, useEffect, createContext, useContext } from "react";
import {
  LockKeyhole,
  Flashlight,
  Camera,
  Delete,
  ChevronDown,
  Play,
  SkipForward,
  Moon,
  RotateCcw,
  Monitor,
  Timer,
  Calculator,
  Globe,
  Mic,
  ArrowUp,
  ChevronUp,
  Plus,
  Power,
  Signal,
  House,
  ScanLine,
  Circle,
  Radio,
  Wifi,
  Battery,
  Heart,
  Music2,
  Airplay,
  ChevronRight,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import type { Work } from "./schema";
export const KeyboardContext = createContext<(open: boolean) => void>(() => {});
export function NativeComposer({
  creator,
  onAdd,
}: {
  creator: boolean;
  onAdd: () => void;
}) {
  const open = useContext(KeyboardContext);
  return (
    <button
      className="native-compose-field"
      aria-label={creator ? "添加消息" : "输入消息"}
      onClick={() => (creator ? onAdd() : open(true))}
    >
      {creator ? "添加消息" : ""}
    </button>
  );
}
export function DeviceLock({
  work,
  time,
  pinOpen,
  setPinOpen,
  error,
  onUnlock,
  onCamera,
  onLight,
  canContinue,
  onNewPlayer,
  phoneScale,
}: {
  work: Work;
  phoneScale: number;
  time: string;
  pinOpen: boolean;
  setPinOpen: (v: boolean) => void;
  error: string;
  onUnlock: (v: string) => void;
  onCamera: () => void;
  onLight: () => void;
  canContinue: boolean;
  onNewPlayer: (id: string) => void;
}) {
  const [code, setCode] = useState("");
  const [playerId, setPlayerId] = useState(() => { try { return localStorage.getItem("foundphone.player-id.v1")?.trim() || ""; } catch { return ""; } });
  const [idDraft, setIdDraft] = useState("");
  const [resumeChoice, setResumeChoice] = useState<"choice" | "new" | "hidden">(() => {
    try { return localStorage.getItem("foundphone.player-id.v1")?.trim() ? "choice" : "new"; }
    catch { return "new"; }
  });
  useEffect(() => {
    if (error) setCode("");
  }, [error]);
  useEffect(() => {
    if (!pinOpen) setCode("");
  }, [pinOpen]);
  const digit = (key: string) => {
    const value = key === "⌫" ? code.slice(0, -1) : (code + key).slice(0, 12);
    setCode(value);
    if (
      /^\d+$/.test(work.phone.passcode) &&
      value.length === work.phone.passcode.length
    ) {
      onUnlock(value);
      setCode("");
    }
  };
  const open = () => (work.phone.passcode ? setPinOpen(true) : onUnlock(""));
  return (
    <motion.div
      className={"lock-screen device-lock " + (pinOpen ? "pin-open" : "")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: -852, opacity: 0 }}
      transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
    >
      {!pinOpen ? (
        <>
          <div className="lock-clock-block">
            <LockKeyhole size={18} />
            <p>
              {new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                day: "numeric",
                weekday: "long",
                timeZone: "UTC",
              }).format(
                new Date((work.phone.date || "2026-09-01") + "T12:00:00Z"),
              )}
            </p>
            <h1>{time}</h1>
          </div>
          {resumeChoice !== "hidden" && (
            <div className="player-session-shade">
              <section className="player-session-modal" role="dialog" aria-modal="true" aria-labelledby="player-session-title">
                {resumeChoice === "choice" ? (
                  <>
                    <h2 id="player-session-title">欢迎回来</h2>
                    <p>继续使用玩家 ID「{playerId}」读取上次进度，或开始一段全新的游戏。</p>
                    <button
                      type="button"
                      className="player-session-primary"
                      disabled={!canContinue}
                      onClick={() => setResumeChoice("hidden")}
                    >
                      {canContinue ? "继续游戏" : "正在读取存档…"}
                    </button>
                    <button
                      type="button"
                      className="player-session-secondary"
                      onClick={() => { setIdDraft(""); setResumeChoice("new"); }}
                    >
                      新 ID，从头开始
                    </button>
                  </>
                ) : (
                  <>
                    <h2 id="player-session-title">{playerId ? "开始新游戏" : "设置玩家 ID"}</h2>
                    <p>{playerId ? "新进度会单独保存，之前的存档不会被删除。" : "先设置你的玩家 ID / 昵称。"}</p>
                    <form
                      className="player-session-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = idDraft.trim().slice(0, 24);
                        if (!value) return;
                        // Blur immediately so Safari starts dismissing the
                        // keyboard before React swaps the ID dialog for PIN.
                        e.currentTarget.querySelector<HTMLInputElement>("#foundphone-player-id")?.blur();
                        window.setTimeout(() => {
                          setPlayerId(value);
                          onNewPlayer(value);
                          setResumeChoice("hidden");
                          if (work.phone.passcode) setPinOpen(true); else onUnlock("");
                        }, 220);
                      }}
                    >
                      <input
                        id="foundphone-player-id"
                        style={{ fontSize: `${16 / Math.max(phoneScale, 0.4)}px` }}
                        value={idDraft}
                        onChange={(e) => setIdDraft(e.target.value)}
                        maxLength={24}
                        autoComplete="nickname"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="NAME"
                        required
                      />
                      <button type="submit" className="player-session-primary">开始新游戏</button>
                      {playerId ? (
                        <button type="button" className="player-session-secondary" onClick={() => setResumeChoice("choice")}>返回</button>
                      ) : null}
                    </form>
                  </>
                )}
              </section>
            </div>
          )}
          {playerId && resumeChoice === "hidden" ? <UnlockHandle onUnlock={open} /> : null}

          <div className="lock-tools">
            <button onClick={onLight} aria-label="手电筒">
              <Flashlight size={23} />
            </button>
            <button
              onClick={onCamera}
              disabled={
                !work.apps.some((a) => a.installed && a.id === "camera")
              }
              aria-label="相机"
            >
              <Camera size={25} />
            </button>
          </div>
        </>
      ) : (
        <div className="device-passcode">
          <LockKeyhole size={22} />
          <h2>输入密码</h2>
          <div
            className={"passcode-dots " + (error ? "pin-shake" : "")}
            aria-label={"已输入" + code.length + "位密码"}
          >
            {Array.from({ length: work.phone.passcode.length }, (_, i) => (
              <i key={i} className={i < code.length ? "filled" : ""} />
            ))}
          </div>
          <input
            className={
              /^\d+$/.test(work.phone.passcode)
                ? "accessible-pin"
                : "legacy-passcode"
            }
            aria-label="锁屏密码"
            autoComplete="off"
            inputMode="numeric"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onUnlock(code)}
          />
          <div className="pin-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map(
              (n, i) =>
                n ? (
                  <button
                    key={i}
                    aria-label={"密码键" + n}
                    onClick={() => digit(n)}
                  >
                    <b>{n}</b>
                    <small>
                      {
                        [
                          "",
                          "",
                          "ABC",
                          "DEF",
                          "GHI",
                          "JKL",
                          "MNO",
                          "PQRS",
                          "TUV",
                          "WXYZ",
                        ][Number(n)]
                      }
                    </small>
                  </button>
                ) : (
                  <span key={i} />
                ),
            )}
          </div>
          <span role="status" className="pin-error">
            {error}
          </span>
          {!/^[0-9]+$/.test(work.phone.passcode) && (
            <button onClick={() => onUnlock(code)}>解锁</button>
          )}
          <div className="pin-footer">
            <button onClick={() => setPinOpen(false)}>取消</button>
            <button
              aria-label="删除一位密码"
              onClick={() => (code ? digit("⌫") : setPinOpen(false))}
            >
              {code ? "删除" : "取消"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
export function ControlCenter({
  battery = 94,
  network,
  close,
}: {
  battery?: number;
  network: string;
  close: () => void;
}) {
  const [rotation, setRotation] = useState(true),
    [focus, setFocus] = useState(false),
    [playing, setPlaying] = useState(false);
  const [brightness, setBrightness] = useState(50),
    [volume, setVolume] = useState(25);
  const [tool, setTool] = useState("");
  return (
    <motion.div
      className="system-panel device-control"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
    >
      <button className="cc-close" aria-label="关闭控制中心" onClick={close}>
        <Power />
      </button>
      <button
        className="cc-edit"
        aria-label="控制中心编辑"
        onClick={() => setTool("编辑控制")}
      >
        <Plus />
      </button>
      <div className="cc-current">
        <span>
          <Airplay size={13} />
        </span>
        控制中心 <ChevronRight size={16} />
      </div>
      <div className="cc-status" aria-label={"蜂窝网络 " + network}>
        <div>
          <span>
            <Signal size={18} />
            <small>主号</small> 中国移动 <Wifi size={17} />
          </span>
          <span>
            <Signal size={18} />
            <small>副号</small> 中国电信
          </span>
        </div>
        <span>
          <Lock size={13} /> {battery}% <Battery size={27} />
        </span>
      </div>
      <nav className="cc-page-rail" aria-label="控制中心分类">
        {[Heart, Music2, House, Radio].map((Icon, i) => (
          <button
            key={i}
            aria-label={["常用控制", "媒体控制", "家庭控制", "连接控制"][i]}
            onClick={() =>
              document
                .querySelector(
                  [".cc-grid", ".cc-music", ".cc-home", ".cc-connect"][i],
                )
                ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }
          >
            <Icon fill={i === 0 ? "currentColor" : "none"} />
          </button>
        ))}
      </nav>
      <div className="cc-grid">
        <ConnectivityModule />
        <div className="cc-music">
          <div className="cc-media-top">
            <span>
              <Music2 size={28} />
            </span>
            <Airplay size={21} />
          </div>
          <div className="cc-media-title">
            <strong>{playing ? "测试播放" : "未在播放"}</strong>
            <small>音乐</small>
          </div>
          <div>
            <button aria-label="上一首">
              <SkipForward style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              aria-label={playing ? "暂停" : "播放"}
              onClick={() => setPlaying(!playing)}
            >
              <Play fill="currentColor" />
            </button>
            <button aria-label="下一首">
              <SkipForward />
            </button>
          </div>
        </div>
        <button
          className={"cc-square " + (rotation ? "cc-white" : "")}
          aria-label="旋转锁定"
          aria-pressed={rotation}
          onClick={() => setRotation(!rotation)}
        >
          <span className="cc-rotation">
            <RotateCcw />
            <Lock size={14} />
          </span>
        </button>
        <button
          className="cc-square"
          onClick={() => setTool(tool ? "" : "屏幕镜像")}
          aria-label="屏幕镜像"
        >
          <Monitor />
        </button>
        <SliderModule
          type="brightness"
          value={brightness}
          onChange={setBrightness}
        />
        <SliderModule type="volume" value={volume} onChange={setVolume} />
        <button
          className={"cc-focus " + (focus ? "cc-white" : "")}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          <Moon />
          <span>专注模式</span>
          <ChevronDown size={14} />
        </button>
        <button className="cc-home" onClick={() => setTool("家庭")}>
          <House size={38} />
          <span>未设置家庭</span>
        </button>
        {[Flashlight, Timer, Calculator, Camera].map((Icon, i) => (
          <button
            className={"cc-square cc-tool-" + i}
            aria-label={["手电筒", "计时器", "计算器", "相机"][i]}
            key={i}
            onClick={() =>
              setTool(tool ? "" : ["手电筒", "计时器", "计算器", "相机"][i])
            }
          >
            <Icon />
          </button>
        ))}
        {[ScanLine, Circle, Radio].map((Icon, i) => (
          <button
            key={i}
            className={"cc-square cc-bottom-tool cc-bottom-" + i}
            aria-label={["扫码", "屏幕录制", "声音识别"][i]}
            onClick={() => setTool(["扫码", "屏幕录制", "声音识别"][i])}
          >
            <Icon />
          </button>
        ))}
      </div>
      {tool && (
        <div className="cc-tool">
          <strong>{tool}</strong>
          <p>
            {tool === "屏幕镜像" ? "正在搜索作品中的设备…" : "作品内快捷控制"}
          </p>
          <button onClick={() => setTool("")}>完成</button>
        </div>
      )}
      <button className="cc-dismiss" onClick={close}>
        轻扫以关闭
        <ChevronUp size={16} />
      </button>
    </motion.div>
  );
}
const PINYIN_CANDIDATES: Record<string, string[]> = {
  a: ["啊", "阿", "呀"], ai: ["爱", "哎", "矮"], an: ["安", "按", "案"],
  ba: ["吧", "把", "爸"], bu: ["不", "不是", "不用"], buyao: ["不要"],
  buxing: ["不行"], chi: ["吃", "迟"], chifan: ["吃饭"], chang: ["常", "长"],
  dao: ["到", "道", "倒"], de: ["的", "得", "地"], deng: ["等", "灯"],
  dengyixia: ["等一下"], dui: ["对", "对的"], duibuqi: ["对不起"],
  en: ["嗯", "恩"], fang: ["放", "房"], gei: ["给"], ganma: ["干嘛"],
  ganxie: ["感谢"], hao: ["好", "好的", "好啊"], haode: ["好的"],
  haoma: ["好吗"], hai: ["还", "海"], he: ["和", "喝"], hen: ["很"],
  hou: ["后", "候"], hui: ["会", "回"], huijia: ["回家"], jia: ["家", "加"],
  jian: ["见", "件"], jiao: ["叫", "教"], jie: ["接", "姐"], jin: ["今", "进"],
  jintian: ["今天"], jiu: ["就", "旧"], ke: ["可", "客"], keyi: ["可以", "可以的"],
  keyima: ["可以吗"], kuai: ["快"], lai: ["来"], le: ["了", "乐"],
  ma: ["吗", "嘛", "妈"], man: ["慢", "满"], mei: ["没", "每"], meishi: ["没事", "没事的"],
  meiyou: ["没有"], meiguanxi: ["没关系"], ming: ["明"], mingtian: ["明天"],
  na: ["那", "哪"], nage: ["那个"], ni: ["你", "你们", "你好"], nihao: ["你好"],
  nizaiganma: ["你在干嘛"], pengyou: ["朋友"], qian: ["前", "钱"], qing: ["请", "情"],
  qu: ["去", "取"], ren: ["人", "认"], shenme: ["什么"], shenmeya: ["什么呀"],
  shi: ["是", "时", "事"], shijian: ["时间"], shui: ["谁", "睡", "水"],
  shuo: ["说", "说话"], ta: ["他", "她", "它"], tai: ["太", "台"],
  tian: ["天"], ting: ["听"], wan: ["晚", "玩"], women: ["我们"], wo: ["我", "我们", "我也"],
  woaini: ["我爱你"], wobuxiang: ["我不想"], wozaijia: ["我在家"], woxiang: ["我想"],
  woxihuan: ["我喜欢"], woxianzai: ["我现在"], woxiangni: ["我想你"],
  wozhidao: ["我知道"], woyaohuijia: ["我要回家"], xian: ["先", "现"],
  xianzai: ["现在"], xihuan: ["喜欢"], xiang: ["想", "像"], xie: ["谢"],
  xiexie: ["谢谢"], xing: ["行", "醒"], xingba: ["行吧"], xin: ["心", "新"],
  yao: ["要", "药"], ye: ["也", "夜"], yi: ["一", "以", "已"], yidian: ["一点"],
  yixia: ["一下"], you: ["有", "又"], zai: ["在", "再"], zaiganma: ["在干嘛"],
  zaoan: ["早安"], zaijian: ["再见"], zuotian: ["昨天"], zhe: ["这", "着"],
  zhege: ["这个"], zheyang: ["这样"], zhen: ["真", "真的"], zhende: ["真的"],
  zhidao: ["知道", "知道了"], zhong: ["中", "钟"], zhuyi: ["注意"],
  zhuyianquan: ["注意安全"], zenme: ["怎么"], zenmeyang: ["怎么样"],
  weishenme: ["为什么"], wanshang: ["晚上"], wanshanghao: ["晚上好"],
  jiayou: ["加油"],
  bei: ["被", "北"], dian: ["点", "电"], duo: ["多", "躲"], fa: ["发", "法"],
  fan: ["饭", "烦"], ge: ["个"], geng: ["更"], gongsi: ["公司"], guo: ["过", "国"],
  huan: ["换", "还", "欢"], jiaqi: ["假期"], ji: ["几", "记"], kaixin: ["开心"],
  kan: ["看"], kou: ["口"], leng: ["冷"], la: ["啦", "拉"], li: ["里", "理"],
  liao: ["聊", "了"], lu: ["路"], nan: ["难", "男"], ne: ["呢"], pai: ["拍", "排"],
  piao: ["票"], qi: ["起", "气", "七"], re: ["热"], shang: ["上"], shao: ["少"],
  shen: ["身"], sheng: ["生", "声"], shu: ["书"], suo: ["所"], suan: ["算"],
  tiao: ["条"], wai: ["外"], wei: ["为", "喂"], wen: ["问"], xia: ["下", "夏"],
  xi: ["西", "喜", "系"], xiao: ["小", "笑"], xue: ["学", "雪"], xuexiao: ["学校"],
  yue: ["月", "越"], zhang: ["张", "长"], zhi: ["只", "知", "直"], zhou: ["周"],
  zui: ["最", "嘴"], zuo: ["做", "坐", "昨"], zhijie: ["直接"],
  bao: ["包", "抱"], cai: ["才", "菜"], can: ["参", "餐"], cao: ["草"],
  cha: ["查", "茶"], chao: ["超", "吵"], chen: ["陈", "沉"], cheng: ["成", "程"],
  chu: ["出", "处"], chuan: ["穿", "传"], chun: ["春"], ci: ["次", "词"],
  cong: ["从"], cuo: ["错"], dai: ["带", "代"], dan: ["但", "单"],
  diao: ["掉"], ding: ["定"], dong: ["懂", "动"], dou: ["都", "豆"],
  du: ["读", "度"], duan: ["短", "段"], fei: ["非", "飞"], fen: ["分", "份"],
  feng: ["风"], fou: ["否"], fu: ["服", "复"], gai: ["该", "改"],
  gan: ["干", "感"], gao: ["高", "搞"], gen: ["跟"], gong: ["工", "公"],
  gou: ["够", "狗"], gu: ["故", "顾"], gua: ["挂"], guan: ["关", "管"],
  guang: ["光"], gui: ["贵", "归"], gun: ["滚"], hei: ["黑"], hong: ["红"],
  hua: ["话", "花"], huai: ["坏"], huang: ["黄"], hun: ["婚"], huo: ["活", "火"],
  jing: ["经", "静"], jiong: ["窘"], ju: ["句", "就"], jue: ["觉", "决"],
  jun: ["军"], kai: ["开"], kang: ["康"], kao: ["考"], ken: ["肯"],
  kong: ["空"], kou: ["口"], ku: ["哭", "苦"], kua: ["夸"], kuai: ["快"],
  kuan: ["宽"], kuang: ["狂"], kui: ["亏"], kun: ["困"], kuo: ["扩"],
  lan: ["蓝", "懒"], lang: ["狼"], lao: ["老", "牢"], lei: ["累", "类"],
  ling: ["零", "灵"], liu: ["留", "六"], long: ["龙"], lou: ["楼"],
  lun: ["论"], luo: ["落"], mang: ["忙"], meng: ["梦"], mi: ["米", "迷"],
  mian: ["面"], miao: ["秒"], min: ["民"], mo: ["摸", "末"], mou: ["某"],
  mu: ["目", "木"], nai: ["奶"], nang: ["囊"], nao: ["脑"], nei: ["内"],
  neng: ["能"], nian: ["年", "念"], niang: ["娘"], niao: ["鸟"], nie: ["捏"],
  ning: ["宁"], niu: ["牛"], nong: ["弄"], nu: ["怒"], nuo: ["诺"],
  pang: ["旁"], pao: ["跑", "泡"], pei: ["陪"], pen: ["盆"], peng: ["朋"],
  pian: ["片"], pin: ["品"], ping: ["平"], po: ["破"], pu: ["普"],
  qia: ["恰"], qiang: ["强"], qiao: ["桥", "巧"], qie: ["切"], qin: ["亲"],
  qing: ["轻", "清"], qiong: ["穷"], qiu: ["秋", "求"], quan: ["全"],
  que: ["却"], qun: ["群"], rang: ["让"], rao: ["绕"], reng: ["仍"],
  rong: ["容"], rou: ["肉"], ru: ["如"], ruan: ["软"], rui: ["瑞"],
  run: ["润"], ruo: ["若"], sai: ["赛"], san: ["三"], sang: ["嗓"],
  sao: ["扫"], se: ["色"], sen: ["森"], sha: ["啥", "杀"], shai: ["晒"],
  shan: ["山", "删"], she: ["谁", "社"], shei: ["谁"], shou: ["手", "收"],
  shua: ["刷"], shuai: ["帅"], shuan: ["栓"], shuang: ["双"], shun: ["顺"],
  sou: ["搜"], su: ["苏", "速"], suan: ["算"], sui: ["随"], sun: ["孙"],
  tan: ["谈"], tang: ["躺", "糖"], tao: ["套"], te: ["特"], teng: ["疼"],
  tie: ["贴"], tong: ["同", "痛"], tou: ["头"], tu: ["图", "土"],
  tuan: ["团"], tui: ["退"], tun: ["吞"], tuo: ["托"], wa: ["哇"],
  wang: ["望", "忘"], weng: ["翁"], wu: ["我", "无"], ya: ["呀", "压"],
  yan: ["眼", "言"], yang: ["样", "阳"], yin: ["因", "音"], ying: ["应", "赢"],
  yong: ["用", "永"], yu: ["语", "与"], yuan: ["元", "远"], yun: ["云"],
  zan: ["咱"], zang: ["脏"], zao: ["早"], ze: ["则"], zen: ["怎"], zeng: ["增"],
  zha: ["炸", "扎"], zhai: ["摘"], zhan: ["站"], zhao: ["找", "照"],
  zheng: ["正", "整"], zhu: ["住", "主"], zhua: ["抓"], zhuai: ["拽"],
  zhuan: ["转"], zhuang: ["装"], zhui: ["追"], zhun: ["准"], zhuo: ["桌"],
  zi: ["字", "自"], zong: ["总"], zou: ["走"], zu: ["组"], zuan: ["钻"],
  zun: ["尊"],
};
function composePinyin(value: string): string {
  let remaining = value.toLowerCase();
  let result = "";
  while (remaining) {
    let matched = "";
    for (let length = Math.min(7, remaining.length); length >= 1; length--) {
      const syllable = remaining.slice(0, length);
      if (PINYIN_CANDIDATES[syllable]) {
        matched = syllable;
        break;
      }
    }
    // Keep the original spelling if this buffer cannot be segmented safely.
    if (!matched) return value;
    result += PINYIN_CANDIDATES[matched][0];
    remaining = remaining.slice(matched.length);
  }
  return result || value;
}

type KeyboardEditable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

function readKeyboardText(target: KeyboardEditable | null | undefined): string {
  if (!target) return "";
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }
  return target.isContentEditable ? (target.innerText || "") : "";
}

function setKeyboardText(target: KeyboardEditable, value: string): void {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const prototype = target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(target, value);
    else target.value = value;
    // Dispatch a native InputEvent after bypassing React's patched setter,
    // so every controlled field receives the same input signal as typed text.
    const inputEvent = typeof InputEvent === "function"
      ? new InputEvent("input", { bubbles: true, inputType: "insertText", data: value })
      : new Event("input", { bubbles: true });
    target.dispatchEvent(inputEvent);
    return;
  }
  if (target.isContentEditable) {
    target.textContent = value;
    target.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: value,
    }));
  }
}

export function DeviceKeyboard({
  close,
  target = null,
}: {
  close: () => void;
  target?: KeyboardEditable | null;
}) {
  const [draft, setDraft] = useState(() => readKeyboardText(target)),
    [shift, setShift] = useState(false),
    [numbers, setNumbers] = useState(false),
    [language, setLanguage] = useState<"zh" | "en">(
      () => target instanceof HTMLInputElement && target.id === "foundphone-player-id" ? "en" : "zh",
    ),
    [pinyin, setPinyin] = useState("");

  useEffect(() => {
    setDraft(readKeyboardText(target));
    setPinyin("");
    setLanguage(
      target instanceof HTMLInputElement && target.id === "foundphone-player-id" ? "en" : "zh",
    );
  }, [target]);

  const replaceText = (text: string, deleteBackward = false) => {
    const current = target ? readKeyboardText(target) : draft;
    let start = current.length;
    let end = current.length;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      if (selectionStart !== null && selectionEnd !== null) {
        start = selectionStart;
        end = selectionEnd;
        // The real input deliberately stays unfocused to avoid Safari zoom.
        // When it has existing text, keep the virtual caret at the end.
        if (document.activeElement !== target && start === 0 && end === 0 && current.length) {
          start = end = current.length;
        }
      }
    }
    if (deleteBackward && start === end && start > 0) {
      start = Math.max(0, start - 1);
    }
    const next = current.slice(0, start) + text + current.slice(end);
    if (target) setKeyboardText(target, next);
    setDraft(next);
    const caret = start + text.length;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      try { target.setSelectionRange(caret, caret); } catch { /* Some input types do not support selection ranges. */ }
    }
  };

  const pickCandidate = (candidate: string) => {
    replaceText(candidate);
    setPinyin("");
    setShift(false);
  };
  const finishTyping = () => {
    if (pinyin) {
      const options = PINYIN_CANDIDATES[pinyin.toLowerCase()];
      pickCandidate(options?.[0] || composePinyin(pinyin));
    }
    close();
  };
  const pressKey = (key: string) => {
    if (numbers || !/^[a-z]$/i.test(key) || language === "en") {
      replaceText(shift && language === "en" ? key.toUpperCase() : key);
      return;
    }
    setPinyin((previous) => previous + key.toLowerCase());
  };
  const backspace = () => {
    if (pinyin) {
      setPinyin((previous) => previous.slice(0, -1));
      return;
    }
    replaceText("", true);
  };
  const pressSpace = () => {
    if (pinyin) {
      const options = PINYIN_CANDIDATES[pinyin.toLowerCase()];
      pickCandidate(options?.[0] || composePinyin(pinyin));
      return;
    }
    replaceText(" ");
  };
  const toggleLanguage = () => {
    if (pinyin) {
      const options = PINYIN_CANDIDATES[pinyin.toLowerCase()];
      pickCandidate(options?.[0] || composePinyin(pinyin));
    }
    setLanguage((current) => current === "zh" ? "en" : "zh");
    setShift(false);
  };
  const candidates = pinyin
    ? (
        PINYIN_CANDIDATES[pinyin.toLowerCase()] ||
        [composePinyin(pinyin), pinyin].filter((candidate, index, all) => all.indexOf(candidate) === index)
      ).slice(0, 5)
    : language === "zh" ? ["我", "你", "好的", "可以"] : ["@", ".", "_", "-"];
  const rows = numbers
    ? ["1234567890", "-/:;()¥&@", ".,?!'"]
    : ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  return (
    <div className="device-keyboard" role="dialog" aria-label="苹果风格屏幕键盘">
      <div className="keyboard-candidates" aria-label="输入法候选词">
        {pinyin && (
          <button
            type="button"
            className="keyboard-pinyin-preview"
            aria-label={"输入拼音 " + pinyin}
            onClick={() => pickCandidate(pinyin)}
          >
            {pinyin}
          </button>
        )}
        {candidates.map((candidate, index) => (
          <button type="button" key={candidate + index} onClick={() => pickCandidate(candidate)}>
            {candidate}
          </button>
        ))}
      </div>
      {rows.map((row, index) => (
        <div className="keyboard-row" key={row}>
          {index === 2 && (
            <button
              type="button"
              className="key-special"
              aria-label="切换大小写"
              onClick={() => setShift((value) => !value)}
            >
              <ArrowUp size={19} />
            </button>
          )}
          {[...row].map((key) => (
            <button type="button" key={key} onClick={() => pressKey(key)}>
              {language === "en" && shift && !numbers ? key.toUpperCase() : key}
            </button>
          ))}
          {index === 2 && (
            <button type="button" className="key-special" aria-label="退格" onClick={backspace}>
              <Delete size={20} />
            </button>
          )}
        </div>
      ))}
      <div className="keyboard-row keyboard-bottom">
        <button type="button" onClick={() => setNumbers((value) => !value)}>
          {numbers ? "ABC" : "123"}
        </button>
        <button type="button" className="keyboard-language" onClick={toggleLanguage}>
          {language === "zh" ? "中/英" : "英/中"}
        </button>
        <button type="button" className="key-space" onClick={pressSpace}>空格</button>
        <button type="button" onClick={finishTyping}>完成</button>
      </div>
      <div className="keyboard-accessories">
        <Globe size={24} />
        <small>{language === "zh" ? "简体拼音" : "English"}</small>
        <Mic size={23} />
      </div>
    </div>
  );
}
export { NativeSettings } from "./ios/Settings";
