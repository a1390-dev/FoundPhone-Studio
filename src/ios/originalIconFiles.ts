// Only the icon assets used by the test phone are imported into the player bundle.
// Removed apps are intentionally excluded so their images are neither emitted nor requested.
import iconMessages from "../../assets/app-icons/messages.png?url";
import iconAppstore from "../../assets/app-icons/appstore.png?url";
import iconPhotos from "../../assets/app-icons/photos.png?url";
import iconContacts from "../../assets/app-icons/contacts.png?url";
import iconCalendar from "../../assets/app-icons/calendar.png?url";
import iconCamera from "../../assets/app-icons/camera.png?url";
import iconClock from "../../assets/app-icons/clock.png?url";
import iconNotes from "../../assets/app-icons/notes.png?url";
import iconMusic from "../../assets/app-icons/music.png?url";
import iconWeather from "../../assets/app-icons/weather.png?url";
import iconMaps from "../../assets/app-icons/maps.png?url";
import iconWallet from "../../assets/app-icons/wallet.png?url";
import iconHealth from "../../assets/app-icons/health.png?url";
import iconCalculator from "../../assets/app-icons/calculator.png?url";
import iconSettings from "../../assets/app-icons/settings.png?url";
import iconPhone from "../../assets/app-icons/phone.png?url";
import iconSafari from "../../assets/app-icons/safari.png?url";
import iconThreads from "../../assets/app-icons/threads.png?url";
import iconTwitter from "../../assets/app-icons/twitter.svg?url";
import iconInstagram from "../../assets/app-icons/instagram.png?url";
import iconYoutube from "../../assets/app-icons/youtube.png?url";
import iconMessenger from "../../assets/app-icons/messenger.png?url";
import iconWechat from "../../assets/app-icons/wechat.jpg?url";
import iconDelivery from "../../assets/app-icons/delivery.jpg?url";
import iconTaobao from "../../assets/app-icons/taobao.jpg?url";
import iconWhatsapp from "../../assets/app-icons/whatsapp.jpg?url";
import iconLine from "../../assets/app-icons/line.jpg?url";
import iconKakao from "../../assets/app-icons/kakao.jpg?url";

export const originalIconFiles: Record<string, string> = {
  messages: iconMessages,
  appstore: iconAppstore,
  photos: iconPhotos,
  contacts: iconContacts,
  calendar: iconCalendar,
  camera: iconCamera,
  clock: iconClock,
  notes: iconNotes,
  music: iconMusic,
  weather: iconWeather,
  maps: iconMaps,
  wallet: iconWallet,
  health: iconHealth,
  calculator: iconCalculator,
  settings: iconSettings,
  phone: iconPhone,
  safari: iconSafari,
  threads: iconThreads,
  twitter: iconTwitter,
  instagram: iconInstagram,
  youtube: iconYoutube,
  messenger: iconMessenger,
  wechat: iconWechat,
  delivery: iconDelivery,
  taobao: iconTaobao,
  whatsapp: iconWhatsapp,
  line: iconLine,
  kakao: iconKakao,
};

let originalIconPreloadPromise: Promise<void> | undefined;

/** Load and decode the entire original icon batch before revealing the home screen. */
export function preloadOriginalIconFiles(): Promise<void> {
  if (!originalIconPreloadPromise) {
    originalIconPreloadPromise = Promise.all(
      [...new Set(Object.values(originalIconFiles))].map((url) => {
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "high";
        image.src = url;
        if (typeof image.decode !== "function") return Promise.resolve();
        return image.decode().then(
          () => undefined,
          () => undefined,
        );
      }),
    ).then(() => undefined);
  }
  return originalIconPreloadPromise;
}
