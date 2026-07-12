import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled Exception:', err);

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    status: 'error',
    message: isProduction ? 'An unexpected internal server error occurred.' : err.message,
    // Only send the stack trace if we are developing locally
    ...( !isProduction && { stack: err.stack } )
  });
};