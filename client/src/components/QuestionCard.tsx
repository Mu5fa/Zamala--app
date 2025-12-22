import { Link } from "wouter";
import { MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { Question } from "@shared/schema";

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const gradeColors: Record<number, string> = {
    4: "bg-green-100 text-green-700 border-green-200",
    5: "bg-blue-100 text-blue-700 border-blue-200",
    6: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const gradeLabels: Record<number, string> = {
    4: "الصف الرابع",
    5: "الصف الخامس",
    6: "الصف السادس",
  };

  return (
    <Link href={`/question/${question.id}`}>
      <div className="group bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full flex flex-col relative overflow-hidden">
        
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-secondary/50 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${gradeColors[question.grade] || "bg-gray-100"}`}>
            {gradeLabels[question.grade]}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {question.createdAt 
                ? formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: ar }) 
                : "منذ قليل"}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-3 leading-relaxed flex-grow group-hover:text-primary transition-colors">
          {question.content}
        </h3>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-muted-foreground group-hover:text-primary/80 transition-colors">
          <div className="flex items-center gap-2">
            <div className="bg-secondary/50 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">إجابات</span>
          </div>
          <span className="text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            اقرأ المزيد ←
          </span>
        </div>
      </div>
    </Link>
  );
}
