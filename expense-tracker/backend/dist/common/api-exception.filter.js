var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, } from '@nestjs/common';
import { ConfigurationError } from '../model-client.js';
let ApiExceptionFilter = class ApiExceptionFilter {
    catch(exception, host) {
        const response = host.switchToHttp().getResponse();
        let status = 502;
        let message = exception instanceof Error
            ? exception.message
            : 'Agent request failed.';
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
            }
            else if (typeof body === 'object' && body !== null) {
                const details = body.message;
                message = Array.isArray(details)
                    ? details.join(' ')
                    : typeof details === 'string'
                        ? details
                        : message;
            }
        }
        else if (exception instanceof TypeError || exception instanceof SyntaxError) {
            status = 400;
        }
        else if (exception instanceof ConfigurationError) {
            status = 503;
        }
        else if (typeof exception === 'object' && exception !== null) {
            const errorStatus = exception.status
                ?? exception.statusCode;
            if (typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus <= 599) {
                status = errorStatus;
            }
        }
        response.status(status).json({ error: message });
    }
};
ApiExceptionFilter = __decorate([
    Catch()
], ApiExceptionFilter);
export { ApiExceptionFilter };
