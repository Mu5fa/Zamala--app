import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp } from 'lucide-react';

export default function Question() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState('');
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
      if (!res.ok) throw new Error('Failed to rate');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}/answers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/top-answerers'] });
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
                بقلم: {question.username} ({question.grade === '4th' ? 'الرابع' : question.grade === '5th' ? 'الخامس' : 'السادس'}) • {new Date(question.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {question.subject}
            </span>
          </div>
          {question.imageUrl && (
            <img src={question.imageUrl} alt="question" className="w-full max-h-96 rounded mb-4 object-cover" />
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
                className="w-full bg-blue-600 hover:bg-blue-700"
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
                    <p className="font-semibold text-gray-900">{a.username}</p>
                    <p className="text-xs text-gray-500">
                      {a.grade === '4th' ? 'الرابع' : a.grade === '5th' ? 'الخامس' : 'السادس'} • {new Date(a.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Button
                    onClick={() => rateMutation.mutate(a.id)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid={`button-rate-answer-${a.id}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{a.rating || 0}</span>
                  </Button>
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
