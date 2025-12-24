import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadImageSearch, searchByImage } from '../api/image-search';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type Props = {
  onClose: () => void;
};

type LoadingStage = 'idle' | 'uploading' | 'searching';

export const ImageSearch = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, загрузите изображение');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Размер изображения должен быть меньше 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      setPreview(base64);
      setLoading(true);
      setUploadProgress(0);

      try {
        // Upload image to TaoWorld
        setLoadingStage('uploading');
        setUploadProgress(30);
        const uploadResult = await uploadImageSearch(base64Data);
        
        if (!uploadResult.data?.image_id) {
          toast.error(t('image_search.upload_failed') || 'Не удалось загрузить изображение');
          setLoading(false);
          setLoadingStage('idle');
          return;
        }

        setUploadProgress(60);
        
        // Search by image with user's language and currency preferences
        setLoadingStage('searching');
        setUploadProgress(80);
        const language = localStorage.getItem('sybershop_lang') || 'ru';
        const currency = localStorage.getItem('sybershop_currency') || 'RUB';
        const apiLanguage = language === 'en' ? 'en' : language === 'ru' ? 'ru' : undefined;
        const searchResult = await searchByImage(uploadResult.data.image_id, undefined, undefined, apiLanguage, currency);
        
        setUploadProgress(100);
        
        if (!searchResult.data || searchResult.data.length === 0) {
          toast.error(t('image_search.no_results') || 'Товары не найдены. Попробуйте другое изображение');
          setLoading(false);
          setLoadingStage('idle');
          return;
        }

        toast.success(t('image_search.found', { count: searchResult.data.length }) || `Найдено ${searchResult.data.length} товаров!`);
        
        // Store results in sessionStorage and navigate
        sessionStorage.setItem('imageSearchResults', JSON.stringify(searchResult.data));
        setTimeout(() => {
          navigate('/search-results');
          onClose();
        }, 500);
      } catch (error) {
        console.error('Image search error:', error);
        toast.error(t('image_search.error') || 'Ошибка поиска. Подключите TaoWorld в админ-панели');
        setLoading(false);
        setLoadingStage('idle');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl"
        >
          📸
        </motion.div>
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-amber-500 bg-clip-text text-transparent">
          {t('image_search.title') || 'Поиск по изображению'}
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          {t('image_search.description') || 'Загрузите фото товара, и мы найдём похожие товары на Taobao'}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary-300 shadow-xl bg-gradient-to-br from-gray-50 to-white">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-64 object-contain bg-gray-50" 
              />
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                  <div className="text-white font-bold text-lg">
                    {loadingStage === 'uploading' && (t('image_search.uploading') || 'Загружаем изображение...')}
                    {loadingStage === 'searching' && (t('image_search.searching') || 'Ищем похожие товары...')}
                  </div>
                  {uploadProgress > 0 && (
                    <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-400 to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {!loading && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setPreview(null);
                  setUploadProgress(0);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>{t('image_search.change_image') || 'Выбрать другое изображение'}</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-3xl border-3 border-dashed border-primary-300 bg-gradient-to-br from-primary-50/50 via-amber-50/30 to-primary-50/50 p-12 text-center hover:from-primary-100/60 hover:via-amber-100/40 hover:to-primary-100/60 hover:border-primary-400 transition-all duration-300 shadow-lg hover:shadow-2xl group"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="space-y-5"
            >
              <div className="text-7xl group-hover:scale-110 transition-transform duration-300">
                🖼️
              </div>
              <div>
                <div className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {t('image_search.drag_here') || 'Перетащите изображение сюда'}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {t('image_search.or_click') || 'или нажмите для выбора файла'}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/60 rounded-full px-4 py-2 inline-block">
                <span>📎</span>
                <span>{t('image_search.supported_formats') || 'Поддерживаются: JPG, PNG, WEBP (макс. 3MB)'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

