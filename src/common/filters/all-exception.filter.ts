import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolveException(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status}: ${
          Array.isArray(message) ? message.join(', ') : message
        }`,
      );
    }

    if (response.headersSent) {
      return;
    }

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    // 404
    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Сущность не найдена',
        error: 'Not Found',
      };
    }

    // код 23505, 409 иначе 500
    if (exception instanceof QueryFailedError) {
      const driverError = (
        exception as QueryFailedError & {
          driverError?: { code?: string; detail?: string };
        }
      ).driverError;

      if (driverError?.code === '23505') {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Ресурс с такими данными уже существует',
          error: 'Conflict',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка базы данных',
        error: 'Internal Server Error',
      };
    }

    // сохраняем статус
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      let message: string | string[];
      if (typeof response === 'string') {
        message = response;
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const raw = (response as { message: string | string[] }).message;
        message = Array.isArray(raw) ? raw : String(raw);
      } else {
        message = exception.message;
      }

      // 413
      if (status === (HttpStatus.PAYLOAD_TOO_LARGE as number)) {
        return {
          status,
          message: message || 'Файл слишком большой',
          error: 'Payload Too Large',
        };
      }

      return {
        status,
        message,
        error: exception.name.replace(/Exception$/, '') || 'Error',
      };
    }

    // 4. Fallback — 500 (при необходимости)
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
      error: 'Internal Server Error',
    };
  }
}
