import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigurationError } from '../model-client.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let status = 502;
    let message = exception instanceof Error
      ? exception.message
      : 'Agent request failed.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const details = (body as { message?: unknown }).message;
        message = Array.isArray(details)
          ? details.join(' ')
          : typeof details === 'string'
            ? details
            : message;
      }
    } else if (exception instanceof TypeError || exception instanceof SyntaxError) {
      status = 400;
    } else if (exception instanceof ConfigurationError) {
      status = 503;
    } else if (typeof exception === 'object' && exception !== null) {
      const errorStatus = (exception as { status?: unknown; statusCode?: unknown }).status
        ?? (exception as { statusCode?: unknown }).statusCode;
      if (typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus <= 599) {
        status = errorStatus;
      }
    }

    response.status(status).json({ error: message });
  }
}