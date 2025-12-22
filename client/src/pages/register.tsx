import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.message || 'حدث خطأ أثناء التسجيل');
      }
    } catch {
      setError('حدث خطأ ما');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">الزملاء</h1>
        <div className="space-y-4">
          <Input
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button 
            onClick={handleRegister} 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading || !username || password.length < 6}
          >
            {loading ? 'جاري التحميل...' : 'إنشاء حساب'}
          </Button>
          <p className="text-center text-gray-600">
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="text-blue-600 hover:underline">تسجيل الدخول</a>
          </p>
        </div>
      </Card>
    </div>
  );
}
