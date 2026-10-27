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
import type { Item } from "../schema";
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

type DeliveryProduct = { id: string; category: string; store: string; name: string; desc: string; price: number; emoji: string };
type ProductSeed = [string, string, number, string];
const makeDeliveryProducts = (prefix: string, category: string, store: string, entries: ProductSeed[]): DeliveryProduct[] =>
  entries.map(([name, desc, price, emoji], index) => ({id: prefix + (index + 1), category, store, name, desc, price, emoji}));
const DELIVERY_PRODUCTS: DeliveryProduct[] = [
  ...makeDeliveryProducts("k", "韩餐", "首尔家常韩食", [
    ["石锅牛肉拌饭","牛肉、时蔬、温泉蛋、韩式辣酱",12500,"🍲"],["泡菜五花肉炒饭","泡菜、五花肉、煎蛋",10500,"🍚"],["部队锅双人份","香肠、午餐肉、泡面和芝士",24000,"🍲"],["嫩豆腐汤套餐","嫩豆腐汤、米饭和小菜",11000,"🥘"],["韩式辣炒年糕","年糕、鱼饼、甜辣酱",6500,"🍢"],["鱼饼汤串","热汤鱼饼串与萝卜",5000,"🥣"],["蜂蜜酱油炸鸡","招牌蜂蜜酱油酥脆炸鸡",19500,"🍗"],["韩式甜辣无骨鸡","去骨鸡块、甜辣酱",20500,"🍗"]
  ]),
  ...makeDeliveryProducts("j", "日餐·寿司", "东京寿司铺", [
    ["三文鱼握寿司 8贯","鲜切三文鱼握寿司",14500,"🍣"],["三文鱼牛油果卷","三文鱼、牛油果、寿司饭",13500,"🍣"],["综合刺身拼盘","三文鱼、金枪鱼、白身鱼",26000,"🐟"],["照烧鸡腿饭","照烧鸡腿、米饭、蔬菜",11500,"🍱"],["猪排咖喱饭","炸猪排、日式咖喱、米饭",12000,"🍛"],["豚骨拉面","浓厚豚骨汤、叉烧、溏心蛋",12500,"🍜"],["味噌拉面","味噌汤底、玉米、叉烧",12000,"🍜"],["炸虾天妇罗便当","炸虾、时蔬天妇罗、米饭",13500,"🍤"]
  ]),
  ...makeDeliveryProducts("c", "中餐", "中华料理馆", [
    ["经典炸酱面","浓香炸酱、猪肉末、洋葱",8500,"🍜"],["海鲜辣汤面","虾、鱿鱼、蔬菜与辣汤",10500,"🍜"],["糖醋肉","酥脆猪肉、酸甜酱汁",18000,"🥡"],["宫保鸡丁盖饭","鸡肉、花生、青椒",10500,"🍚"],["猪肉小笼包 8只","鲜肉馅与热汤汁",8500,"🥟"],["虾仁炒饭","虾仁、鸡蛋、葱花",9500,"🍚"],["香辣麻婆豆腐饭","嫩豆腐、香辣酱汁、米饭",10000,"🥘"],["牛肉炒面","牛肉、彩椒、炒面",10500,"🍝"]
  ]),
  ...makeDeliveryProducts("w", "西式简餐", "城市简餐厨房", [
    ["双层芝士牛肉堡","双层牛肉饼、芝士、生菜",9800,"🍔"],["香脆鸡腿堡套餐","鸡腿堡、薯条、汽水",12500,"🍔"],["奶油培根意面","奶油酱、培根、芝士",13500,"🍝"],["番茄海鲜意面","虾仁、鱿鱼、番茄酱",14500,"🍝"],["意式玛格丽特披萨","番茄、马苏里拉芝士、罗勒",17900,"🍕"],["韩式烤肉披萨","烤牛肉、洋葱、芝士",19900,"🍕"]
  ]),
  ...makeDeliveryProducts("s", "海鲜·三文鱼", "鲜鱼市场", [
    ["三文鱼牛油果沙拉","三文鱼、牛油果、混合生菜",15500,"🥗"],["香煎三文鱼饭","香煎三文鱼、米饭、时蔬",16500,"🐟"],["金枪鱼玉米沙拉","金枪鱼、玉米、生菜",11500,"🥗"],["蒜香黄油虾","蒜香黄油虾与柠檬",17500,"🍤"],["海鲜乌冬面","虾、鱼板、蔬菜与乌冬",11500,"🍜"],["鳗鱼饭","蒲烧鳗鱼、米饭、腌菜",18500,"🍱"]
  ])
];
const DELIVERY_DRINKS: DeliveryProduct[] = makeDeliveryProducts("b", "奶茶·饮品", "茶饮咖啡铺", [
  ["黑糖珍珠鲜奶","黑糖珍珠、鲜奶",5500,"🧋"],["经典珍珠奶茶","红茶、鲜奶、珍珠",4800,"🧋"],["芋泥波波奶茶","芋泥、珍珠、奶茶",5800,"🧋"],["抹茶珍珠拿铁","抹茶、牛奶、珍珠",5600,"🍵"],["杨枝甘露","芒果、西柚、椰奶",6200,"🥭"],["满杯草莓果茶","草莓果肉、茉莉绿茶",5900,"🍓"],["百香果双响炮","百香果、椰果、珍珠",5500,"🍹"],["蜜桃乌龙茶","蜜桃果香、乌龙茶",4800,"🍑"],["冰美式咖啡","双份浓缩、冰水",3500,"🧊"],["香草冰拿铁","浓缩咖啡、牛奶、香草",4800,"☕"],["焦糖玛奇朵","焦糖、牛奶、浓缩咖啡",5200,"☕"],["巧克力冰沙","巧克力、牛奶、碎冰",5500,"🥤"],["鲜榨橙汁","鲜橙现榨",4500,"🍊"],["柠檬气泡水","柠檬、气泡水",3900,"🍋"],["草莓酸奶昔","草莓、酸奶、冰沙",5500,"🍓"]
]);
const DELIVERY_GROCERIES: DeliveryProduct[] = makeDeliveryProducts("g", "便利店·超市", "便利店 / 社区超市", [
  ["香蕉牛奶","韩国经典香蕉牛奶",1800,"🥛"],["三角紫菜包饭","金枪鱼蛋黄酱口味",1600,"🍙"],["辣鸡肉杯面","韩式辣味方便面",1900,"🍜"],["蜂蜜黄油薯片","香脆蜂蜜黄油风味",2200,"🥔"],["瓶装饮用水 2瓶","500ml × 2",1800,"💧"],["鸡蛋 10枚","家庭常备鸡蛋",6500,"🥚"],["牛奶 1L","全脂牛奶",3200,"🥛"],["香蕉一把","新鲜香蕉",3900,"🍌"],["吐司面包","切片吐司",3500,"🍞"],["冷冻饺子","家常猪肉饺子一袋",7900,"🥟"]
]);
const DELIVERY_EXTRAS: DeliveryProduct[] = makeDeliveryProducts("x", "日常用品", "便利生活", [
  ["抽纸","三层抽纸",3000,"🧻"],["洗衣液","日常衣物清洁",6900,"🧴"],["洗发水","日常洗护用品",7900,"🧴"],["牙膏","薄荷清新口味",3500,"🪥"],["软毛牙刷","单支装",2500,"🪥"],["家用垃圾袋","一卷装",4000,"🗑️"],["湿巾","便携装",2200,"🧻"],["卫生纸","家庭装卷纸",6500,"🧻"]
]);
const DELIVERY_CATEGORIES = ["全部", "韩餐", "日餐·寿司", "中餐", "西式简餐", "海鲜·三文鱼", "奶茶·饮品", "便利店·超市", "日常用品"];
export function DeliverySkin(p: Props) {
  const [tab, setTab] = useState("商家");
  const [category, setCategory] = useState("全部");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState("首尔特别市麻浦区杨花路 12号 101室");
  const [savedAddresses, setSavedAddresses] = useState(["首尔特别市麻浦区杨花路 12号 101室", "首尔特别市城东区圣水一路 25号 302室"]);
  const [addressEditing, setAddressEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("KakaoPay");
  const [payer, setPayer] = useState("我自己");
  const [orders, setOrders] = useState<Array<{id:string; items:Array<{product:DeliveryProduct;qty:number}>; total:number; address:string; paymentMethod:string; payer:string; status:string; time:string}>>([]);
  const [notice, setNotice] = useState("");
  const products = [...DELIVERY_PRODUCTS, ...DELIVERY_DRINKS, ...DELIVERY_GROCERIES, ...DELIVERY_EXTRAS];
  const visibleProducts = products.filter((item) =>
    (category === "全部" || item.category === category) &&
    (item.name + item.desc + item.store + item.category).toLowerCase().includes(q.toLowerCase())
  );
  const cartItems = Object.entries(cart).filter(([,qty]) => qty > 0).map(([id,qty]) => ({product:products.find(p => p.id === id)!,qty})).filter(x => x.product);
  const subtotal = cartItems.reduce((sum,x) => sum + x.product.price*x.qty,0);
  const deliveryFee = subtotal > 0 ? (subtotal >= 30000 ? 0 : 3000) : 0;
  const total = subtotal + deliveryFee;
  const money = (n:number) => "₩" + n.toLocaleString("ko-KR");
  const setQty = (id:string,delta:number) => setCart(prev => ({...prev,[id]:Math.max(0,(prev[id] ?? 0)+delta)}));
  const checkout = () => {
    if (!cartItems.length) { setNotice("购物车还是空的，先选择菜品吧"); return; }
    if (!address.trim() || address.includes("请编辑")) { setAddressEditing(true); setNotice("请先填写配送地址"); return; }
    setOrders(prev => [{id:"FD-"+Date.now().toString().slice(-6),items:cartItems,total,address,paymentMethod,payer,status:"制作中",time:new Date().toLocaleString("zh-CN",{hour12:false})},...prev]);
    setCart({});
    setTab("订单");
    setNotice("下单成功！这是模拟订单，不会真实扣款。");
  };
  return (
    <div className="catalog-skin delivery-ui" style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,background:"#fff"}}>
      <Header p={p} />
      <div className="delivery-location" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#f5dc7d",flexWrap:"wrap"}}>
        <MapPin size={18} />
        {addressEditing ? <input aria-label="配送地址" value={address} onChange={e=>setAddress(e.target.value)} placeholder="输入详细配送地址" style={{flex:1,minWidth:150,padding:8,borderRadius:10,border:"1px solid #d5c06b"}} /> : <select aria-label="选择配送地址" value={address} onChange={e=>setAddress(e.target.value)} style={{flex:1,minWidth:160,padding:8,borderRadius:10,border:"1px solid #d5c06b",background:"#fff9df"}}>{savedAddresses.map(a=><option key={a} value={a}>{a}</option>)}</select>}
        {addressEditing ? <button onClick={()=>{if(address.trim()){setSavedAddresses(prev=>prev.includes(address)?prev:[address,...prev]);setAddressEditing(false);setNotice("配送地址已保存");}}} style={{border:0,borderRadius:10,padding:"7px 10px",background:"#fff4c8"}}>保存</button> : <button onClick={()=>{setAddress("");setAddressEditing(true);}} style={{border:0,borderRadius:10,padding:"7px 10px",background:"#fff4c8"}}>新增地址</button>}
      </div>
      <div style={{padding:"8px 12px",background:"#f5dc7d"}}>
        <SearchBox value={q} set={setQ} placeholder="搜索菜品、商家或用品" />
      </div>
      {tab === "商家" && <div style={{display:"flex",gap:8,overflowX:"auto",padding:"10px 12px",background:"#fff",borderBottom:"1px solid #eee",flexShrink:0}}>
        {DELIVERY_CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} style={{whiteSpace:"nowrap",border:0,borderRadius:18,padding:"8px 12px",background:category===c?"#f5dc7d":"#f4f4f4",fontWeight:category===c?700:400}}>{c}</button>)}
      </div>}
      {notice && <button onClick={()=>setNotice("")} style={{border:0,background:"#fff6d8",padding:8,textAlign:"left",color:"#705b12"}}>{notice}　×</button>}
      <div className="catalog-scroll" style={{flex:1,minHeight:0,overflowY:"auto",padding:"10px 12px 16px"}}>
        {tab === "商家" && <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
          {visibleProducts.map(item=><article key={item.id} style={{border:"1px solid #eee",borderRadius:14,overflow:"hidden",background:"#fff",minWidth:0}}>
            <div style={{height:84,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff7df",fontSize:42}}>{item.emoji}</div>
            <div style={{padding:10}}>
              <strong style={{display:"block",fontSize:14,lineHeight:1.35}}>{item.name}</strong>
              <small style={{display:"block",color:"#888",marginTop:4,minHeight:30}}>{item.desc}</small>
              <small style={{display:"block",color:"#777",marginTop:4}}>{item.store}</small>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:4,marginTop:8}}>
                <b style={{fontSize:14,color:"#8c6d00"}}>{money(item.price)}</b>
                <button aria-label={"添加"+item.name} onClick={()=>setQty(item.id,1)} style={{width:30,height:30,border:0,borderRadius:15,background:"#f5dc7d",fontSize:20,fontWeight:700}}>+</button>
              </div>
              {(cart[item.id] ?? 0)>0 && <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}><button onClick={()=>setQty(item.id,-1)} style={{border:"1px solid #ddd",borderRadius:8,background:"#fff",width:28,height:26}}>−</button><span>{cart[item.id]} 份</span><button onClick={()=>setQty(item.id,1)} style={{border:0,borderRadius:8,background:"#f5dc7d",width:28,height:26}}>+</button></div>}
            </div>
          </article>)}
        </div>}
        {tab === "购物车" && <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {cartItems.length ? <>
            <h3 style={{margin:"2px 0",fontSize:18,fontWeight:800,color:"#222"}}>确认订单</h3>
            <section style={{background:"#fff",borderRadius:16,padding:14,boxShadow:"0 1px 4px #00000008"}}>
              <strong style={{display:"block",marginBottom:10}}>选择付款人</strong>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {["刘知珉","内永绘里","金旼炡","宁艺卓"].map(person=><button key={person} onClick={()=>setPayer(person)} style={{border:0,borderRadius:22,padding:"9px 13px",background:payer===person?"#222":"#f2f2f2",color:payer===person?"#fff":"#333",fontWeight:payer===person?700:500}}>{person}{payer===person?" ✓":""}</button>)}
              </div>
            </section>
            <section style={{background:"#fff",borderRadius:16,padding:14,boxShadow:"0 1px 4px #00000008"}}>
              <strong style={{display:"block",marginBottom:8}}>收货地址</strong>
              {savedAddresses.map((saved,index)=><button key={saved} onClick={()=>setAddress(saved)} style={{display:"block",width:"100%",textAlign:"left",padding:"11px 2px",border:0,borderBottom:index===savedAddresses.length-1?"0":"1px solid #eee",background:"transparent",color:"#222",fontSize:14}}>
                <span style={{display:"inline-block",width:22,color:address===saved?"#222":"#888"}}>{address===saved?"⦿":"◯"}</span>{saved}
              </button>)}
              {addressEditing ? <p style={{margin:"8px 0 0",fontSize:12,color:"#888"}}>请在页面顶部的地址栏填写地址并点击“保存”。</p> : <button onClick={()=>{setAddress("");setAddressEditing(true);}} style={{marginTop:8,border:0,borderRadius:18,padding:"8px 12px",background:"#f3f3f3",color:"#333"}}>＋ 新增地址</button>}
            </section>
            <section style={{background:"#fff",borderRadius:16,padding:14,boxShadow:"0 1px 4px #00000008"}}>
              <strong style={{display:"block",marginBottom:8}}>商品清单</strong>
              {cartItems.map(({product,qty})=><div key={product.id} style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #eee"}}>
                <span style={{fontSize:25,width:34,textAlign:"center"}}>{product.emoji}</span><div style={{flex:1,minWidth:0}}><strong style={{fontSize:13,display:"block"}}>{product.name} × {qty}</strong><small style={{color:"#888"}}>{product.store}</small></div><b style={{whiteSpace:"nowrap"}}>{money(product.price*qty)}</b>
                <button aria-label={"减少"+product.name} onClick={()=>setQty(product.id,-1)} style={{width:24,height:24,border:"1px solid #ddd",borderRadius:7,background:"#fff"}}>−</button><button aria-label={"增加"+product.name} onClick={()=>setQty(product.id,1)} style={{width:24,height:24,border:0,borderRadius:7,background:"#f5dc7d"}}>＋</button>
              </div>)}
              <div style={{marginTop:10,fontSize:14}}><p style={{margin:"7px 0"}}>商品金额 <b style={{float:"right"}}>{money(subtotal)}</b></p><p style={{margin:"7px 0"}}>配送费 <b style={{float:"right"}}>{deliveryFee?money(deliveryFee):"免配送费"}</b></p><div style={{borderTop:"1px solid #333",paddingTop:10,marginTop:10,fontWeight:800}}>应付总额 <b style={{float:"right",color:"#d74738"}}>{money(total)}</b></div></div>
            </section>
            <section style={{background:"#fff",borderRadius:16,padding:14,boxShadow:"0 1px 4px #00000008"}}>
              <strong style={{display:"block",marginBottom:10}}>选择付款方式</strong>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>{["KakaoPay","Naver Pay","信用卡","货到付款"].map(method=><button key={method} onClick={()=>setPaymentMethod(method)} style={{padding:10,borderRadius:12,border:paymentMethod===method?"2px solid #222":"1px solid #ddd",background:paymentMethod===method?"#f5f5f5":"#fff",fontWeight:paymentMethod===method?700:400}}>{paymentMethod===method?"✓ ":""}{method}</button>)}</div>
            </section>
            <button onClick={checkout} style={{width:"100%",padding:16,border:0,borderRadius:28,background:"#e34f40",color:"#fff",fontSize:16,fontWeight:800}}>确认下单（模拟） · {money(total)}</button>
            <p style={{margin:"-6px 0 8px",textAlign:"center",color:"#999",fontSize:11}}>仅为剧情模拟，不会真实扣款或发货</p>
          </> : <div style={{background:"#fff",borderRadius:16,padding:28,textAlign:"center",color:"#999"}}><span style={{fontSize:42}}>🛒</span><p>购物车还是空的，去挑点吃的吧。</p><button onClick={()=>setTab("商家")} style={{border:0,borderRadius:22,padding:"10px 18px",background:"#f5dc7d",fontWeight:700}}>去逛逛</button></div>}
        </div>}
        {tab === "订单" && <div>
          {orders.length ? orders.map(order=><article key={order.id} style={{padding:14,border:"1px solid #eee",borderRadius:14,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>订单 {order.id}</strong><b style={{color:"#8c6d00"}}>{order.status}</b></div>
            <small style={{display:"block",color:"#888",marginTop:4}}>{order.time}</small>
            {order.items.map(({product,qty})=><p key={product.id} style={{margin:"8px 0"}}>{product.emoji} {product.name} × {qty} <span style={{float:"right"}}>{money(product.price*qty)}</span></p>)}
            <p style={{borderTop:"1px solid #eee",paddingTop:8}}>配送地址：{order.address}</p><p>付款人：{order.payer}</p><p>付款方式：{order.paymentMethod}</p><b style={{display:"block",textAlign:"right"}}>实付 {money(order.total)}</b>
          </article>) : <p style={{textAlign:"center",padding:40,color:"#999"}}>还没有订单</p>}
        </div>}
      </div>
      <nav style={{display:"flex",borderTop:"1px solid #eee",padding:"8px 0",background:"#fff",flexShrink:0}}>
        {[{id:"商家",icon:"🍱"},{id:"购物车",icon:"🛒"},{id:"订单",icon:"🧾"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:0,background:"transparent",color:tab===t.id?"#a88a21":"#888",fontWeight:tab===t.id?700:400,padding:4}}><span style={{display:"block",fontSize:22}}>{t.icon}{t.id==="购物车" && cartItems.length>0 ? " •" : ""}</span>{t.id}</button>)}
      </nav>
    </div>
  );
}
