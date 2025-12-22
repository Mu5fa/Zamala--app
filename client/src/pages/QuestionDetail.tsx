import { useQuestion, useAnswers, useCreateAnswer, useLikeAnswer } from "@/hooks/use-questions";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRoute } from "wouter";
import { ArrowRight, Clock, ThumbsUp, Send, Loader2, Award, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function QuestionDetail() {
  const [, params] = useRoute("/question/:id");
  const id = parseInt(params?.id || "0");
  
  const { data: question, isLoading: qLoading } = useQuestion(id);
  const { data: answers, isLoading: aLoading } = useAnswers(id);
  
  const createAnswer = useCreateAnswer();
  const likeAnswer = useLikeAnswer();
  const { toast } = useToast();
  
  const [answerContent, setAnswerContent] = useState("");

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    try {
      await createAnswer.mutateAsync({
        questionId: id,
        content: answerContent
      });
      
      setAnswerContent("");
      toast({
        title: "تمت إضافة إجابتك! 🌟",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل إضافة الإجابة",
      });
    }
  };

  const handleLike = async (answerId: number) => {
    try {
      await likeAnswer.mutateAsync({ id: answerId, questionId: id });
    } catch (error) {
      toast({ variant: "destructive", title: "فشل تسجيل الإعجاب" });
    }
  };

  const gradeLabels: Record<number, string> = {
    4: "الصف الرابع",
    5: "الصف الخامس",
    6: "الصف السادس",
  };

  if (qLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">السؤال غير موجود</h1>
        <Link href="/">
          <Button variant="outline">العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-tajawal pb-20">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <button className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors font-medium">
            <ArrowRight className="ml-2 w-4 h-4" />
            العودة للأسئلة
          </button>
        </Link>

        {/* Question Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-border/50 mb-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-primary to-secondary" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
              {gradeLabels[question.grade]}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 ml-1" />
              {question.createdAt && formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: ar })}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed mb-4">
            {question.content}
          </h1>
          
          <div className="flex items-center gap-2 text-muted-foreground border-t pt-4 mt-4">
            <div className="bg-gray-100 p-2 rounded-full">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-sm font-medium">سائل مجهول</span>
          </div>
        </motion.div>

        {/* Answers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            الإجابات ({answers?.length || 0})
          </h2>

          <div className="space-y-6">
            <AnimatePresence>
              {aLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                </div>
              ) : answers?.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-secondary/20 rounded-2xl p-8 text-center border border-dashed border-secondary"
                >
                  <p className="text-muted-foreground font-medium text-lg">لا توجد إجابات بعد. كن أول من يساعد!</p>
                </motion.div>
              ) : (
                answers?.map((answer) => (
                  <motion.div
                    key={answer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 flex gap-4"
                  >
                    <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(answer.id)}
                        className={cn(
                          "rounded-full w-10 h-10 hover:bg-green-50 hover:text-green-600 transition-colors",
                          answer.likes && answer.likes > 0 ? "text-green-600 bg-green-50" : "text-muted-foreground"
                        )}
                        disabled={likeAnswer.isPending}
                      >
                        <ThumbsUp className={cn("w-5 h-5", likeAnswer.isPending && "animate-pulse")} />
                      </Button>
                      <span className="text-sm font-bold text-foreground">{answer.likes || 0}</span>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                        {answer.content}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {answer.createdAt && formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true, locale: ar })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add Answer Form */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary/10 sticky bottom-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">أضف إجابتك</h3>
          <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4">
            <Textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="اكتب الحل هنا..."
              className="min-h-[100px] resize-none rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-base p-4"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg"
                disabled={!answerContent.trim() || createAnswer.isPending}
                className="rounded-xl px-8 font-bold bg-primary hover:bg-primary/90"
              >
                {createAnswer.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="ml-2 w-4 h-4" />
                    نشر الإجابة
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
