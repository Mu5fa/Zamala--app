import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertQuestion, type InsertAnswer } from "@shared/routes";

// ==========================================
// QUESTIONS
// ==========================================

export function useQuestions(grade?: number) {
  return useQuery({
    queryKey: [api.questions.list.path, grade],
    queryFn: async () => {
      // Build URL with optional query param
      let url = api.questions.list.path;
      if (grade) {
        url += `?grade=${grade}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("فشل تحميل الأسئلة");
      return api.questions.list.responses[200].parse(await res.json());
    },
  });
}

export function useQuestion(id: number) {
  return useQuery({
    queryKey: [api.questions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.questions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("فشل تحميل السؤال");
      return api.questions.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertQuestion) => {
      // Validate with schema first
      const validated = api.questions.create.input.parse(data);
      
      const res = await fetch(api.questions.create.path, {
        method: api.questions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.questions.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("فشل إنشاء السؤال");
      }
      
      return api.questions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.questions.list.path] });
    },
  });
}

// ==========================================
// ANSWERS
// ==========================================

export function useAnswers(questionId: number) {
  return useQuery({
    queryKey: [api.answers.list.path, questionId],
    queryFn: async () => {
      const url = buildUrl(api.answers.list.path, { id: questionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("فشل تحميل الإجابات");
      return api.answers.list.responses[200].parse(await res.json());
    },
    enabled: !!questionId,
  });
}

export function useCreateAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, content }: { questionId: number; content: string }) => {
      const validated = api.answers.create.input.parse({ content });
      const url = buildUrl(api.answers.create.path, { id: questionId });
      
      const res = await fetch(url, {
        method: api.answers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("فشل إضافة الإجابة");
      }
      return api.answers.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.answers.list.path, variables.questionId] });
    },
  });
}

export function useLikeAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, questionId }: { id: number; questionId: number }) => {
      const url = buildUrl(api.answers.like.path, { id });
      const res = await fetch(url, { 
        method: api.answers.like.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("فشل تسجيل الإعجاب");
      return api.answers.like.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the answers list for the specific question to update like counts
      queryClient.invalidateQueries({ queryKey: [api.answers.list.path, variables.questionId] });
    },
  });
}
