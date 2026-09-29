import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app_name: "Satbara Utara 🔗",
      hero_title: "Transparent Land Records",
      hero_subtitle: "Secured by Blockchain",
      connect_wallet: "Connect Wallet",
      search_712: "Public 7/12 Search",
      dashboard: "Dashboard",
      my_lands: "My Lands",
      verify_badge: "Verified on Blockchain",
      print_download: "Print / PDF"
    }
  },
  mr: {
    translation: {
      app_name: "सातबारा उतारा 🔗",
      hero_title: "पारदर्शक भूमी अभिलेख",
      hero_subtitle: "ब्लॉकचेनद्वारे सुरक्षित",
      connect_wallet: "वॉलेट कनेक्ट करा",
      search_712: "सार्वजनिक ७/१२ शोधा",
      dashboard: "डॅशबोर्ड",
      my_lands: "माझी जमीन",
      verify_badge: "ब्लॉकचेनवर प्रमाणित",
      print_download: "प्रिंट / पीडीएफ"
    }
  },
  gu: {
    translation: {
      app_name: "સાતબારા ઉતારા 🔗",
      hero_title: "પારદર્શક જમીન રેકોર્ડ",
      hero_subtitle: "બ્લોકચેન દ્વારા સુરક્ષિત",
      connect_wallet: "વોલેટ કનેક્ટ કરો",
      search_712: "જાહેર ૭/૧૨ શોધો",
      dashboard: "ડેશબોર્ડ",
      my_lands: "મારી જમીન",
      verify_badge: "બ્લોકચેન પર પ્રમાણિત",
      print_download: "પ્રિન્ટ / પીડીએફ"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
