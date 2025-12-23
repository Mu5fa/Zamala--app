import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await db.select().from(users).where(eq(users.username, input.username));
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل", field: "username" });
      }
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const [user] = await db.insert(users).values({...input, password: hashedPassword}).returning();
      (req.session as any).userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const allUsers = await db.select().from(users).where(eq(users.username, input.username));
      const user = allUsers[0];
      if (!user) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      const passwordMatch = await bcrypt.compare(input.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      (req.session as any).userId = user.id;
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    req.session.destroy((err) => {
      if (err) throw err;
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!(req.session as any).userId) {
      return res.json(null);
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    res.json(user || null);
  });

  // Users Routes
  app.get(api.users.getByUsername.path, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    res.json(user);
  });

  // Tags Routes
  app.get('/api/tags', async (req, res) => {
    const allTags = await storage.getAllTags();
    res.json(allTags);
  });

  // Favorites Routes
  app.post('/api/favorites/:questionId', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const success = await storage.addFavorite((req.session as any).userId, Number(req.params.questionId));
    if (success) {
      res.json({ message: "تم إضافة للمفضلة" });
    } else {
      res.status(400).json({ message: "موجود بالفعل في المفضلة" });
    }
  });

  app.delete('/api/favorites/:questionId', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    await storage.removeFavorite((req.session as any).userId, Number(req.params.questionId));
    res.json({ message: "تم الحذف من المفضلة" });
  });

  app.get('/api/favorites/check/:questionId', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.json({ isFavorited: false });
    }
    const isFavorited = await storage.isFavorited((req.session as any).userId, Number(req.params.questionId));
    res.json({ isFavorited });
  });

  app.get('/api/my-favorites', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const favorites = await storage.getUserFavorites((req.session as any).userId);
    res.json(favorites);
  });

  // Comments Routes
  app.get('/api/comments/:questionId', async (req, res) => {
    const answerId = req.query.answerId ? Number(req.query.answerId) : undefined;
    const questionComments = await storage.getComments(Number(req.params.questionId), answerId);
    res.json(questionComments);
  });

  app.post('/api/comments/:questionId', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const { content, answerId } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "التعليق مطلوب" });
    }
    const comment = await storage.createComment(Number(req.params.questionId), (req.session as any).userId, content, answerId);
    res.json(comment);
  });

  // Notifications Routes
  app.get('/api/notifications', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const notifications = await storage.getNotifications((req.session as any).userId);
    res.json(notifications);
  });

  app.patch('/api/notifications/:notificationId/read', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    await storage.markNotificationAsRead(Number(req.params.notificationId));
    res.json({ message: "تم تحديث الإشعار" });
  });

  // Questions Routes with Pagination
  app.get(api.questions.list.path, async (req, res) => {
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
    const limit = Math.min(50, parseInt(String(req.query.limit || 10), 10));
    const questions = await storage.getQuestions(subject);
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedQuestions = questions.slice(startIdx, endIdx);
    res.json({
      data: paginatedQuestions,
      pagination: {
        page,
        limit,
        total: questions.length,
        totalPages: Math.ceil(questions.length / limit),
        hasMore: endIdx < questions.length
      }
    });
  });

  app.post(api.questions.create.path, async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    try {
      const input = api.questions.create.input.parse(req.body);
      const question = await storage.createQuestion(input, (req.session as any).userId);
      res.status(201).json(question);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.questions.get.path, async (req, res) => {
    const question = await storage.getQuestion(Number(req.params.id));
    if (!question) {
      return res.status(404).json({ message: "السؤال غير موجود" });
    }
    res.json(question);
  });

  // Answers Routes
  app.get(api.answers.list.path, async (req, res) => {
    const answers = await storage.getAnswers(Number(req.params.id));
    res.json(answers);
  });

  app.post(api.answers.create.path, async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    try {
      const input = api.answers.create.input.parse(req.body);
      const answer = await storage.createAnswer(
        input,
        Number(req.params.id),
        (req.session as any).userId
      );
      
      // Get question details to send notification to question owner
      const question = await storage.getQuestion(Number(req.params.id));
      if (question) {
        const currentUser = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
        if (currentUser[0] && question.userId !== (req.session as any).userId) {
          await storage.createNotification(
            question.userId,
            'answer',
            `أجاب ${currentUser[0].username} على سؤالك`,
            (req.session as any).userId,
            Number(req.params.id),
            answer.id
          );
        }
      }
      
      res.status(201).json(answer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.answers.rate.path, async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const result = await storage.rateAnswer(Number(req.params.id), (req.session as any).userId);
    if (!result) {
      return res.status(404).json({ message: "الإجابة غير موجودة" });
    }
    if (result.alreadyRated) {
      return res.status(400).json({ message: "أنت قد قيمت هذه الإجابة مسبقاً" });
    }
    res.json(result.answer);
  });

  // Statistics Routes
  app.get('/api/stats/top-answerers', async (req, res) => {
    const topAnswerers = await storage.getTopAnswerers(5);
    res.json(topAnswerers);
  });

  app.get('/api/stats/top-askers', async (req, res) => {
    const topAskers = await storage.getTopAskers(5);
    res.json(topAskers);
  });

  app.get('/api/stats/users-count', async (req, res) => {
    const count = await storage.getTotalUsersCount();
    res.json({ count });
  });

  // Reports Routes
  app.post('/api/questions/:id/report', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    try {
      const { reason } = req.body;
      if (!reason || reason.length < 5) {
        return res.status(400).json({ message: "السبب يجب أن يكون على الأقل 5 أحرف" });
      }
      const report = await storage.reportQuestion(Number(req.params.id), (req.session as any).userId, reason);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post('/api/answers/:id/report', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    try {
      const { reason } = req.body;
      if (!reason || reason.length < 5) {
        return res.status(400).json({ message: "السبب يجب أن يكون على الأقل 5 أحرف" });
      }
      const report = await storage.reportAnswer(Number(req.params.id), (req.session as any).userId, reason);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get('/api/reports', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    const reports = await storage.getReports();
    res.json(reports);
  });

  app.delete('/api/questions/:id', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    await storage.deleteQuestion(Number(req.params.id));
    res.json({ message: "تم حذف السؤال" });
  });

  app.delete('/api/answers/:id', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    await storage.deleteAnswer(Number(req.params.id));
    res.json({ message: "تم حذف الإجابة" });
  });

  app.patch('/api/reports/:id/resolve', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    const { type } = req.body;
    await storage.resolveReport(Number(req.params.id), type || 'question');
    res.json({ message: "تم تحديث التقرير" });
  });

  app.post('/api/reports/:id/resolve-and-delete', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    const { type, contentId } = req.body;
    if (type === 'question') {
      await storage.deleteQuestion(contentId);
    } else {
      await storage.deleteAnswer(contentId);
    }
    await storage.resolveReport(Number(req.params.id), type);
    res.json({ message: "تم حذف المحتوى" });
  });

  app.get('/api/admin/users', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, (req.session as any).userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }
    if (user.id === Number(req.params.id)) {
      return res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص" });
    }
    await storage.deleteUser(Number(req.params.id));
    res.json({ message: "تم حذف الحساب" });
  });

  return httpServer;
}
