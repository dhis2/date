// https://lingohub.com/academy/best-practices/rtl-language-list
const rtlLocales = new Set([
  "ar", // Arabic
  "arc", // Aramaic
  "dv", // Divehi
  "fa", // Persian
  "ha", // Hausa
  "he", // Hebrew
  "khw", // Khowar
  "ks", // Kashmiri
  "ku", // Kurdish
  "ps", // Pashto
  "ur", // Urdu
  "yi", // Yiddish
]);

type Direction = "ltr" | "rtl";

/**
 * A hook to return the direction (left-to-right or right-to-left) based on the language
 *
 * if a "dir" is passed to the hook, then that will be used as a direction
 * otherwise it will check if the language (localeIdentifier) is a right-to-left language and return rtl
 * otherwise it defaults to "ltr"
 * @param dir
 * @param localeIdentifier
 * @returns
 */
export const useResolvedDir = (
  dir: Direction,
  localeIdentifier: string | undefined
) => {
  if (dir) {
    return dir;
  }

  if (!localeIdentifier) {
    return "ltr";
  }

  const isRtlLocale =
    localeIdentifier && localeIdentifier.includes("-")
      ? rtlLocales.has(localeIdentifier.split("-")[0])
      : rtlLocales.has(localeIdentifier);

  return isRtlLocale ? "rtl" : "ltr";
};
