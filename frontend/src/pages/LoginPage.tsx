import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !agreedToTerms) {
      toast.error(t('login.terms_required', 'Необходимо согласиться с условиями использования'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      toast.success(t('login.success'));
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8 space-y-6 animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {mode === 'login' ? t('login.title_login') : t('login.title_register')}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === 'login' ? t('login.subtitle_login') : t('login.subtitle_register')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📧 {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder={t('login.email_placeholder')}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔑 {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={t('login.password_placeholder')}
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl cursor-pointer hover:border-primary-400 transition-all">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  required
                />
                <div className="flex-1 text-sm text-gray-700">
                  <div className="font-bold mb-1">{t('login.terms_title', 'Я согласен с условиями использования')}</div>
                  <div className="text-xs leading-relaxed">
                    {t('login.terms_text', 'Я понимаю, что SyberShop является платформой, которая действует как агент по закупкам/продавец для трансграничных заказов. Платформа помогает мне приобретать товары с Taobao и других китайских маркетплейсов, обрабатывает платежи, организует доставку и предоставляет услуги консолидации грузов. Я согласен с политикой возврата, условиями доставки и обработкой персональных данных.')}
                  </div>
                </div>
              </label>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('login.loading')}</span>
              </span>
            ) : (
              <span>{mode === 'login' ? `✓ ${t('login.submit_login')}` : `✓ ${t('login.submit_register')}`}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <button
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? `📝 ${t('login.switch_to_register')}` : `🔑 ${t('login.switch_to_login')}`}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-xl">
          <div className="font-semibold mb-1">ℹ️ {t('login.info_title')}</div>
          <div>{t('login.info_text')}</div>
        </div>
      </div>
    </div>
  );
};


                <span>{t('login.loading')}</span>
              </span>
            ) : (
              <span>{mode === 'login' ? `✓ ${t('login.submit_login')}` : `✓ ${t('login.submit_register')}`}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <button
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? `📝 ${t('login.switch_to_register')}` : `🔑 ${t('login.switch_to_login')}`}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-xl">
          <div className="font-semibold mb-1">ℹ️ {t('login.info_title')}</div>
          <div>{t('login.info_text')}</div>
        </div>
      </div>
    </div>
  );
};

