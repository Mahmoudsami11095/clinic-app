import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

export function extractErrorMessage(err: any, translateFn?: (key: string) => string): string {
  let msg = 'An unknown error occurred';
  
  if (!err) {
    msg = 'An unknown error occurred';
  } else if (typeof err === 'string') {
    msg = err;
  } else if (err.extractedMessage) {
    msg = err.extractedMessage;
  } else if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      msg = translateFn?.('errors.network') || 'Unable to connect to the server. Please check your internet connection or try again later.';
    } else {
      const errorBody = err.error;
      if (errorBody) {
        if (typeof errorBody.message === 'string' && errorBody.message.trim() !== '') {
          msg = errorBody.message;
          if (typeof errorBody.detail === 'string' && errorBody.detail.trim() !== '' && errorBody.detail !== errorBody.message) {
            const detailSnippet = errorBody.detail.length > 150 ? errorBody.detail.substring(0, 150) + '...' : errorBody.detail;
            msg = `${errorBody.message}: ${detailSnippet}`;
          }
        } else if (errorBody.errors && typeof errorBody.errors === 'object') {
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
            msg = messages.join(', ');
          }
        } else if (typeof errorBody.title === 'string' && errorBody.title.trim() !== '') {
          msg = errorBody.title;
        } else if (typeof errorBody === 'string' && errorBody.trim() !== '') {
          msg = errorBody;
        }
      }

      // If no descriptive message was in the body, map standard HTTP statuses
      if (!msg || msg === 'An unknown error occurred') {
        if (err.status === 400) {
          msg = translateFn?.('errors.validation') || 'Please check your input for validation errors.';
        } else if (err.status === 401) {
          msg = translateFn?.('errors.unauthorized') || 'Your session has expired. Please log in again.';
        } else if (err.status === 403) {
          msg = translateFn?.('errors.forbidden') || 'You do not have permission to perform this action.';
        } else if (err.status === 404) {
          msg = translateFn?.('errors.not_found') || 'The requested resource was not found.';
        } else if (err.status === 429) {
          msg = translateFn?.('errors.rate_limit') || 'Too many requests. Please try again later.';
        } else if (err.status >= 500) {
          msg = translateFn?.('errors.server') || 'An unexpected server error occurred. Please try again later.';
        } else if (err.statusText) {
          msg = `Error (${err.status}): ${err.statusText}`;
        } else {
          msg = `An error occurred with status code ${err.status}`;
        }
      }
    }
  } else if (err instanceof Error) {
    msg = err.message;
  } else if (err.message && typeof err.message === 'string') {
    msg = err.message;
  }

  // Attempt to translate the message if TranslateService is provided
  if (translateFn && msg) {
    const key = `api_errors.${msg}`;
    const translated = translateFn(key);
    if (translated && translated.trim() !== '' && translated !== key) {
      return translated;
    }
    // Fallback: Check root translation if api_errors is not prefixed
    const rootTranslated = translateFn(msg);
    if (rootTranslated && rootTranslated.trim() !== '' && rootTranslated !== msg) {
      return rootTranslated;
    }
  }

  return msg || 'An unexpected error occurred. Please try again.';
}
