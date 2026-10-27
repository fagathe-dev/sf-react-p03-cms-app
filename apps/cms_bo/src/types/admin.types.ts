// src/types/admin.types.ts
// Outils Super Admin : aperçu des e-mails (EmailPreviewController) et logs de l'API (LogController)

// --- Aperçu des e-mails ---

export interface EmailAddress {
  name: string | null;
  email: string;
}

export interface EmailPreview {
  slug: string;
  label: string;
  description: string;
  subject: string | null;
  from: EmailAddress[];
  to: EmailAddress[];
}

// --- Logs (Fagathe\CorePhp\Logger, lus par LogViewerService) ---

export type LogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical';

export interface LogFileNode {
  type: 'file';
  name: string;
  /** Chemin pointé, ex: service.post-service */
  path: string;
}

export interface LogFolderNode {
  type: 'folder';
  name: string;
  path: string;
  children: LogNode[];
}

export type LogNode = LogFileNode | LogFolderNode;

export interface LogDate {
  /** Format dd-mm-yyyy */
  date: string;
  count: number;
  items: LogNode[];
}

export interface LogStackFrame {
  file: string | null;
  line: number | null;
  class: string | null;
  type: string | null;
  function: string;
}

/** Exception normalisée par ThrowableNormalizer (core-php) */
export interface LogException {
  class: string;
  message: string;
  code: number | string;
  file: string;
  line: number;
  trace: LogStackFrame[];
  truncated_frames?: number;
  previous?: LogException;
}

export interface LogEntry {
  id: string | number | null;
  level: LogLevel | null;
  /** ISO 8601 */
  timestamp: string | null;
  content: Record<string, unknown>;
  context: Record<string, unknown>;
}
