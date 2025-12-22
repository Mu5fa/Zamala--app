import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.role !== 'admin') {
          window.location.href = '/';
        } else {
          setCurrentUser(data);
        }
      });
  }, []);

  const { data: reports = [] } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to resolve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    }
  });

  const deleteAndResolveMutation = useMutation({
    mutationFn: async ({ reportId, contentId, type }: { reportId: number; contentId: number; type: 'question' | 'answer' }) => {
      const res = await fetch(`/api/reports/${reportId}/resolve-and-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId, type })
      });
      if (!res.ok) throw new Error('Failed to delete and resolve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/users-count'] });
    }
  });

  if (!currentUser) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">لوحة التحكم</h1>
          <Button onClick={() => window.location.href = '/'} variant="outline" data-testid="button-home">
            العودة للرئيسية
          </Button>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" data-testid="tab-reports">الإبلاغات</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">المستخدمون</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4 mt-4">
            {reports.length === 0 ? (
              <Card className="p-8 text-center text-gray-500" data-testid="text-no-reports">
                لا توجد إبلاغات في الانتظار
              </Card>
            ) : (
              reports.map((report: any) => (
                <Card key={report.id} className="p-6 bg-white shadow-lg" data-testid={`card-report-${report.id}`}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">السؤال:</p>
                      <p className="font-semibold text-gray-900">{report.questionContent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">السبب:</p>
                      <p className="text-gray-700">{report.reason}</p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        أبلغ عن طريق: {report.reporterName} • {new Date(report.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (confirm(`هل تريد حذف ${report.type === 'question' ? 'السؤال' : 'الإجابة'}؟`)) {
                              deleteAndResolveMutation.mutate({
                                reportId: report.id,
                                contentId: report.contentId,
                                type: report.type
                              });
                            }
                          }}
                          variant="destructive"
                          size="sm"
                          disabled={deleteAndResolveMutation.isPending}
                          data-testid={`button-delete-resolve-${report.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          حذف
                        </Button>
                        <Button
                          onClick={() => resolveMutation.mutate(report.id)}
                          variant="default"
                          size="sm"
                          disabled={resolveMutation.isPending}
                          data-testid={`button-resolve-${report.id}`}
                        >
                          تم المراجعة
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            {allUsers.length === 0 ? (
              <Card className="p-8 text-center text-gray-500" data-testid="text-no-users">
                لا توجد مستخدمون
              </Card>
            ) : (
              allUsers.map((user: any) => (
                <Card key={user.id} className="p-6 bg-white shadow-lg" data-testid={`card-user-${user.id}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">الصف: {user.grade === '4th' ? 'الرابع' : user.grade === '5th' ? 'الخامس' : 'السادس'} • دور: {user.role === 'admin' ? 'مسؤول' : 'طالب'}</p>
                      <p className="text-xs text-gray-400 mt-1">أسئلة: {user.questionsAsked} • إجابات: {user.answersGiven}</p>
                    </div>
                    {currentUser?.id !== user.id && (
                      <Button
                        onClick={() => {
                          if (confirm(`هل تريد حذف حساب ${user.username}؟`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        variant="destructive"
                        size="sm"
                        disabled={deleteUserMutation.isPending}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
