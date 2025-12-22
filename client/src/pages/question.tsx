import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, Flag, Trash2 } from 'lucide-react';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
}

export default function Question() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [ratedAnswers, setRatedAnswers] = useState<Set<number>>(new Set());
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const id = parseInt(new URL(window.location.href).pathname.split('/').pop() || '0');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCurrentUser(data));
  }, []);

  const { data: question } = useQuery({
    queryKey: [`/api/questions/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/questions/${id}`);
      return res.json();
    }
  });

  const { data: answers = [] } = useQuery({
    queryKey: [`/api/questions/${id}/answers`],
    queryFn: async () => {
      const res = await fetch(`/api/questions/${id}/answers`);
      return res.json();
    }
  });

  const createAnswerMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to create answer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}/answers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/top-answerers'] });
      setAnswerContent('');
    }
  });

  const rateMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const res = await fetch(`/api/answers/${answerId}/rate`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to rate');
      }
      return res.json();
    },
    onSuccess: (_, answerId) => {
      setRatedAnswers(prev => new Set(prev).add(answerId));
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}/answers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/top-answerers'] });
    },
    onError: (error: any) => {
      console.error(error.message);
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/questions/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Failed to report');
      return res.json();
    },
    onSuccess: () => {
      setReportReason('');
      setShowReportForm(false);
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete question');
      return res.json();
    },
    onSuccess: () => {
      window.history.back();
    }
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete answer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}/answers`] });
    }
  });

  if (!question) return <div className="text-center p-8" data-testid="text-loading">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => window.history.back()} variant="outline" className="mb-6" data-testid="button-back">
          ← العودة
        </Button>

        {/* Question */}
        <Card className="p-8 mb-8 bg-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{question.content}</h1>
              <p className="text-sm text-gray-500">
                بقلم: <button onClick={() => window.location.href = `/profile?username=${question.username}`} className="text-blue-600 hover:underline" data-testid={`button-user-${question.username}`}>{question.username}</button> ({question.grade === '4th' ? 'الرابع' : question.grade === '5th' ? 'الخامس' : 'السادس'}) • {new Date(question.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {question.subject}
              </span>
              {currentUser?.role === 'admin' && (
                <Button
                  onClick={() => {
                    if (confirm('هل تريد حذف هذا السؤال؟')) {
                      deleteQuestionMutation.mutate();
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  disabled={deleteQuestionMutation.isPending}
                  data-testid="button-delete-question"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {currentUser && (
                <Button
                  onClick={() => setShowReportForm(!showReportForm)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  data-testid="button-report-question"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {question.imageUrl && (
            <img src={question.imageUrl} alt="question" className="w-full max-h-96 rounded mb-4 object-cover" />
          )}

          {showReportForm && (
            <div className="mt-4 p-4 bg-red-50 rounded">
              <Textarea
                placeholder="اشرح سبب الإبلاغ عن هذا السؤال..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="min-h-24 mb-3"
                data-testid="textarea-report"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => reportMutation.mutate(reportReason)}
                  variant="default"
                  disabled={reportMutation.isPending || reportReason.length < 5}
                  data-testid="button-submit-report"
                >
                  إرسال الإبلاغ
                </Button>
                <Button
                  onClick={() => setShowReportForm(false)}
                  variant="outline"
                  data-testid="button-cancel-report"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Answer Form */}
        {currentUser && (
          <Card className="p-6 mb-8 bg-white shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">أضف إجابتك</h2>
            <div className="space-y-4">
              <Textarea
                placeholder="اكتب إجابتك هنا..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                className="min-h-32"
                data-testid="textarea-answer"
              />
              <Button
                onClick={() => createAnswerMutation.mutate(answerContent)}
                variant="default"
                className="w-full"
                disabled={createAnswerMutation.isPending || !answerContent}
                data-testid="button-post-answer"
              >
                نشر الإجابة
              </Button>
            </div>
          </Card>
        )}

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجابات ({answers.length})</h2>
          {answers.length === 0 ? (
            <Card className="p-8 text-center text-gray-500" data-testid="text-no-answers">
              لا توجد إجابات حالياً
            </Card>
          ) : (
            answers.map((a: any) => (
              <Card key={a.id} className="p-6 bg-white shadow-lg" data-testid={`card-answer-${a.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-gray-900"><button onClick={() => window.location.href = `/profile?username=${a.username}`} className="text-blue-600 hover:underline" data-testid={`button-answer-user-${a.username}`}>{a.username}</button></p>
                    <p className="text-xs text-gray-500">
                      {a.grade === '4th' ? 'الرابع' : a.grade === '5th' ? 'الخامس' : 'السادس'} • {new Date(a.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser?.role === 'admin' && (
                      <Button
                        onClick={() => {
                          if (confirm('هل تريد حذف هذه الإجابة؟')) {
                            deleteAnswerMutation.mutate(a.id);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        disabled={deleteAnswerMutation.isPending}
                        data-testid={`button-delete-answer-${a.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => rateMutation.mutate(a.id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={!currentUser || ratedAnswers.has(a.id) || rateMutation.isPending}
                      data-testid={`button-rate-answer-${a.id}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{a.rating || 0}</span>
                    </Button>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{a.content}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
