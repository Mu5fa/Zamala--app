import { z } from 'zod';
import { insertQuestionSchema, insertAnswerSchema, insertUserSchema, loginSchema, questions, answers, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(),
      },
    },
  },
  questions: {
    list: {
      method: 'GET' as const,
      path: '/api/questions',
      input: z.object({
        subject: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof questions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/questions',
      input: insertQuestionSchema,
      responses: {
        201: z.custom<typeof questions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/questions/:id',
      responses: {
        200: z.custom<typeof questions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  answers: {
    list: {
      method: 'GET' as const,
      path: '/api/questions/:id/answers',
      responses: {
        200: z.array(z.custom<typeof answers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/questions/:id/answers',
      input: insertAnswerSchema.omit({ questionId: true }),
      responses: {
        201: z.custom<typeof answers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    rate: {
      method: 'PATCH' as const,
      path: '/api/answers/:id/rate',
      responses: {
        200: z.custom<typeof answers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
