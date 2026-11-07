import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { STATUS_CODES } from 'node:http';

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const rawMessage = typeof body === 'string' ? body
        : typeof body === 'object' && body !== null && 'message' in body ? body.message
        : STATUS_CODES[status] ?? 'Error';
      messages = Array.isArray(rawMessage)
        ? rawMessage.map(String)
        : [String(rawMessage)];
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        messages = ['Рецепт не найден'];
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        messages = ['Запись уже существует'];
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        messages = ['Нарушена связь данных'];
      }
    }

    response.status(status).json({
      statusCode: status,
      error: STATUS_CODES[status] ?? 'Error',
      message: messages,
    });
  }
}
