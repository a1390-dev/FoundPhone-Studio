import {
  Home,
  MapPin,
  Receipt,
  ShoppingBag,
  Star,
  Ticket,
  Utensils,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  Empty,
  Header,
  Media,
  meta,
  SearchBox,
  Tabs,
  useContent,
  type Props,
} from "./shared";
export function AlipaySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "账单");
  const list =
    tab === "卡包"
      ? items.filter((i) => i.folder === "卡包" || i.folder === "票券")
      : items.filter((i) => !["卡包", "票券"].includes(i.folder));
  return (
    <div className="catalog-skin alipay-ui">
      <Header p={p} />
      <div className="alipay-blue">
        <h2>{tab}</h2>
        <div>
          <button onClick={() => setTab("账单")}>
            <Receipt size={28} />
            账单
          </button>
          <button onClick={() => setTab("卡包")}>
            <Ticket size={28} />
            卡包
          </button>
        </div>
        <small>作品内的虚构支付记录</small>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {list.map((i) =>
          tab === "卡包" ? (
            <button
              className="alipay-ticket"
              key={i.id}
              onClick={() => p.onItem(i)}
            >
              <Ticket size={23} />
              <div>
                <strong>{i.title}</strong>
                <p>{i.body}</p>
                <small>{i.time}</small>
              </div>
            </button>
          ) : (
            <button
              className="alipay-bill"
              key={i.id}
              onClick={() => p.onItem(i)}
            >
              <Wallet size={27} />
              <div>
                <strong>{i.title}</strong>
                <small>
                  {meta(i, "merchant", i.sender)} · {i.time.slice(5, 16)}
                </small>
              </div>
              <span>
                <strong>{meta(i, "amount", "—")}</strong>
                <small>{meta(i, "status", "账单记录")}</small>
              </span>
            </button>
          ),
        )}
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["账单", "卡包"]}
        value={tab}
        set={setTab}
        icons={[<Receipt />, <Ticket />]}
      />
    </div>
  );
}
export function TaobaoSkin(p: Props) {
  const { q, setQ, items } = useContent(p, "商品");
  const [tab, setTab] = useState("商品");
  const [category, setCategory] = useState("全部");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<string>("");
  const [payer, setPayer] = useState("金旼炡");
  const [address, setAddress] = useState("我家 · 首尔江南区");
  const [orderDone, setOrderDone] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: number; payer: string; address: string; total: number; lines: Array<{ title: string; count: number; price: number }> }>>([]);
  const products = items.filter((i) => i.folder === "商品");
  const addresses = items.filter((i) => i.folder === "地址");
  const categories = ["全部", "包包", "项链", "手表", "衣服", "鞋子"];
  const filtered = products.filter((i) =>
    (category === "全部" || meta(i, "category") === category) &&
    (i.title + " " + i.sender + " " + i.body).toLowerCase().includes(q.toLowerCase())
  );
  const cartProducts = products.filter((i) => (cart[i.id] || 0) > 0);
  const totalCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const total = cartProducts.reduce((sum, i) => sum + Number(meta(i, "price", "0").replace(/,/g, "")) * (cart[i.id] || 0), 0);
  const money = (n: number) => "₩" + Math.round(n).toLocaleString("en-US");
  const add = (id: string) => setCart((old) => ({ ...old, [id]: (old[id] || 0) + 1 }));
  const change = (id: string, delta: number) => setCart((old) => {
    const next = { ...old, [id]: Math.max(0, (old[id] || 0) + delta) };
    if (!next[id]) delete next[id];
    return next;
  });
  const openCheckout = () => { setOrderDone(false); setTab("结账"); };
  return (
    <div className="catalog-skin taobao-ui" style={{ background: "#f6f6f6", color: "#222" }}>
      <Header p={p} />
      <div style={{ padding: "8px 12px 10px", background: "#fff" }}>
        <div className="taobao-search"><SearchBox value={q} set={setQ} placeholder="搜索包包、珠宝、手表、服饰" /></div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10 }}>
          {["商品", "购物车", "订单"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setOrderDone(false); }} style={{ whiteSpace: "nowrap", borderRadius: 18, padding: "8px 14px", background: tab === t ? "#f7a31b" : "#f2f2f2", color: tab === t ? "#fff" : "#444", fontWeight: 600 }}>
              {t}{t === "购物车" && totalCount > 0 ? ` ${totalCount}` : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="catalog-scroll" style={{ padding: "10px 12px 90px" }}>
        {tab === "商品" && <>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 0 12px" }}>
            {categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} style={{ flex: "0 0 auto", borderRadius: 16, padding: "6px 12px", background: category === cat ? "#222" : "#fff", color: category === cat ? "#fff" : "#444", border: "1px solid #eee" }}>{cat}</button>)}
          </div>
          <div className="taobao-products" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            {filtered.map((i, n) => <article key={i.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px #00000008" }}>
              <button onClick={() => setDetail(i.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", color: "#222", padding: 10 }}>
                <div style={{ height: 110, borderRadius: 8, display: "grid", placeItems: "center", background: ["#eee7e2","#e9e9e9","#e7e4df","#f0e8e4","#e8ecea"][n%5], color: "#222", fontSize: 32, marginBottom: 8 }}>
                  {({ "包包":"👜", "项链":"📿", "手表":"⌚", "衣服":"🧥", "鞋子":"👟"} as Record<string,string>)[meta(i,"category","包包")]}
                </div>
                <small style={{ color: "#8a7b6d", fontWeight: 700 }}>{meta(i,"brand")}</small>
                <strong style={{ display: "block", minHeight: 38, fontSize: 13, lineHeight: 1.4, marginTop: 3 }}>{i.title}</strong>
                <b style={{ display: "block", color: "#c62828", fontSize: 16, marginTop: 6 }}>{money(Number(meta(i,"price","0").replace(/,/g,"")))}</b>
                <small style={{ color: "#999" }}>{meta(i,"sales")}</small>
              </button>
              <button onClick={() => add(i.id)} style={{ width: "calc(100% - 16px)", margin: "0 8px 8px", borderRadius: 18, padding: "7px 4px", background: "#f7a31b", color: "#fff", fontWeight: 700 }}>加入购物车</button>
            </article>)}
          </div>
          <p style={{ textAlign: "center", color: "#999", fontSize: 11, padding: 12 }}>共 {products.length} 件模拟商品 · 价格以韩元显示</p>
        </>}
        {tab === "购物车" && <>
          <h3>购物车 · {totalCount} 件</h3>
          {cartProducts.map((i) => <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, marginBottom: 8, background: "#fff", borderRadius: 12 }}>
            <div style={{ fontSize: 28 }}>{({ "包包":"👜", "项链":"📿", "手表":"⌚", "衣服":"🧥", "鞋子":"👟"} as Record<string,string>)[meta(i,"category","包包")]}</div>
            <div style={{ flex: 1, minWidth: 0 }}><strong>{i.title}</strong><small style={{ display: "block", color: "#888" }}>{meta(i,"brand")}</small><b style={{ color: "#c62828" }}>{money(Number(meta(i,"price","0").replace(/,/g,"")))}</b></div>
            <button onClick={() => change(i.id,-1)} aria-label="减少数量" style={{ padding: 6 }}>−</button><span>{cart[i.id]}</span><button onClick={() => change(i.id,1)} aria-label="增加数量" style={{ padding: 6 }}>＋</button>
          </div>)}
          {!cartProducts.length && <p style={{ padding: 30, textAlign: "center", color: "#888" }}>购物车还是空的，去挑选喜欢的商品吧。</p>}
          <div style={{ position: "sticky", bottom: 0, background: "#fff", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><small>合计</small><strong style={{ display: "block", color: "#c62828", fontSize: 18 }}>{money(total)}</strong></div>
            <button disabled={!totalCount} onClick={openCheckout} style={{ background: totalCount ? "#f04438" : "#ccc", color: "#fff", padding: "11px 22px", borderRadius: 24, fontWeight: 700 }}>结账</button>
          </div>
        </>}
        {tab === "结账" && <>
          {orderDone ? <div style={{ background: "#fff", padding: 24, borderRadius: 14, textAlign: "center" }}><strong style={{ fontSize: 20 }}>订单已创建</strong><p>付款人：{payer}</p><p>收货地址：{address}</p><p style={{ color: "#c62828", fontWeight: 700 }}>{money(total)}</p><small>这是模拟器内的虚构订单，不会产生真实付款。</small><button onClick={() => { setCart({}); setTab("订单"); }} style={{ display: "block", width: "100%", marginTop: 18, padding: 12, borderRadius: 22, background: "#f7a31b", color: "#fff" }}>完成</button></div> : <>
            <h3>确认订单</h3>
            <section style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12 }}><strong>选择付款人</strong>
              {["刘知珉","内永绘里","金旼炡","宁艺卓"].map(n => <button key={n} onClick={() => setPayer(n)} style={{ display: "inline-block", margin: "10px 6px 0 0", padding: "8px 12px", borderRadius: 18, background: payer === n ? "#222" : "#f2f2f2", color: payer === n ? "#fff" : "#333" }}>{n}{payer === n ? " ✓" : ""}</button>)}
            </section>
            <section style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12 }}><strong>收货地址</strong>
              {(addresses.length ? addresses.map(a => meta(a,"address",a.title)) : ["我家 · 首尔江南区","刘知珉家","内永绘里家","金旼炡家","宁艺卓家","我学校 · 首尔","刘知珉公司","内永绘里公司","金旼炡公司","宁艺卓公司"]).map(a => <button key={a} onClick={() => setAddress(a)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 4px", borderBottom: "1px solid #eee", background: "transparent", color: "#222" }}>{address === a ? "🔘 " : "◯ "}{a}</button>)}
            </section>
            <section style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12 }}><strong>商品清单</strong>{cartProducts.map(i => <p key={i.id} style={{ fontSize: 13 }}>{i.title} × {cart[i.id]} <span style={{ float: "right" }}>{money(Number(meta(i,"price","0").replace(/,/g,""))*(cart[i.id]||0))}</span></p>)}<hr/><strong>应付总额：<span style={{ color: "#c62828" }}>{money(total)}</span></strong></section>
            <button disabled={!totalCount} onClick={() => { setOrders(old => [...old, { id: Date.now(), payer, address, total, lines: cartProducts.map(i => ({ title: i.title, count: cart[i.id] || 0, price: Number(meta(i,"price","0").replace(/,/g,"")) })) }]); setOrderDone(true); }} style={{ width: "100%", padding: 14, borderRadius: 24, background: totalCount ? "#f04438" : "#ccc", color: "#fff", fontWeight: 700 }}>确认下单（模拟）</button>
            <p style={{ color: "#999", fontSize: 11, textAlign: "center" }}>仅为剧情模拟，不会进行真实扣款或发货。</p>
          </>}
        </>}
        {tab === "订单" && <section style={{ background: "#fff", borderRadius: 12, padding: 16 }}><h3>我的订单</h3>
          {orders.length ? [...orders].reverse().map((o) => <article key={o.id} style={{ borderBottom: "1px solid #eee", padding: "12px 0" }}><strong>订单 #{String(o.id).slice(-6)}</strong><p>付款人：{o.payer}</p><p>收货地址：{o.address}</p>{o.lines.map((line) => <small key={line.title} style={{ display: "block" }}>{line.title} × {line.count} · {money(line.price * line.count)}</small>)}<b style={{ display: "block", color: "#c62828", marginTop: 6 }}>{money(o.total)}</b><small style={{ color: "#888" }}>模拟订单 · 待处理</small></article>) : <p style={{ color: "#888" }}>暂时没有订单。</p>}
          <button onClick={() => setTab("商品")} style={{ padding: 10, borderRadius: 20, background: "#f7a31b", color: "#fff", marginTop: 12 }}>继续逛逛</button></section>}
        {detail && (() => { const i = products.find(x => x.id === detail); if (!i) return null; return <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "#0007", display: "grid", placeItems: "center", padding: 18 }}><section style={{ background: "#fff", borderRadius: 18, padding: 20, width: "100%", maxWidth: 340, color: "#222" }}><button onClick={() => setDetail("")} style={{ float: "right" }}>✕</button><div style={{ fontSize: 54, textAlign: "center", padding: 20 }}>{({ "包包":"👜", "项链":"📿", "手表":"⌚", "衣服":"🧥", "鞋子":"👟"} as Record<string,string>)[meta(i,"category","包包")]}</div><small>{meta(i,"brand")} · {meta(i,"category")}</small><h3>{i.title}</h3><strong style={{ color: "#c62828", fontSize: 22 }}>{money(Number(meta(i,"price","0").replace(/,/g,"")))}</strong><p>{meta(i,"description",i.body)}</p><button onClick={() => { add(i.id); setDetail(""); }} style={{ width: "100%", padding: 12, borderRadius: 22, background: "#f7a31b", color: "#fff", fontWeight: 700 }}>加入购物车</button></section></div>; })()}
      </div>
      <Tabs tabs={["商品", "购物车", "订单"]} value={tab === "结账" ? "购物车" : tab} set={(t) => { setTab(t); setOrderDone(false); }} icons={[<Home />, <ShoppingBag />, <Receipt />]} />
    </div>
  );
}

