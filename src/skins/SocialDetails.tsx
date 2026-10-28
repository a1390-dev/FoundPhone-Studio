import { useState } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  Headphones,
  Star,
  Camera,
  Crown,
  Copy,
  Send,
  Home,
  Search,
  Bell,
  Circle,
} from "lucide-react";
import { useSkinState } from "../skinState";
import { RichText } from "../RichText";
import { Avatar, Media, meta } from "./shared";
import type { Item, UiValue } from "../schema";
import "./social-details.css";
export const socialDetailApps = new Set(["twitter", "weibo"]);
const count = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "w" : String(n);

const X_RUMOR_NPCS = [
  { name: "时间线路人", text: "先等等吧，照片这么模糊，现在下结论太快了。" },
  { name: "理性围观中", text: "同一张图被重复转发不等于多了一份证据。" },
  { name: "今天也追星", text: "不管真假，都别去扒同行者的身份和私人行踪。" },
  { name: "热帖观察员", text: "看了最初的发帖，后面很多细节像是网友自己补上的。" },
  { name: "普通用户A", text: "希望大家把‘疑似’留着，别把标题写成已确认。" },
  { name: "不吃二手瓜", text: "我会等有来源的消息，不想靠截图猜人。" },
  { name: "晚间刷帖人", text: "别因为讨论热度高就默认它是真的。" },
  { name: "路过的MY", text: "关心她可以，但别把当事人的私生活当成公共投票。" },
  { name: "新闻核对中", text: "目前能确认的只有照片正在传播，关系没有确认。" },
  { name: "看帖不站队", text: "先看来源和时间，再决定要不要相信，比互相骂有用。" },
];
const X_GENERAL_NPCS = [
  { name: "评论区常客", text: "你这条我也看到了，大家的说法差别还挺大的。" },
  { name: "路过一下", text: "先别急着定论，等更多上下文吧。" },
  { name: "小号观察员", text: "评论区信息太杂了，我会先看原帖。" },
  { name: "夜猫子", text: "时间线真的刷得好快，刚进来又多了好多回复。" },
  { name: "普通网友", text: "有道理，不过目前还是得把推测和事实分开。" },
];
export function SocialDetail(p: {
  app: string;
  item: Item;
  back: () => void;
  owner: string;
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
}) {
  const { item } = p,
    weibo = p.app === "weibo";
  const [liked, setLiked] = useSkinState<boolean>(p, "liked-" + item.id, false),
    [saved, setSaved] = useSkinState<boolean>(p, "saved-" + item.id, false),
    [followed, setFollowed] = useSkinState<boolean>(
      p,
      "followed-" + item.sender,
      false,
    ),
    [extra, setExtra] = useSkinState<string[]>(p, "replies-" + item.id, []),
    [autoNpcReplies] = useSkinState<string[]>(p, "x-auto-replies-" + item.id, []);
  const [tab, setTab] = useState("评论"),
    [draft, setDraft] = useState(""),
    [target, setTarget] = useState(""),
    [menu, setMenu] = useState(false),
    [sort, setSort] = useState(false),
    [copied, setCopied] = useState(false);
  const comments = [...item.comments, ...autoNpcReplies, ...extra],
    replies = sort ? [...comments].reverse() : comments;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const submit = () => {
    const posted = draft.trim();
    if (!posted) return;
    const playerName = p.owner || "机主";
    setExtra([...extra, playerName + (target ? " 回复 @" + target : "") + "：" + posted]);
    setDraft("");
    setTarget("");
    setTab("评论");
    if (!weibo) {
      const rumorPost = item.meta.category === "rumor-discussion";
      const pool = rumorPost ? X_RUMOR_NPCS : X_GENERAL_NPCS;
      const response = pool[Math.floor(Math.random() * pool.length)];
      const delay = 1400 + Math.floor(Math.random() * 3100);
      window.setTimeout(() => {
        setExtra((current) => [...current, response.name + "：" + response.text]);
      }, delay);
    }
  };
  const actions = (
    <div className="post-detail-actions">
      <button aria-label="查看评论" onClick={() => setTab("评论")}>
        <MessageCircle />
        {count(comments.length)}
      </button>
      <button aria-label="查看转发" onClick={() => setTab("转发")}>
        <Repeat2 />
        {meta(item, "reposts", "0")}
      </button>
      <button
        aria-label="喜欢帖子"
        aria-pressed={liked}
        onClick={() => setLiked(!liked)}
      >
        <Heart
          fill={liked ? "#f91880" : "none"}
          color={liked ? "#f91880" : undefined}
        />
        {count(item.likes + (liked ? 1 : 0))}
      </button>
      <button
        aria-label="收藏帖子"
        aria-pressed={saved}
        onClick={() => setSaved(!saved)}
      >
        <Bookmark fill={saved ? "currentColor" : "none"} />
        {saved ? "1" : "0"}
      </button>
      <button aria-label="分享帖子" onClick={() => setMenu(!menu)}>
        <Share />
      </button>
    </div>
  );
  return (
    <div
      className={
        "app-post-detail " +
        (weibo
          ? "weibo-post-detail"
          : "x-post-detail" +
            (p.ui?.["x-dark"] !== false ? " x-reference-dark" : ""))
      }
    >
      <header className="post-detail-nav">
        <button aria-label="返回帖子列表" onClick={p.back}>
          <ChevronLeft size={27} />
        </button>
        <strong>{weibo ? "微博正文" : "帖子"}</strong>
        <div>
          {weibo && <Headphones size={23} />}
          <button aria-label="帖子更多选项" onClick={() => setMenu(!menu)}>
            <MoreHorizontal size={26} />
          </button>
        </div>
      </header>
      <div className="post-detail-scroll">
        <div className="post-detail-author">
          <Avatar name={item.sender} src={item.avatar} />
          <div>
            <strong>{item.sender || "用户"}</strong>
            <small>
              {weibo
                ? item.time + " " + meta(item, "location")
                : meta(item, "handle", item.sender ? "@" + item.sender : "")}
            </small>
          </div>
          {weibo ? (
            <button
              aria-label="关注作者"
              onClick={() => setFollowed(!followed)}
            >
              <Star fill={followed ? "#ff9500" : "none"} />
            </button>
          ) : (
            <button
              className="post-follow"
              onClick={() => setFollowed(!followed)}
            >
              {followed ? "已关注" : "关注"}
            </button>
          )}
        </div>
        <div className="post-detail-body">
          <RichText value={item.richText} fallback={item.body} />
          {item.media && <Media item={item} />}
        </div>
        {weibo ? (
          <div className="weibo-share-options">
            {[Crown, MessageCircle, Camera, Share, Copy].map((Icon, n) => (
              <button
                key={n}
                aria-label={["会员", "微信分享", "相机", "分享", "复制"][n]}
                onClick={() => (n === 4 ? void copy() : setMenu(true))}
              >
                <Icon size={25} />
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="x-post-metadata">
              {item.time} · <b>{meta(item, "views", "0")}</b> 次查看
            </div>
            {actions}
          </>
        )}
        {weibo ? (
          <div className="weibo-detail-tabs">
            {["转发", "评论", "赞"].map((name) => (
              <button
                key={name}
                aria-pressed={tab === name}
                onClick={() => setTab(name)}
              >
                {name}{" "}
                {name === "评论"
                  ? count(comments.length)
                  : name === "赞"
                    ? count(item.likes + (liked ? 1 : 0))
                    : meta(item, "reposts", "0")}
              </button>
            ))}
          </div>
        ) : (
          <div className="x-related-row">
            <button onClick={() => setSort(!sort)}>
              {sort ? "最新" : "相关"}⌄
            </button>
            <button onClick={() => setTab(tab === "转发" ? "评论" : "转发")}>
              查看引用 ›
            </button>
          </div>
        )}
        {weibo && (
          <button className="weibo-sort" onClick={() => setSort(!sort)}>
            {sort ? "按时间" : "按热度"}⌄
          </button>
        )}
        {tab === "评论" ? (
          <div className="post-detail-comments">
            {replies.map((c, index) => {
              const split = c.search(/[：:]/),
                hasName = split > 0 && split < 24,
                name = hasName ? c.slice(0, split) : "用户",
                body = hasName ? c.slice(split + 1) : c;
              return (
                <article key={index} className="post-detail-comment">
                  <Avatar name={name} />
                  <div>
                    <strong>{name}</strong>
                    <p>{body}</p>
                    <div className="post-comment-actions">
                      <button
                        aria-label={"回复" + name}
                        onClick={() => setTarget(name)}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        aria-label={"喜欢回复" + index}
                        onClick={(e) => {
                          e.currentTarget.classList.toggle("liked");
                        }}
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                  <MoreHorizontal size={17} />
                </article>
              );
            })}
            {!replies.length && <p className="post-comments-empty">暂无评论</p>}
          </div>
        ) : (
          <p className="post-comments-empty">
            {tab === "转发" ? "暂无可展开的转发记录" : "暂无更多记录"}
          </p>
        )}
      </div>
      <form
        className="post-detail-reply"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Avatar name={p.owner || "机主"} />
        <input
          aria-label="回复帖子"
          placeholder={
            target ? "回复 @" + target : weibo ? "发表你的评论" : "发布你的回复"
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button aria-label="发送回复" disabled={!draft.trim()}>
          <Send size={20} />
        </button>
      </form>
      {!weibo && (
        <nav className="x-detail-bottom">
          {[Home, Search, Circle, Bell, MessageCircle].map((Icon, n) => (
            <button
              key={n}
              aria-label={
                ["返回X时间线", "X搜索", "X助手", "X通知", "X私信"][n]
              }
              onClick={p.back}
            >
              <Icon />
            </button>
          ))}
        </nav>
      )}
      {menu && (
        <div className="post-options-menu">
          <button onClick={copy}>
            <Copy size={18} />
            {copied ? "已复制" : "复制文字"}
          </button>
          <button
            onClick={() => {
              setSaved(!saved);
              setMenu(false);
            }}
          >
            <Bookmark size={18} />
            {saved ? "取消收藏" : "收藏"}
          </button>
          <button onClick={() => setMenu(false)}>取消</button>
        </div>
      )}
    </div>
  );
}
