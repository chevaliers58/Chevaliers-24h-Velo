/**
 * Application installée (PWA en mode « standalone »).
 * Les écrans « app » ne servent que sur téléphone : sur un ordinateur (ou une
 * tablette en grand écran), même installée, l'app affiche le site normal.
 */

/** Largeur au-delà de laquelle on affiche le site (même valeur que le point « md » du site). */
export const APP_MAX_WIDTH = 767;

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Mode « app » : installée ET écran de téléphone. */
export function isAppMode(): boolean {
  if (!isStandalone()) return false;
  return window.matchMedia(`(max-width: ${APP_MAX_WIDTH}px)`).matches;
}

/** Page du site qui correspond à un écran de l'app (quand on est sur ordinateur). */
export function websitePathFor(appPath: string): string {
  if (appPath.startsWith("/app/mes-kms") || appPath.startsWith("/app/enregistrer"))
    return "/mes-km";
  if (appPath.startsWith("/app/trophees")) return "/mes-km";
  if (appPath.startsWith("/app/sorties-prevues")) return "/sorties-prevues";
  return "/";
}

/**
 * Exécuté avant l'affichage. Sur téléphone (app installée) : marque <html> comme
 * « app » et envoie « / » vers « /app ». Sur ordinateur : renvoie les écrans
 * « /app… » vers la page du site correspondante.
 */
const APP_BASE_PATH =
  import.meta.env.BASE_URL === "/"
    ? ""
    : import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL.slice(0, -1)
      : import.meta.env.BASE_URL;
/** Convert a browser pathname (including the deployment base) to a safe site URL. */
export function websiteUrlFor(pathname: string): string {
  const appPath =
    APP_BASE_PATH && pathname.startsWith(APP_BASE_PATH + "/")
      ? pathname.slice(APP_BASE_PATH.length)
      : pathname;
  return APP_BASE_PATH + websitePathFor(appPath);
}

export const APP_BOOT_SCRIPT = `(function(){try{var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;if(!s)return;var b="${APP_BASE_PATH}";var root=b+'/';var app=b+'/app';var p=location.pathname;var phone=window.matchMedia('(max-width: ${APP_MAX_WIDTH}px)').matches;if(phone){document.documentElement.classList.add('app-standalone');document.addEventListener('touchstart',function(){},{passive:true});if(p===root||p===b){location.replace(app+location.search+location.hash);}}else if(p===app||p.indexOf(app+'/')===0){var t=(p.indexOf(app+'/mes-kms')===0||p.indexOf(app+'/enregistrer')===0||p.indexOf(app+'/trophees')===0)?'/mes-km':p.indexOf(app+'/sorties-prevues')===0?'/sorties-prevues':'/';location.replace(b+t);}}catch(e){}})();`;
