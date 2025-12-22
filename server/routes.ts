import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.questions.list.path, async (req, res) => {
    const grade = req.query.grade ? Number(req.query.grade) : undefined;
    const questions = await storage.getQuestions(grade);
    res.json(questions);
  });

  app.post(api.questions.create.path, async (req, res) => {
    try {
      const input = api.questions.create.input.parse(req.body);
      const question = await storage.createQuestion(input);
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
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  });

  app.get(api.answers.list.path, async (req, res) => {
    const answers = await storage.getAnswers(Number(req.params.id));
    res.json(answers);
  });

  app.post(api.answers.create.path, async (req, res) => {
    try {
      const input = api.answers.create.input.parse(req.body);
      const answer = await storage.createAnswer({
        ...input,
        questionId: Number(req.params.id)
      });
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

  app.patch(api.answers.like.path, async (req, res) => {
    const answer = await storage.likeAnswer(Number(req.params.id));
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.json(answer);
  });

  // Seed data if empty
  const existingQuestions = await storage.getQuestions();
  if (existingQuestions.length === 0) {
    console.log("Seeding database...");
    const q1 = await storage.createQuestion({
      grade: 4,
      content: "ما هو ناتج ضرب 5 × 6؟"
    });
    await storage.createAnswer({
      questionId: q1.id,
      content: "الناتج هو 30"
    });

    const q2 = await storage.createQuestion({
      grade: 5,
      content: "اكتب الكسر المكافئ للعدد 0.5"
    });
    await storage.createAnswer({
      questionId: q2.id,
      content: "1/2"
    });
    
    await storage.createQuestion({
      grade: 6,
      content: "أوجد مساحة مثلث قاعدته 10 سم وارتفاعه 5 سم"
    });
    console.log("Database seeded!");
  }

  return httpServer;
}
