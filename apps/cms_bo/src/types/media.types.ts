import { ConfigurableEntity, IsoDateString, Uuid } from './common.types';
import { UserSummary } from './auth.types';

export type FileTypeEnum =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other';

export interface AbstractFile extends ConfigurableEntity<Record<string, unknown>> {
  id: Uuid;
  originalName: string;
  niceName: string | null;
  filePath: string;
  mimeType: string;
  type: FileTypeEnum | null;
  extension: string;
  size: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
  isPinned: boolean;
}

export interface PostMedia extends AbstractFile {
  owner: UserSummary | null;
  alt: string | null;
}

export interface UploadPostMediaPayload {
  file: File;
  alt?: string;
  niceName?: string;
  isPinned?: boolean;
}