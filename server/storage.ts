import { questions, answers, users, answerRatings, questionReports, answerReports, tags, questionTags, favorites, comments, type Question, type InsertQuestion, type Answer, type InsertAnswer, type User, type QuestionReport, type InsertQuestionReport, type AnswerReport, type InsertAnswerReport, type Tag } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like, inArray } from "drizzle-orm";

export interface IStorage {
  getQuestions(subject?: string, tags?: string[], sortBy?: 'newest' | 'popular'): Promise<(Question & { username: string; grade: string; tags: Tag[] })[]>;
  getQuestion(id: number): Promise<(Question & { username: string; grade: string; tags: Tag[] }) | undefined>;
  createQuestion(question: InsertQuestion, userId: number, tags?: string[]): Promise<Question>;
  
  getAnswers(questionId: number): Promise<(Answer & { username: string; grade: string })[]>;
  createAnswer(answer: InsertAnswer, questionId: number, userId: number): Promise<Answer>;
  rateAnswer(id: number, userId: number): Promise<{ answer: Answer; alreadyRated: boolean } | undefined>;
  
  getTopAnswerers(limit?: number): Promise<(User & { totalHelpfulness: number })[]>;
  getTopAskers(limit?: number): Promise<(User & { questionsAsked: number })[]>;
  getTotalUsersCount(): Promise<number>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  getAllTags(): Promise<Tag[]>;
  addFavorite(userId: number, questionId: number): Promise<boolean>;
  removeFavorite(userId: number, questionId: number): Promise<boolean>;
  isFavorited(userId: number, questionId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<Question[]>;
  
  reportQuestion(questionId: number, userId: number, reason: string): Promise<QuestionReport>;
  reportAnswer(answerId: number, userId: number, reason: string): Promise<AnswerReport>;
  getReports(): Promise<any[]>;
  resolveReport(reportId: number, type: 'question' | 'answer'): Promise<void>;
  deleteQuestion(questionId: number): Promise<void>;
  deleteAnswer(answerId: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: number): Promise<void>;
  
  getComments(questionId: number, answerId?: number): Promise<any[]>;
  createComment(questionId: number, userId: number, content: string, answerId?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getQuestions(subject?: string, tagNames?: string[], sortBy: 'newest' | 'popular' = 'newest'): Promise<(Question & { username: string; grade: string; tags: Tag[] })[]> {
    let query = db.select({
      ...questions,
      username: users.username,
      grade: users.grade,
    }).from(questions).innerJoin(users, eq(questions.userId, users.id));
    
    if (subject) {
      query = query.where(eq(questions.subject, subject));
    }
    
    if (tagNames && tagNames.length > 0) {
      const tagResults = await db.select({ tagId: tags.id }).from(tags).where(inArray(tags.name, tagNames));
      const tagIds = tagResults.map(t => t.tagId);
      const questionIds = await db.select({ questionId: questionTags.questionId }).from(questionTags).where(inArray(questionTags.tagId, tagIds));
      const qIds = questionIds.map(q => q.questionId);
      query = query.where(inArray(questions.id, qIds));
    }
    
    const orderBy = sortBy === 'popular' ? desc(questions.id) : desc(questions.createdAt);
    const result = await query.orderBy(orderBy);
    
    // Add tags to each question
    for (const q of result) {
      const qTags = await db.select({ name: tags.name, id: tags.id }).from(questionTags)
        .innerJoin(tags, eq(questionTags.tagId, tags.id))
        .where(eq(questionTags.questionId, q.id));
      (q as any).tags = qTags.map(t => ({ id: t.id, name: t.name } as Tag));
    }
    
    return result as (Question & { username: string; grade: string; tags: Tag[] })[];
  }

  async getQuestion(id: number): Promise<(Question & { username: string; grade: string; tags: Tag[] }) | undefined> {
    const [question] = await db.select({
      ...questions,
      username: users.username,
      grade: users.grade,
    }).from(questions).innerJoin(users, eq(questions.userId, users.id)).where(eq(questions.id, id));
    
    if (!question) return undefined;
    
    const qTags = await db.select({ name: tags.name, id: tags.id }).from(questionTags)
      .innerJoin(tags, eq(questionTags.tagId, tags.id))
      .where(eq(questionTags.questionId, id));
    
    return {
      ...question,
      tags: qTags.map(t => ({ id: t.id, name: t.name } as Tag))
    };
  }

  async createQuestion(insertQuestion: InsertQuestion, userId: number, tagNames?: string[]): Promise<Question> {
    const [question] = await db.insert(questions).values({
      ...insertQuestion,
      userId
    }).returning();
    
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const [tag] = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName));
        if (tag) {
          await db.insert(questionTags).values({ questionId: question.id, tagId: tag.id }).onConflictDoNothing();
        } else {
          const [newTag] = await db.insert(tags).values({ name: tagName }).returning();
          await db.insert(questionTags).values({ questionId: question.id, tagId: newTag.id });
        }
      }
    }
    
    await db.update(users).set({
      questionsAsked: sql`${users.questionsAsked} + 1`
    }).where(eq(users.id, userId));
    
    return question;
  }

  async getAnswers(questionId: number): Promise<(Answer & { username: string; grade: string })[]> {
    return await db.select({
      ...answers,
      username: users.username,
      grade: users.grade,
    }).from(answers).innerJoin(users, eq(answers.userId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.rating));
  }

  async createAnswer(insertAnswer: InsertAnswer, questionId: number, userId: number): Promise<Answer> {
    const [answer] = await db.insert(answers).values({
      ...insertAnswer,
      questionId,
      userId
    }).returning();
    
    await db.update(users).set({
      answersGiven: sql`${users.answersGiven} + 1`
    }).where(eq(users.id, userId));
    
    return answer;
  }

  async rateAnswer(id: number, userId: number): Promise<{ answer: Answer; alreadyRated: boolean } | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (!answer) return undefined;

    // Check if user already rated this answer
    const [existingRating] = await db.select().from(answerRatings)
      .where(and(eq(answerRatings.answerId, id), eq(answerRatings.userId, userId)));
    
    if (existingRating) {
      return { answer, alreadyRated: true };
    }

    // Add rating
    await db.insert(answerRatings).values({ answerId: id, userId });

    const [updatedAnswer] = await db.update(answers)
      .set({ rating: (answer.rating || 0) + 1 })
      .where(eq(answers.id, id))
      .returning();
    
    await db.update(users).set({
      totalHelpfulness: sql`${users.totalHelpfulness} + 1`
    }).where(eq(users.id, answer.userId));
    
    return { answer: updatedAnswer, alreadyRated: false };
  }

  async getTopAnswerers(limit = 5): Promise<(User & { totalHelpfulness: number })[]> {
    return await db.select().from(users)
      .orderBy(desc(users.totalHelpfulness))
      .limit(limit);
  }

  async getTopAskers(limit = 5): Promise<(User & { questionsAsked: number })[]> {
    return await db.select().from(users)
      .orderBy(desc(users.questionsAsked))
      .limit(limit);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getTotalUsersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0]?.count || 0;
  }

  async reportQuestion(questionId: number, userId: number, reason: string): Promise<QuestionReport> {
    const [report] = await db.insert(questionReports).values({
      questionId,
      reportedBy: userId,
      reason,
    }).returning();
    return report;
  }

  async getReports(): Promise<(QuestionReport & { questionContent: string; reporterName: string; questionAskerName: string })[]> {
    return await db.select({
      ...questionReports,
      questionContent: questions.content,
      reporterName: users.username,
      questionAskerName: users.username,
    }).from(questionReports)
      .innerJoin(questions, eq(questionReports.questionId, questions.id))
      .innerJoin(users, eq(questionReports.reportedBy, users.id))
      .where(eq(questionReports.resolved, false))
      .orderBy(desc(questionReports.createdAt));
  }

  async reportAnswer(answerId: number, userId: number, reason: string): Promise<AnswerReport> {
    const [report] = await db.insert(answerReports).values({
      answerId,
      reportedBy: userId,
      reason,
    }).returning();
    return report;
  }

  async getReports(): Promise<any[]> {
    const questionReportsList = await db.select({
      id: questionReports.id,
      type: sql<string>`'question'`,
      contentId: questionReports.questionId,
      content: questions.content,
      reporterName: users.username,
      reason: questionReports.reason,
      createdAt: questionReports.createdAt,
    }).from(questionReports)
      .innerJoin(questions, eq(questionReports.questionId, questions.id))
      .innerJoin(users, eq(questionReports.reportedBy, users.id))
      .where(eq(questionReports.resolved, false));

    const answerReportsList = await db.select({
      id: answerReports.id,
      type: sql<string>`'answer'`,
      contentId: answerReports.answerId,
      content: answers.content,
      reporterName: users.username,
      reason: answerReports.reason,
      createdAt: answerReports.createdAt,
    }).from(answerReports)
      .innerJoin(answers, eq(answerReports.answerId, answers.id))
      .innerJoin(users, eq(answerReports.reportedBy, users.id))
      .where(eq(answerReports.resolved, false));

    return [...questionReportsList, ...answerReportsList].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async resolveReport(reportId: number, type: 'question' | 'answer'): Promise<void> {
    if (type === 'question') {
      await db.update(questionReports)
        .set({ resolved: true })
        .where(eq(questionReports.id, reportId));
    } else {
      await db.update(answerReports)
        .set({ resolved: true })
        .where(eq(answerReports.id, reportId));
    }
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await db.delete(answers).where(eq(answers.questionId, questionId));
    await db.delete(questionReports).where(eq(questionReports.questionId, questionId));
    await db.delete(questions).where(eq(questions.id, questionId));
  }

  async deleteAnswer(answerId: number): Promise<void> {
    await db.delete(answerReports).where(eq(answerReports.answerId, answerId));
    await db.delete(answers).where(eq(answers.id, answerId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete all answers and their reports
    const userAnswers = await db.select({ id: answers.id }).from(answers).where(eq(answers.userId, userId));
    for (const answer of userAnswers) {
      await db.delete(answerReports).where(eq(answerReports.answerId, answer.id));
    }
    await db.delete(answers).where(eq(answers.userId, userId));

    // Delete all questions and their reports and answers
    const userQuestions = await db.select({ id: questions.id }).from(questions).where(eq(questions.userId, userId));
    for (const question of userQuestions) {
      const questionAnswers = await db.select({ id: answers.id }).from(answers).where(eq(answers.questionId, question.id));
      for (const answer of questionAnswers) {
        await db.delete(answerReports).where(eq(answerReports.answerId, answer.id));
      }
      await db.delete(answers).where(eq(answers.questionId, question.id));
      await db.delete(questionReports).where(eq(questionReports.questionId, question.id));
      await db.delete(questionTags).where(eq(questionTags.questionId, question.id));
    }
    await db.delete(questions).where(eq(questions.userId, userId));
    await db.delete(favorites).where(eq(favorites.userId, userId));

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(desc(tags.createdAt));
  }

  async addFavorite(userId: number, questionId: number): Promise<boolean> {
    try {
      await db.insert(favorites).values({ userId, questionId });
      return true;
    } catch {
      return false;
    }
  }

  async removeFavorite(userId: number, questionId: number): Promise<boolean> {
    const result = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.questionId, questionId)));
    return true;
  }

  async isFavorited(userId: number, questionId: number): Promise<boolean> {
    const [fav] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.questionId, questionId)));
    return !!fav;
  }

  async getUserFavorites(userId: number): Promise<Question[]> {
    return await db.select({ ...questions }).from(favorites)
      .innerJoin(questions, eq(favorites.questionId, questions.id))
      .where(eq(favorites.userId, userId))
      .then(results => results.map(r => r.questions));
  }

  async getComments(questionId: number, answerId?: number): Promise<any[]> {
    let query = db.select({
      ...comments,
      username: users.username,
      grade: users.grade,
    }).from(comments).innerJoin(users, eq(comments.userId, users.id)).where(eq(comments.questionId, questionId));
    
    if (answerId !== undefined) {
      query = query.where(eq(comments.answerId, answerId));
    }
    
    return query.orderBy(desc(comments.createdAt));
  }

  async createComment(questionId: number, userId: number, content: string, answerId?: number): Promise<any> {
    const [comment] = await db.insert(comments).values({ questionId, answerId, userId, content }).returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();
