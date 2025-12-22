import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">الزملاء</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            data-testid="input-username"
          />
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            data-testid="input-password"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button 
            type="submit"
            variant="default"
            className="w-full"
            disabled={loading || !username || !password}
            data-testid="button-login"
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </Button>
          <p className="text-center text-gray-600">
            ليس لديك حساب؟{' '}
            <a href="/register" className="text-primary hover:underline" data-testid="link-register">إنشاء حساب</a>
          </p>
        </form>
      </Card>
    </div>
  );
}
