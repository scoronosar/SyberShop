import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      common: {
        home: 'Главная',
        cart: 'Корзина',
        admin: 'Админ',
        settings: 'Настройки',
        account: 'Аккаунт',
        login: 'Войти',
        logout: 'Выйти',
        search: 'Найти',
        loading: 'Загрузка...',
        refresh: 'Обновить',
        show_more: 'Показать ещё',
        loading_more: 'Загружаем ещё...',
      },
      home: {
        title: 'Миллионы товаров из Китая',
        subtitle: 'Прямые закупки с Taobao. Выгодные цены с конвертацией валюты.',
        categories: 'Популярные категории',
        filters: 'Фильтры и сортировка',
        sort: 'Сортировка',
        price_range: 'Диапазон цен',
        availability: 'Наличие товара',
        found: 'Найдено товаров',
        no_products: 'Товары не найдены',
        try_different: 'Попробуйте изменить фильтры или запрос для поиска.',
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
        loading: 'Загрузка товара...',
      },
      cart: {
        title: 'Корзина',
        empty: 'Корзина пуста',
        empty_hint: 'Добавьте товары для оформления заказа',
        subtotal: 'Товары',
        delivery: 'Доставка',
        checkout: 'Оформить заказ',
        continue_shopping: 'Продолжить покупки',
      },
    },
  },
  en: {
    translation: {
      common: {
        home: 'Home',
        cart: 'Cart',
        admin: 'Admin',
        settings: 'Settings',
        account: 'Account',
        login: 'Login',
        logout: 'Logout',
        search: 'Search',
        loading: 'Loading...',
        refresh: 'Refresh',
        show_more: 'Show more',
        loading_more: 'Loading more...',
      },
      home: {
        title: 'Millions of products from China',
        subtitle: 'Direct purchases from Taobao. Great prices with currency conversion.',
        categories: 'Popular categories',
        filters: 'Filters and sorting',
        sort: 'Sort',
        price_range: 'Price range',
        availability: 'Availability',
        found: 'Products found',
        no_products: 'No products found',
        try_different: 'Try changing filters or search query.',
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
        loading: 'Loading product...',
      },
      cart: {
        title: 'Cart',
        empty: 'Cart is empty',
        empty_hint: 'Add products to place an order',
        subtotal: 'Items',
        delivery: 'Delivery',
        checkout: 'Checkout',
        continue_shopping: 'Continue shopping',
      },
      image_search: {
        title: 'Image Search',
        description: 'Upload a product photo and we will find similar items on Taobao',
        drag_here: 'Drag image here',
        or_click: 'or click to select file',
        supported_formats: 'Supported: JPG, PNG, WEBP (max 3MB)',
        uploading: 'Uploading image...',
        searching: 'Searching for similar products...',
        upload_failed: 'Failed to upload image',
        no_results: 'No products found. Try another image',
        found: 'Found {{count}} products!',
        error: 'Search error. Connect TaoWorld in admin panel',
        change_image: 'Choose another image',
      },
    },
  },
  tg: {
    translation: {
      common: { home: 'Асосӣ', cart: 'Сабад', admin: 'Админ', settings: 'Танзимот', account: 'Ҳисоб', login: 'Даромад', logout: 'Баромад', search: 'Ҷустуҷӯ', loading: 'Боргирӣ...', refresh: 'Навсозӣ', show_more: 'Бештар', loading_more: 'Боргирии бештар...' },
      home: { title: 'Миллионҳо мол аз Чин', subtitle: 'Хариди мустақим аз Taobao. Нархҳои хуб бо табдили асъор.', categories: 'Категорияҳои маъмул', filters: 'Филтрҳо ва мураттабкунӣ', sort: 'Мураттабкунӣ', price_range: 'Диапазони нарх', availability: 'Дастрасӣ', found: 'Маҳсулот ёфт шуд', no_products: 'Ҳеҷ маҳсулот ёфт нашуд', try_different: 'Филтрҳоро иваз кунед.' },
      product: { select_variant: 'Интихоб кунед', out_of_stock: 'Нест', quantity: 'Миқдор', select_all: 'Ҳамаро интихоб кунед', select_all_hint: 'Пеш аз илова ҳамаро интихоб кунед', variant_unavailable: 'Дастнорас', variant_unavailable_hint: 'Ин вариант нест.', add_to_cart: 'Ба сабад', adding: 'Илова...', loading: 'Боргирӣ...' },
      cart: { title: 'Сабад', empty: 'Сабад холӣ', empty_hint: 'Маҳсулот илова кунед', subtotal: 'Маҳсулот', delivery: 'Расонидан', checkout: 'Тасдиқ', continue_shopping: 'Идома' },
    },
  },
  kk: {
    translation: {
      common: { home: 'Басты', cart: 'Себет', admin: 'Әкімші', settings: 'Баптаулар', account: 'Аккаунт', login: 'Кіру', logout: 'Шығу', search: 'Іздеу', loading: 'Жүктелуде...', refresh: 'Жаңарту', show_more: 'Көбірек', loading_more: 'Жүктелуде...' },
      home: { title: 'Қытайдан миллиондаған тауар', subtitle: 'Taobao-дан тікелей сатып алу. Валюта айырбасымен тиімді бағалар.', categories: 'Танымал санаттар', filters: 'Сүзгілер және сұрыптау', sort: 'Сұрыптау', price_range: 'Баға диапазоны', availability: 'Қолжетімділік', found: 'Тауарлар табылды', no_products: 'Тауарлар табылмады', try_different: 'Сүзгілерді өзгертіңіз.' },
      product: { select_variant: 'Нұсқаны таңдаңыз', out_of_stock: 'Қоймада жоқ', quantity: 'Саны', select_all: 'Барлығын таңдаңыз', select_all_hint: 'Себетке қоспас бұрын барлығын таңдаңыз', variant_unavailable: 'Қолжетімсіз', variant_unavailable_hint: 'Бұл нұсқа жоқ.', add_to_cart: 'Себетке қосу', adding: 'Қосылуда...', loading: 'Жүктелуде...' },
      cart: { title: 'Себет', empty: 'Себет бос', empty_hint: 'Тауарларды қосыңыз', subtotal: 'Тауарлар', delivery: 'Жеткізу', checkout: 'Рәсімдеу', continue_shopping: 'Жалғастыру' },
    },
  },
  uz: {
    translation: {
      common: { home: 'Asosiy', cart: 'Savat', admin: 'Admin', settings: 'Sozlamalar', account: 'Hisob', login: 'Kirish', logout: 'Chiqish', search: 'Qidirish', loading: 'Yuklanmoqda...', refresh: 'Yangilash', show_more: 'Ko\'proq', loading_more: 'Yuklanmoqda...' },
      home: { title: 'Xitoydan millionlab mahsulot', subtitle: 'Taobaodan to\'g\'ridan-to\'g\'ri xarid. Valyuta konvertatsiyasi bilan yaxshi narxlar.', categories: 'Ommabop kategoriyalar', filters: 'Filtrlar va saralash', sort: 'Saralash', price_range: 'Narx oralig\'i', availability: 'Mavjudlik', found: 'Mahsulotlar topildi', no_products: 'Mahsulotlar topilmadi', try_different: 'Filtrlarni o\'zgartiring.' },
      product: { select_variant: 'Variantni tanlang', out_of_stock: 'Sotuvda yo\'q', quantity: 'Miqdor', select_all: 'Hammasini tanlang', select_all_hint: 'Savatga qo\'shishdan oldin hammasini tanlang', variant_unavailable: 'Mavjud emas', variant_unavailable_hint: 'Bu variant yo\'q.', add_to_cart: 'Savatga qo\'shish', adding: 'Qo\'shilmoqda...', loading: 'Yuklanmoqda...' },
      cart: { title: 'Savat', empty: 'Savat bo\'sh', empty_hint: 'Mahsulotlar qo\'shing', subtotal: 'Mahsulotlar', delivery: 'Yetkazib berish', checkout: 'Rasmiylashtirish', continue_shopping: 'Davom etish' },
    },
  },
  fa: {
    translation: {
      common: { home: 'خانه', cart: 'سبد', admin: 'مدیر', settings: 'تنظیمات', account: 'حساب', login: 'ورود', logout: 'خروج', search: 'جستجو', loading: 'بارگذاری...', refresh: 'بروزرسانی', show_more: 'نمایش بیشتر', loading_more: 'بارگذاری...' },
      home: { title: 'میلیون‌ها کالا از چین', subtitle: 'خرید مستقیم از Taobao. قیمت‌های خوب با تبدیل ارز.', categories: 'دسته‌های محبوب', filters: 'فیلترها و مرتب‌سازی', sort: 'مرتب‌سازی', price_range: 'محدوده قیمت', availability: 'موجودی', found: 'کالا یافت شد', no_products: 'کالایی یافت نشد', try_different: 'فیلترها را تغییر دهید.' },
      product: { select_variant: 'گزینه را انتخاب کنید', out_of_stock: 'ناموجود', quantity: 'تعداد', select_all: 'همه را انتخاب کنید', select_all_hint: 'قبل از افزودن همه را انتخاب کنید', variant_unavailable: 'ناموجود', variant_unavailable_hint: 'این گزینه موجود نیست.', add_to_cart: 'افزودن به سبد', adding: 'افزودن...', loading: 'بارگذاری...' },
      cart: { title: 'سبد', empty: 'سبد خالی است', empty_hint: 'محصولات اضافه کنید', subtotal: 'کالاها', delivery: 'تحویل', checkout: 'تسویه', continue_shopping: 'ادامه' },
    },
  },
  ky: {
    translation: {
      common: { home: 'Башкы', cart: 'Себет', admin: 'Админ', settings: 'Жөндөөлөр', account: 'Аккаунт', login: 'Кирүү', logout: 'Чыгуу', search: 'Издөө', loading: 'Жүктөлүүдө...', refresh: 'Жаңыртуу', show_more: 'Дагы', loading_more: 'Жүктөлүүдө...' },
      home: { title: 'Кытайдан миллиондогон товар', subtitle: 'Taobao-дан түздөн-түз сатып алуу. Валюта айырбашы менен арзан баалар.', categories: 'Популярдуу категориялар', filters: 'Чыпкалар жана тизмелөө', sort: 'Тизмелөө', price_range: 'Баа диапазону', availability: 'Жеткиликтүүлүк', found: 'Товарлар табылды', no_products: 'Товарлар табылган жок', try_different: 'Чыпкаларды өзгөртүңүз.' },
      product: { select_variant: 'Вариантты тандаңыз', out_of_stock: 'Жок', quantity: 'Саны', select_all: 'Баарын тандаңыз', select_all_hint: 'Себетке кошуудан мурун баарын тандаңыз', variant_unavailable: 'Жеткиликсиз', variant_unavailable_hint: 'Бул вариант жок.', add_to_cart: 'Себетке кошуу', adding: 'Кошулууда...', loading: 'Жүктөлүүдө...' },
      cart: { title: 'Себет', empty: 'Себет бош', empty_hint: 'Товарларды кошуңуз', subtotal: 'Товарлар', delivery: 'Жеткирүү', checkout: 'Тастыктоо', continue_shopping: 'Улантуу' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    (typeof window !== 'undefined' && (localStorage.getItem('sybershop_lang') as any)) || 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;


