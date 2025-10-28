/**
 * Error Handling Utilities
 * 
 * Centralized error handling with user-friendly messages and error codes.
 * Provides consistent error handling throughout the application.
 */

export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  FFMPEG_FAILED = 'FFMPEG_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMELINE_ERROR = 'TIMELINE_ERROR',
  MEDIA_ERROR = 'MEDIA_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Application error with user-friendly messaging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Convert unknown errors to AppError
 */
export const toAppError = (error: unknown, context?: string): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Parse common error patterns
  if (errorMessage.includes('No such file') || errorMessage.includes('FILE_NOT_FOUND')) {
    return new AppError(
      errorMessage,
      'The selected file could not be found. It may have been moved or deleted.',
      ErrorCode.FILE_NOT_FOUND,
      false,
      { context, originalError: error }
    );
  }
  
  if (errorMessage.includes('permission denied') || errorMessage.includes('PERMISSION_DENIED')) {
    return new AppError(
      errorMessage,
      'Permission denied. Please check file permissions and try again.',
      ErrorCode.PERMISSION_DENIED,
      true,
      { context, originalError: error }
    );
  }
  
  if (errorMessage.includes('FFmpeg') || errorMessage.includes('FFMPEG')) {
    return new AppError(
      errorMessage,
      'Video processing failed. The file may be corrupted or in an unsupported format.',
      ErrorCode.FFMPEG_FAILED,
      true,
      { context, originalError: error }
    );
  }
  
  // Default unknown error
  return new AppError(
    errorMessage,
    'An unexpected error occurred. Please try again.',
    ErrorCode.UNKNOWN,
    true,
    { context, originalError: error }
  );
};

/**
 * Handle error with logging and optional user notification
 */
export const handleError = (error: unknown, context: string): void => {
  const appError = toAppError(error, context);
  
  // Always log to console
  console.error(`[${context}]`, {
    message: appError.message,
    userMessage: appError.userMessage,
    code: appError.code,
    recoverable: appError.recoverable,
    context: appError.context,
  });
  
  // TODO: Send to error tracking service (Sentry, etc.)
};

/**
 * Create specific error types
 */
export const createFileNotFoundError = (filePath: string): AppError => {
  return new AppError(
    `File not found: ${filePath}`,
    'The video file could not be found. It may have been moved or deleted.',
    ErrorCode.FILE_NOT_FOUND,
    false,
    { filePath }
  );
};

export const createFFmpegError = (stderr: string): AppError => {
  return new AppError(
    `FFmpeg error: ${stderr}`,
    'Video processing failed. The file may be corrupted or in an unsupported format.',
    ErrorCode.FFMPEG_FAILED,
    true,
    { stderr }
  );
};

export const createValidationError = (message: string, field?: string): AppError => {
  return new AppError(
    `Validation error: ${message}`,
    message,
    ErrorCode.VALIDATION_ERROR,
    true,
    { field }
  );
};
