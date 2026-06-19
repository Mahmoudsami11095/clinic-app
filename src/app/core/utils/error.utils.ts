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
      msg = 'Unable to connect to the server. Please check your internet connection or try again later.';
    } else {
      const errorBody = err.error;
      if (errorBody) {
        if (typeof errorBody.message === 'string') {
          msg = errorBody.message;
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
        } else if (typeof errorBody.title === 'string') {
          msg = errorBody.title;
        } else if (typeof errorBody === 'string') {
          msg = errorBody;
        }
      } else if (err.statusText) {
        msg = `Error (${err.status}): ${err.statusText}`;
      } else {
        msg = `An error occurred with status code ${err.status}`;
      }
    }
  } else if (err instanceof Error) {
    msg = err.message;
  } else if (err.message && typeof err.message === 'string') {
    msg = err.message;
  }

  // Attempt to translate the message if TranslateService is provided
  if (translateFn) {
    const key = `api_errors.${msg}`;
    const translated = translateFn(key);
    if (translated !== key) {
      return translated;
    }
    // Fallback: Check root translation if api_errors is not prefixed
    const rootTranslated = translateFn(msg);
    if (rootTranslated !== msg) {
      return rootTranslated;
    }
  }

  return msg;
}