const DEFAULT_DELIVERY_MERCHANTS = [
  { id: "delivery-kimbap", title: "김밥천국 · 紫菜包饭", body: "紫菜包饭、拉面、简餐\n经典韩式平价套餐", sender: "김밥천국", time: "约20–30分钟", folder: "商家", meta: { price: "6,500", rating: "4.8", duration: "20–30分钟", address: "首尔配送地址" } },
  { id: "delivery-chicken", title: "교촌치킨 · 韩式炸鸡", body: "蜂蜜蒜香炸鸡\n可选原味、酱油、辣味", sender: "교촌치킨", time: "约35–45分钟", folder: "商家", meta: { price: "19,000", rating: "4.9", duration: "35–45分钟", address: "首尔配送地址" } },
  { id: "delivery-bibimbap", title: "비빔밥집 · 拌饭小馆", body: "石锅拌饭、牛肉拌饭\n配韩式小菜", sender: "비빔밥집", time: "约20–30分钟", folder: "商家", meta: { price: "10,000", rating: "4.7", duration: "20–30分钟", address: "首尔配送地址" } },
  { id: "delivery-tteokbokki", title: "엽기떡볶이 · 辣炒年糕", body: "韩式辣炒年糕\n可选辣度与配料", sender: "엽기떡볶이", time: "约25–35分钟", folder: "商家", meta: { price: "14,000", rating: "4.8", duration: "25–35分钟", address: "首尔配送地址" } },
  { id: "delivery-burger", title: "롯데리아 · 汉堡薯条", body: "汉堡、薯条、炸鸡块\n适合快速简餐", sender: "롯데리아", time: "约20–30分钟", folder: "商家", meta: { price: "8,500", rating: "4.6", duration: "20–30分钟", address: "首尔配送地址" } },
  { id: "delivery-cafe", title: "메가커피 · 咖啡饮品", body: "冰美式、拿铁、奶茶\n咖啡与日常饮品", sender: "메가커피", time: "约15–25分钟", folder: "商家", meta: { price: "3,500", rating: "4.8", duration: "15–25分钟", address: "首尔配送地址" } },
  { id: "delivery-bakery", title: "파리바게뜨 · 面包甜点", body: "面包、蛋糕、三明治\n早餐与下午茶", sender: "파리바게뜨", time: "约20–30分钟", folder: "商家", meta: { price: "5,800", rating: "4.7", duration: "20–30分钟", address: "首尔配送地址" } },
  { id: "delivery-convenience", title: "편의점 · 便利店", body: "饮料、零食、日用品\n日常急需用品配送", sender: "편의점", time: "约15–25分钟", folder: "商家", meta: { price: "2,000", rating: "4.6", duration: "15–25分钟", address: "首尔配送地址" } },
] as const;

