import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import ur from "../locales/ur.json";
import ps from "../locales/ps.json";

const resources = {
  en: { translation: en },
  ur: { translation: ur },
  ps: { translation: ps },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
