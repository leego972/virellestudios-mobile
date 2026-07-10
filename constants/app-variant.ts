import Constants from "expo-constants";

export type AppVariant = "virelle" | "swappys";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const slug = String(Constants.expoConfig?.slug ?? "").toLowerCase();
const configuredVariant = String(extra.appVariant ?? "").toLowerCase();

export const APP_VARIANT: AppVariant =
  configuredVariant === "swappys" || extra.isSwappys === true || slug === "swappys"
    ? "swappys"
    : "virelle";

export const IS_SWAPPYS = APP_VARIANT === "swappys";
export const IS_VIRELLE = APP_VARIANT === "virelle";
