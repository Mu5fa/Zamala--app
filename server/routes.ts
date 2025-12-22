import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      const [user] = await db.insert(users).values(input).returning();
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
      const [user] = await db.select().from(users).where(eq(users.username, input.username));
      if (!user || user.password !== input.password) {
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

  // Questions Routes
  app.get(api.questions.list.path, async (req, res) => {
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const questions = await storage.getQuestions(subject);
    res.json(questions);
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
    const answer = await storage.rateAnswer(Number(req.params.id));
    if (!answer) {
      return res.status(404).json({ message: "الإجابة غير موجودة" });
    }
    res.json(answer);
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

  return httpServer;
}
