import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      toast.success('Успешно');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка авторизации');
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
            {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="example@mail.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔑 Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="минимум 6 символов"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Подождите...</span>
              </span>
            ) : (
              <span>{mode === 'login' ? '✓ Войти' : '✓ Зарегистрироваться'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <button
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? '📝 Нужен аккаунт? Зарегистрируйтесь' : '🔑 Уже есть аккаунт? Войдите'}
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-xl">
          <div className="font-semibold mb-1">ℹ️ Информация:</div>
          <div>Пользователи видят только финальную цену. Администраторы видят исходную цену и детальный разбор.</div>
        </div>
      </div>
    </div>
  );
};

