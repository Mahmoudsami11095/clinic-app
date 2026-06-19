import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(err: any): string {
  if (!err) {
    return 'An unknown error occurred';
  }

  if (typeof err === 'string') {
    return err;
  }

  if (err.extractedMessage) {
    return err.extractedMessage;
  }

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection or try again later.';
    }

    const errorBody = err.error;

    if (errorBody) {
      if (typeof errorBody.message === 'string') {
        return errorBody.message;
      }

      if (errorBody.errors && typeof errorBody.errors === 'object') {
        const messages: string[] = [];
        for (const key in errorBody.errors) {
          if (Object.prototype.hasOwnProperty.call(errorBody.errors, key)) {
            const fieldErrors = errorBody.errors[key];
            if (Array.isArray(fieldErrors)) {
              messages.push(...fieldErrors);
            } else if (typeof fieldErrors === 'string') {
              messages.push(fieldErrors);
            }
          }
        }
        if (messages.length > 0) {
          return messages.join(', ');
        }
      }

      if (typeof errorBody.title === 'string') {
        return errorBody.title;
      }

      if (typeof errorBody === 'string') {
        return errorBody;
      }
    }

    if (err.statusText) {
      return `Error (${err.status}): ${err.statusText}`;
    }

    return `An error occurred with status code ${err.status}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return 'An unknown error occurred';
}
