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
    }
  });

  if (!question) return <div className="text-center p-8">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => window.history.back()} variant="outline" className="mb-6">
          ← العودة
        </Button>

        {/* Question */}
        <Card className="p-8 bg-white shadow-lg mb-8">
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {question.subject}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-4">{question.content}</h1>
          {question.imageUrl && (
            <img src={question.imageUrl} alt="question" className="w-full max-h-96 rounded mb-4 object-cover" />
          )}
          <p className="text-sm text-gray-500">
            {new Date(question.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </Card>

        {/* Add Answer */}
        {currentUser && (
          <Card className="p-6 bg-white shadow-lg mb-8">
            <h2 className="text-lg font-semibold mb-4">أضف إجابتك</h2>
            <div className="space-y-4">
              <Textarea
                placeholder="اكتب إجابتك هنا..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                className="min-h-32"
              />
              <Button
                onClick={() => createAnswerMutation.mutate(answerContent)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createAnswerMutation.isPending || !answerContent}
              >
                إرسال الإجابة
              </Button>
            </div>
          </Card>
        )}

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            الإجابات ({answers.length})
          </h2>
          {answers.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              لا توجد إجابات حالياً
            </Card>
          ) : (
            answers.map((answer: any) => (
              <Card key={answer.id} className="p-6">
                <p className="text-gray-900 mb-4">{answer.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(answer.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                  <Button
                    onClick={() => rateMutation.mutate(answer.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {answer.rating}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
