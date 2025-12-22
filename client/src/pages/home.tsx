import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, buildUrl } from '@shared/routes';

export default function Home() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAskForm, setShowAskForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('رياضيات');
  const [questionContent, setQuestionContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCurrentUser(data));
  }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['/api/questions', filterSubject],
    queryFn: async () => {
      const url = filterSubject ? `/api/questions?subject=${filterSubject}` : '/api/questions';
      const res = await fetch(url);
      return res.json();
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.questions.create.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create question');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setQuestionContent('');
      setImageUrl('');
      setShowAskForm(false);
    }
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
    window.location.reload();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">الزملاء</h1>
          <p className="text-lg text-blue-700 mb-8">منصة الأسئلة والأجوبة للطلاب</p>
          <div className="space-y-4">
            <Button onClick={() => window.location.href = '/login'} size="lg" className="bg-blue-600 hover:bg-blue-700">
              تسجيل الدخول
            </Button>
            <Button onClick={() => window.location.href = '/register'} size="lg" variant="outline">
              إنشاء حساب جديد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">الزملاء</h1>
          <div className="flex gap-4 items-center">
            <span className="text-blue-800">أهلاً {currentUser?.username}</span>
            <Button onClick={handleLogout} variant="outline">تسجيل الخروج</Button>
          </div>
        </div>

        {/* Ask Question Button */}
        <Button 
          onClick={() => setShowAskForm(!showAskForm)}
          className="mb-6 bg-green-500 hover:bg-green-600 w-full"
        >
          {showAskForm ? 'إلغاء' : 'اسأل سؤال جديد'}
        </Button>

        {/* Ask Form */}
        {showAskForm && (
          <Card className="p-6 mb-8 bg-white shadow-lg">
            <div className="space-y-4">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="رياضيات">رياضيات</SelectItem>
                  <SelectItem value="علوم">علوم</SelectItem>
                  <SelectItem value="عربي">عربي</SelectItem>
                  <SelectItem value="إنجليزي">إنجليزي</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="اكتب سؤالك هنا..."
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                className="min-h-32"
              />
              <Input
                placeholder="رابط الصورة (اختياري)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button
                onClick={() => createQuestionMutation.mutate({
                  subject: selectedSubject,
                  content: questionContent,
                  imageUrl: imageUrl || null
                })}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createQuestionMutation.isPending || !questionContent}
              >
                نشر السؤال
              </Button>
            </div>
          </Card>
        )}

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterSubject || "all"} onValueChange={(val) => setFilterSubject(val === "all" ? "" : val)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="جميع المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              <SelectItem value="رياضيات">رياضيات</SelectItem>
              <SelectItem value="علوم">علوم</SelectItem>
              <SelectItem value="عربي">عربي</SelectItem>
              <SelectItem value="إنجليزي">إنجليزي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              لا توجد أسئلة حالياً. كن أول من يسأل!
            </Card>
          ) : (
            questions.map((q: any) => (
              <Card key={q.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.location.href = `/question/${q.id}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {q.subject}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{q.content.substring(0, 100)}...</h3>
                {q.imageUrl && <img src={q.imageUrl} alt="question" className="w-full max-h-48 rounded mb-2 object-cover" />}
                <p className="text-sm text-gray-500">
                  {new Date(q.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
