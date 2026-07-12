import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * Middleware to strictly validate and sanitize incoming request data.
 * It strips unknown fields automatically if the schema is defined correctly.
 */
export const validate = (schema: ZodObject) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse will automatically strip unrecognized keys if we don't explicitly allow them
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
         res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues.map(e => ({ field: e.path.join('.'), issue: e.message }))
        });
        return;
      }
      next(error);
    }
};