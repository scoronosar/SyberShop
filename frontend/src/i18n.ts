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
      product: {
        select_variant: 'Выберите вариант',
        out_of_stock: 'Нет в наличии',
        quantity: 'Количество',
        select_all: 'Выберите все варианты',
        select_all_hint: 'Необходимо выбрать все параметры товара перед добавлением в корзину',
        variant_unavailable: 'Вариант недоступен',
        variant_unavailable_hint: 'Выбранный вариант нет в наличии. Попробуйте выбрать другой.',
        add_to_cart: 'Добавить в корзину',
        adding: 'Добавляем в корзину...',
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
      product: {
        select_variant: 'Select a variant',
        out_of_stock: 'Out of stock',
        quantity: 'Quantity',
        select_all: 'Select all options',
        select_all_hint: 'Please select all required options before adding to cart',
        variant_unavailable: 'Variant unavailable',
        variant_unavailable_hint: 'Selected variant is out of stock. Please choose another one.',
        add_to_cart: 'Add to cart',
        adding: 'Adding to cart...',
      },
    },
  },
  tg: { translation: { product: { select_variant: 'Интихоб кунед', out_of_stock: 'Нест', quantity: 'Миқдор', select_all: 'Ҳамаашро интихоб кунед', select_all_hint: 'Пеш аз илова кардан ҳамаи интихобҳоро интихоб кунед', variant_unavailable: 'Дастнорас', variant_unavailable_hint: 'Ин вариант нест. Дигарашро интихоб кунед.', add_to_cart: 'Ба сабад', adding: 'Илова шуда истодааст...' } } },
  kk: { translation: { product: { select_variant: 'Нұсқаны таңдаңыз', out_of_stock: 'Қоймада жоқ', quantity: 'Саны', select_all: 'Барлық опцияны таңдаңыз', select_all_hint: 'Себетке қоспас бұрын барлық опцияларды таңдаңыз', variant_unavailable: 'Қолжетімсіз', variant_unavailable_hint: 'Таңдалған нұсқа жоқ. Басқасын таңдаңыз.', add_to_cart: 'Себетке қосу', adding: 'Қосылуда...' } } },
  uz: { translation: { product: { select_variant: 'Variantni tanlang', out_of_stock: 'Sotuvda yo‘q', quantity: 'Miqdor', select_all: 'Barcha variantlarni tanlang', select_all_hint: 'Savatga qo‘shishdan oldin barcha variantlarni tanlang', variant_unavailable: 'Mavjud emas', variant_unavailable_hint: 'Tanlangan variant mavjud emas. Boshqasini tanlang.', add_to_cart: 'Savatga qo‘shish', adding: 'Qo‘shilmoqda...' } } },
  fa: { translation: { product: { select_variant: 'گزینه را انتخاب کنید', out_of_stock: 'ناموجود', quantity: 'تعداد', select_all: 'همه گزینه‌ها را انتخاب کنید', select_all_hint: 'قبل از افزودن به سبد، همه گزینه‌ها را انتخاب کنید', variant_unavailable: 'ناموجود', variant_unavailable_hint: 'این گزینه موجود نیست. گزینه دیگری را انتخاب کنید.', add_to_cart: 'افزودن به سبد', adding: 'در حال افزودن...' } } },
  ky: { translation: { product: { select_variant: 'Тандоо жасаңыз', out_of_stock: 'Жок', quantity: 'Саны', select_all: 'Бардыгын тандаңыз', select_all_hint: 'Себетке кошуудан мурда бардык параметрлерди тандаңыз', variant_unavailable: 'Жеткиликсиз', variant_unavailable_hint: 'Тандалган вариант жок. Башканы тандаңыз.', add_to_cart: 'Себетке кошуу', adding: 'Кошулууда...' } } },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    (typeof window !== 'undefined' && (localStorage.getItem('sybershop_lang') as any)) || 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;


