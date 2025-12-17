import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      hero: {
        title_user: 'Поиск по Taobao с авторасчётом цен',
        desc_user: 'Итоговая цена показана сразу. Доставка добавится при прибытии карго.',
        title_admin: 'Админ: видно исходную цену и разбор конвертации',
        desc_admin: 'Полный прайс-брейкдаун и исходная цена в CNY доступны.',
      },
      badges: {
        mock: 'Mock данные (DEV)',
        server: 'Конвертация на сервере',
        delivery: 'Доставка при прибытии',
      },
      loading: {
        products: 'Загружаем товары...',
      },
    },
  },
  en: {
    translation: {
      hero: {
        title_user: 'Taobao search with auto pricing',
        desc_user: 'Final price shown upfront. Delivery added at cargo arrival.',
        title_admin: 'Admin: see raw CNY price & breakdown',
        desc_admin: 'Full price breakdown and original CNY price are visible.',
      },
      badges: {
        mock: 'Mock data (DEV)',
        server: 'Server-side pricing',
        delivery: 'Delivery on arrival',
      },
      loading: {
        products: 'Loading products...',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;