export function DeliverySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "商家");
  const source = items.length ? items : DEFAULT_DELIVERY_MERCHANTS;
  const list = source.filter((i) =>
    tab === "订单" ? i.folder === "订单" : i.folder !== "订单",
  );
  const location = items[0] ?? DEFAULT_DELIVERY_MERCHANTS[0];
  return (
    <div className="catalog-skin delivery-ui">
      <Header p={p} />
      <div className="delivery-location">
        <MapPin size={18} />
        <strong>{meta(location, "address", "作品配送地址")}</strong>
      </div>
      <SearchBox value={q} set={setQ} placeholder="搜索商家或订单" />
      <div className="catalog-scroll">
        {tab === "商家"
          ? list.map((i) => (
              <button
                className="delivery-merchant"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <Media item={i} />
                <div>
                  <h3>{i.title}</h3>
                  <p>
                    <Star size={12} />
                    {meta(i, "rating", "—")}
                    <span>{meta(i, "duration") || i.time}</span>
                  </p>
                  <small>{i.body.split("\n")[0]}</small>
                  <strong>₩ {meta(i, "price", "—")}</strong>
                </div>
              </button>
            ))
          : list.map((i) => (
              <button
                className="delivery-order"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <header>
                  <Utensils size={18} />
                  <strong>{i.sender}</strong>
                  <span>{meta(i, "status", "配送记录")}</span>
                </header>
                <section>
                  <Media item={i} />
                  <div>
                    <strong>{i.title}</strong>
                    <p>{i.body}</p>
                    <small>{i.time}</small>
                  </div>
                  <b>₩ {meta(i, "price", "—")}</b>
                </section>
                <footer>
                  <MapPin size={13} />
                  {meta(i, "address")}
                </footer>
              </button>
            ))}
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["商家", "订单"]}
        value={tab}
        set={setTab}
        icons={[<Utensils />, <Receipt />]}
      />
    </div>
  );
}
