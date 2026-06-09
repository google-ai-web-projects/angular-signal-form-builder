import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SettingsUpdatedEvent {
  changedKeys: string[];
  newValues: unknown;
  source: string;
}

export interface LanguageChangedEvent {
  locale: string;
  label: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class EventBusService {
  settingsUpdated = new Subject<SettingsUpdatedEvent>();
  languageChanged = new Subject<LanguageChangedEvent>();
}
