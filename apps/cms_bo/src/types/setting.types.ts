import { ConfigurableEntity, IsoDateString, Uuid } from './common.types';

export type CmsSettingValueType = 'string' | 'boolean' | 'integer' | 'json';

export interface CmsSetting extends ConfigurableEntity<Record<string, unknown>> {
  id: Uuid;
  settingKey: string;
  settingValue: string | null;
  type: CmsSettingValueType;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString | null;
}

export interface SaveCmsSettingPayload {
  settingKey: string;
  settingValue: string | null;
  type?: CmsSettingValueType;
  settings?: Record<string, unknown>;
}
