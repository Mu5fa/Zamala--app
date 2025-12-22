import { useQuestions } from "@/hooks/use-questions";
import { Navbar } from "@/components/Navbar";
import { QuestionCard } from "@/components/QuestionCard";
import { AskQuestionDialog } from "@/components/AskQuestionDialog";
import { Loader2, SearchX } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;

  const { data: questions, isLoading, error } = useQuestions(grade);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-tajawal pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary text-primary-foreground py-16 mb-12 rounded-b-[3rem] shadow-xl">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            اسأل، شارك، وتعلم <br/>
            <span className="text-accent inline-block mt-2">الرياضيات بمتعة!</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            منصة تفاعلية لطلاب الصفوف الرابع والخامس والسادس.
            شارك أسئلتك وساعد أصدقاءك في حل المسائل الرياضية.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AskQuestionDialog />
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground border-r-4 border-primary pr-4">
            {grade ? `أسئلة الصف ${grade === 4 ? "الرابع" : grade === 5 ? "الخامس" : "السادس"}` : "أحدث الأسئلة"}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">جاري تحميل الأسئلة...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <p className="text-red-500 font-bold text-lg mb-2">عذراً، حدث خطأ ما</p>
            <p className="text-red-400">فشل تحميل قائمة الأسئلة</p>
          </div>
        ) : questions?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-border/60">
            <div className="bg-secondary/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <SearchX className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد أسئلة بعد</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              كن أول من يبدأ النقاش! اطرح سؤالاً رياضياً وسيقوم زملاؤك بالمساعدة.
            </p>
            <AskQuestionDialog />
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {questions?.map((question) => (
              <motion.div key={question.id} variants={item}>
                <QuestionCard question={question} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
