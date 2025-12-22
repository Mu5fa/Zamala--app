import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { useCreateQuestion } from "@/hooks/use-questions";
import { useToast } from "@/hooks/use-toast";

export function AskQuestionDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [grade, setGrade] = useState("4");
  
  const { toast } = useToast();
  const createQuestion = useCreateQuestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createQuestion.mutateAsync({
        content,
        grade: parseInt(grade),
      });
      
      toast({
        title: "تم نشر سؤالك بنجاح! 🎉",
        description: "سيتمكن الطلاب الآخرون من رؤية سؤالك والإجابة عليه.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setOpen(false);
      setContent("");
      setGrade("4");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل نشر السؤال",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold px-8"
        >
          <Plus className="ml-2 w-5 h-5" />
          اسأل سؤالاً جديداً
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-3xl border-2 border-primary/10 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <DialogHeader className="relative z-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-primary">أضف سؤالك الجديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground mr-1 block">الصف الدراسي</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full rounded-xl border-2 border-border/50 h-12 bg-white focus:ring-primary/20 font-medium">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">الصف الرابع</SelectItem>
                <SelectItem value="5">الصف الخامس</SelectItem>
                <SelectItem value="6">الصف السادس</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground mr-1 block">نص السؤال</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب سؤالك هنا بوضوح..."
              className="min-h-[150px] resize-none rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-base p-4"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold border-2 hover:bg-secondary/50"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createQuestion.isPending || !content.trim()}
              className="flex-1 rounded-xl h-12 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {createQuestion.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                "نشر السؤال"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
