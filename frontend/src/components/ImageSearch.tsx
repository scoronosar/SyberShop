import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadImageSearch, searchByImage } from '../api/image-search';

type Props = {
  onClose: () => void;
};

export const ImageSearch = ({ onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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

      try {
        // Upload image to TaoWorld
        toast.loading('Загружаем изображение...');
        const uploadResult = await uploadImageSearch(base64Data);
        
        if (!uploadResult.data?.image_id) {
          toast.error('Не удалось загрузить изображение');
          setLoading(false);
          return;
        }

        // Search by image with user's language and currency preferences
        toast.loading('Ищем похожие товары...');
        const language = localStorage.getItem('sybershop_lang') || 'ru';
        const currency = localStorage.getItem('sybershop_currency') || 'RUB';
        const apiLanguage = language === 'en' ? 'en' : language === 'ru' ? 'ru' : undefined;
        const searchResult = await searchByImage(uploadResult.data.image_id, undefined, undefined, apiLanguage, currency);
        
        if (!searchResult.data || searchResult.data.length === 0) {
          toast.error('Товары не найдены. Попробуйте другое изображение');
          setLoading(false);
          return;
        }

        toast.success(`Найдено ${searchResult.data.length} товаров!`);
        
        // Store results in sessionStorage and navigate
        sessionStorage.setItem('imageSearchResults', JSON.stringify(searchResult.data));
        navigate('/search-results');
        onClose();
      } catch (error) {
        console.error('Image search error:', error);
        toast.error('Ошибка поиска. Подключите TaoWorld в админ-панели');
      } finally {
        setLoading(false);
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
      <div className="text-center space-y-2">
        <div className="text-4xl">📸</div>
        <h3 className="text-xl font-bold text-gray-900">Поиск по изображению</h3>
        <p className="text-sm text-gray-600">
          Загрузите фото товара, и мы найдём похожие товары на Taobao
        </p>
      </div>

      {preview ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary-300">
            <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-gray-50" />
            {loading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
              </div>
            )}
          </div>
          {!loading && (
            <button
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="btn-secondary w-full"
            >
              🔄 Выбрать другое изображение
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-3 border-dashed border-primary-300 bg-primary-50/30 p-12 text-center hover:bg-primary-50/50 hover:border-primary-400 transition-all"
        >
          <div className="space-y-4">
            <div className="text-6xl">🖼️</div>
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                Перетащите изображение сюда
              </div>
              <div className="text-sm text-gray-600">или нажмите для выбора файла</div>
            </div>
            <div className="text-xs text-gray-500">
              Поддерживаются: JPG, PNG, WEBP (макс. 3MB)
            </div>
          </div>
        </div>
      )}

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

