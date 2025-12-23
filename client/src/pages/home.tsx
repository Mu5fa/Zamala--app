import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processImage } from '../utils/imageProcessor';

const SUBJECTS = ['احياء', 'رياضيات', 'لغة عربية', 'لغة انجليزية', 'حاسوب', 'كيمياء', 'فيزياء'] as const;

interface User {
  id: number;
  username: string;
  grade: string;
  role: string;
  questionsAsked: number;
  answersGiven: number;
  totalHelpfulness: number;
}

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAskForm, setShowAskForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('رياضيات');
  const [questionContent, setQuestionContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCurrentUser(data));
  }, []);

  const [page, setPage] = useState(1);
  const { data: questionsResponse = { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false } }, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions', selectedSubject, page],
    queryFn: async () => {
      const res = await fetch(`/api/questions?subject=${encodeURIComponent(selectedSubject)}&page=${page}&limit=10`);
      return res.json();
    }
  });
  
  const questions = questionsResponse.data || [];

  const { data: topAnswerers = [] } = useQuery({
    queryKey: ['/api/stats/top-answerers'],
    queryFn: async () => {
      const res = await fetch('/api/stats/top-answerers');
      return res.json();
    }
  });

  const { data: topAskers = [] } = useQuery({
    queryKey: ['/api/stats/top-askers'],
    queryFn: async () => {
      const res = await fetch('/api/stats/top-askers');
      return res.json();
    }
  });

  const { data: usersCount = 0 } = useQuery({
    queryKey: ['/api/stats/users-count'],
    queryFn: async () => {
      const res = await fetch('/api/stats/users-count');
      const data = await res.json();
      return data.count;
    }
  });

  interface QuestionData {
    subject: string;
    content: string;
    imageUrl: string | null;
  }

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionData) => {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'فشل إنشاء السؤال');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', selectedSubject] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/top-askers'] });
      setQuestionContent('');
      setImageFile(null);
      setImagePreview('');
      setShowAskForm(false);
      toast({
        title: "نجح!",
        description: "تم نشر السؤال بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'فشل إنشاء السؤال',
        variant: "destructive",
      });
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        try {
          const processed = await processImage(result);
          setImagePreview(processed);
        } catch (error) {
          toast({
            title: "خطأ",
            description: "فشل معالجة الصورة",
            variant: "destructive",
          });
          setImagePreview(result);
        }
      };
      reader.onerror = () => {
        toast({
          title: "خطأ",
          description: "فشل قراءة الصورة",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getGradeDisplay = (grade?: string): string => {
    if (!grade) return 'غير محدد';
    return grade === '4th' ? 'الرابع' : grade === '5th' ? 'الخامس' : 'السادس';
  };

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
            <Button onClick={() => window.location.href = '/login'} size="lg" variant="default" data-testid="button-login-nav">
              تسجيل الدخول
            </Button>
            <Button onClick={() => window.location.href = '/register'} size="lg" variant="outline" data-testid="button-register-nav">
              إنشاء حساب جديد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 truncate">الزملاء</h1>
            <p className="text-blue-700 text-xs md:text-sm truncate">مرحباً {currentUser?.username} - الصف: {getGradeDisplay(currentUser?.grade)} الإعدادي</p>
          </div>
          <div className="flex gap-1 md:gap-2 flex-wrap">
            <Button 
              onClick={() => window.location.href = '/profile'} 
              variant="outline" 
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              data-testid="button-profile"
            >
              <User className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            {currentUser?.role === 'admin' && (
              <Button onClick={() => window.location.href = '/admin'} variant="default" size="sm" data-testid="button-admin-panel" className="text-xs md:text-sm">
                لوحة التحكم
              </Button>
            )}
            <Button onClick={handleLogout} variant="destructive" size="sm" data-testid="button-logout" className="text-xs md:text-sm">تسجيل الخروج</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Ask Question Button */}
            <Button 
              onClick={() => setShowAskForm(!showAskForm)}
              variant="default"
              className="mb-4 md:mb-6 w-full text-sm md:text-base"
              data-testid="button-ask-question"
            >
              {showAskForm ? 'إلغاء' : 'اسأل سؤال جديد'}
            </Button>

            {/* Ask Form */}
            {showAskForm && (
              <Card className="p-4 md:p-6 mb-6 md:mb-8 bg-white shadow-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المادة</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-white border border-gray-300">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="اكتب سؤالك هنا..."
                    value={questionContent}
                    onChange={(e) => setQuestionContent(e.target.value)}
                    className="min-h-32"
                    data-testid="textarea-question"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رفع صورة (اختياري)</label>
                    {!imagePreview ? (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        data-testid="input-image"
                      />
                    ) : (
                      <div className="relative inline-block w-full">
                        <img src={imagePreview} alt="preview" className="mt-4 max-h-32 rounded w-full" />
                        <Button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                          variant="destructive"
                          size="sm"
                          className="absolute top-3 right-3 z-10 h-8 w-8 p-0 flex items-center justify-center"
                          data-testid="button-cancel-image"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => createQuestionMutation.mutate({
                      subject: selectedSubject,
                      content: questionContent,
                      imageUrl: imagePreview || null
                    })}
                    variant="default"
                    className="w-full"
                    disabled={createQuestionMutation.isPending || !questionContent}
                    data-testid="button-post-question"
                  >
                    نشر السؤال
                  </Button>
                </div>
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg md:text-xl font-bold text-blue-900">الأسئلة الأخيرة</h2>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border border-gray-300 text-sm">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {questionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <Card className="p-8 text-center text-gray-500" data-testid="text-no-questions">
                  لا توجد أسئلة حالياً. كن أول من يسأل!
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {questions.map((q: any) => {
                      const [isFav, setIsFav] = useState(false);
                      
                      return (
                        <Card key={q.id} className="p-3 md:p-4 hover:shadow-lg transition-shadow" 
                              data-testid={`card-question-${q.id}`}>
                          <div className="flex gap-2 md:gap-4 items-start cursor-pointer" onClick={() => window.location.href = `/question/${q.id}`}>
                            {/* Thumbnail Image - Right side */}
                            {q.imageUrl && (
                              <div className="flex-shrink-0 hidden sm:block">
                                <img 
                                  src={q.imageUrl} 
                                  alt="question thumbnail" 
                                  className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover border border-gray-200"
                                />
                              </div>
                            )}
                            
                            {/* Content - Left side */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                <span className="text-xs md:text-sm bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                                  {q.subject}
                                </span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{q.grade === '4th' ? 'الرابع' : q.grade === '5th' ? 'الخامس' : 'السادس'}</span>
                              </div>
                              <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{q.content.substring(0, 100)}...</h3>
                              
                              {/* Tags Display */}
                              {q.tags && q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {q.tags.slice(0, 2).map((tag: any) => (
                                    <span key={tag.id} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <p className="text-xs md:text-sm text-gray-500 truncate">
                                بقلم: <button onClick={(e) => { e.stopPropagation(); window.location.href = `/profile?username=${q.username}`; }} className="text-blue-600 hover:underline" data-testid={`button-user-${q.username}`}>{q.username}</button>
                              </p>
                            </div>
                            
                            {/* Favorite Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFav(!isFav);
                              }}
                              className={`flex-shrink-0 ${isFav ? "text-red-500" : "text-gray-400"}`}
                              data-testid={`button-favorite-${q.id}`}
                            >
                              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFav ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {questionsResponse.pagination && questionsResponse.pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-8 p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                        className="w-full sm:w-auto"
                      >
                        <ChevronRight className="w-4 h-4 ml-2" />
                        السابق
                      </Button>
                      
                      <div className="text-sm text-gray-600">
                        صفحة {questionsResponse.pagination.page} من {questionsResponse.pagination.totalPages}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(questionsResponse.pagination.totalPages, page + 1))}
                        disabled={!questionsResponse.pagination.hasMore}
                        data-testid="button-next-page"
                        className="w-full sm:w-auto"
                      >
                        التالي
                        <ChevronLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-4 md:space-y-6">
            {/* Users Count */}
            <Card className="p-4 md:p-6 bg-white shadow-lg">
              <h3 className="text-base md:text-lg font-bold text-blue-900 mb-3 md:mb-4">عدد المستخدمين</h3>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600">{usersCount}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">طالب وطالبة</p>
              </div>
            </Card>

            {/* Top Answerers */}
            <Card className="p-4 md:p-6 bg-white shadow-lg">
              <h3 className="text-base md:text-lg font-bold text-blue-900 mb-3 md:mb-4">أكثر الطلاب إجابة</h3>
              <div className="space-y-2 md:space-y-3">
                {topAnswerers.length === 0 ? (
                  <p className="text-gray-500 text-xs md:text-sm">لم يوجد بيانات بعد</p>
                ) : (
                  topAnswerers.map((user: any, idx: number) => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-xs md:text-sm" onClick={() => window.location.href = `/profile?username=${user.username}`} data-testid={`stat-answerer-${user.id}`}>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{idx + 1}. <button onClick={(e) => { e.stopPropagation(); }} className="text-blue-600 hover:underline" data-testid={`button-top-answerer-${user.id}`}>{user.username}</button></p>
                        <p className="text-xs text-gray-500">{user.answersGiven} إجابة</p>
                      </div>
                      {user.isGoldenColleague && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded whitespace-nowrap ml-1 flex-shrink-0" data-testid="badge-golden">Golden</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Askers */}
            <Card className="p-4 md:p-6 bg-white shadow-lg">
              <h3 className="text-base md:text-lg font-bold text-blue-900 mb-3 md:mb-4">أكثر الطلاب سؤالاً</h3>
              <div className="space-y-2 md:space-y-3">
                {topAskers.length === 0 ? (
                  <p className="text-gray-500 text-xs md:text-sm">لم يوجد بيانات بعد</p>
                ) : (
                  topAskers.map((user: any, idx: number) => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-xs md:text-sm" onClick={() => window.location.href = `/profile?username=${user.username}`} data-testid={`stat-asker-${user.id}`}>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{idx + 1}. <button onClick={(e) => { e.stopPropagation(); }} className="text-blue-600 hover:underline" data-testid={`button-top-asker-${user.id}`}>{user.username}</button></p>
                        <p className="text-xs text-gray-500">{user.questionsAsked} سؤال</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
