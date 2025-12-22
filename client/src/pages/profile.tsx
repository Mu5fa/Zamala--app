import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  grade: string;
  role: string;
  createdAt: string;
  questionsAsked: number;
  answersGiven: number;
  totalHelpfulness: number;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data) {
          window.location.href = '/login';
        } else {
          setUserData(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  if (!userData) {
    return <div className="flex items-center justify-center min-h-screen">لم يتم العثور على البيانات</div>;
  }

  const gradeDisplay = userData.grade === '4th' ? 'الرابع' : userData.grade === '5th' ? 'الخامس' : 'السادس';
  const registrationDate = new Date(userData.createdAt).toLocaleDateString('ar-SA');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Button onClick={() => window.location.href = '/'} variant="outline" className="mb-8" data-testid="button-back">
          العودة للرئيسية
        </Button>

        <Card className="p-8 bg-white shadow-lg">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-blue-900 text-center mb-8">{userData.username}</h1>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 mb-2">رقم الحساب</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="text-user-id">{userData.id}</p>
            </div>

            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 mb-2">الصف</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="text-user-grade">الصف {gradeDisplay} الإعدادي</p>
            </div>

            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 mb-2">تاريخ التسجيل</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="text-user-date">{registrationDate}</p>
            </div>

            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 mb-2">الدور</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="text-user-role">
                {userData.role === 'admin' ? 'مسؤول النظام' : 'طالب'}
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 mb-2">الإحصائيات</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">أسئلة مطروحة</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-questions-count">{userData.questionsAsked}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                  <p className="text-xs text-gray-600">إجابات مقدمة</p>
                  <p className="text-2xl font-bold text-indigo-600" data-testid="text-answers-count">{userData.answersGiven}</p>
                </div>
              </div>
            </div>

            {userData.totalHelpfulness > 0 && (
              <div className="border-b pb-4">
                <p className="text-sm text-gray-500 mb-2">مستوى المساعدة</p>
                <p className="text-lg font-semibold text-gray-900" data-testid="text-helpfulness">{userData.totalHelpfulness}</p>
              </div>
            )}
          </div>

          <Button 
            onClick={() => window.location.href = '/'} 
            variant="default" 
            className="w-full mt-8" 
            data-testid="button-home"
          >
            الرئيسية
          </Button>
        </Card>
      </div>
    </div>
  );
}
