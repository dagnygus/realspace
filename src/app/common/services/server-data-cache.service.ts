import { Platform } from "@angular/cdk/platform";
import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { DataCache } from "../../models/models";

@Injectable({ providedIn: 'root' })
export class ServerDataCache implements DataCache {

  constructor(@Inject(DOCUMENT) private _document: Document,
              private _platform: Platform) {}

  setString(key: string, value: string): void {
    if (this._platform.isBrowser) { return; }
    let scriptEl = this._document.getElementById(key) as HTMLScriptElement | null;

    if (scriptEl) {

      if (scriptEl.tagName !== 'SCRIPT') {
        throw new Error('Key is refering to id of HTMLElement what is not script!');
      }

      if (scriptEl.type !== 'application/json') {
        throw new Error('Key is refering to id of HTMLScriptElement what is not a type of \'application/json\'!');
      }

    } else {
      scriptEl = this._document.createElement('script');
      scriptEl.type = 'application/json';
      scriptEl.id = key;
      this._document.body.appendChild(scriptEl);
    }

    scriptEl.textContent = value;
  }

  getString(key: string): string | null {
    const scriptEl = this._document.getElementById(key) as HTMLScriptElement | null;

    if (scriptEl) {
      if (scriptEl.tagName !== 'SCRIPT') {
        throw new Error('Key is refering to id of HTMLElement what is not script!')
      }

      if (scriptEl.type !== 'application/json') {
        throw new Error('Key is refering to id of HTMLScriptElement what is not a type of \'application/json\'!')
      }

      return scriptEl.textContent;
    }

    return null
  }

  setObject<T extends object = object>(key: string, value: T): void {
    if (this._platform.isBrowser) { return; }
    this.setString(key, JSON.stringify(value));
  }

  getObject<T extends object = object>(key: string): T | null {
    const data = this.getString(key);

    if (data) {
      const potentialObject = JSON.parse(data);

      if (typeof potentialObject !== 'object') {
        throw new Error(`Data stored under the key: ${key} is not an object`);
      }

      return potentialObject;
    }

    return null;
  }

  hasKey(key: string): boolean {
    const el = this._document.getElementById(key) as HTMLScriptElement | null;

    if (el && el.tagName === 'SCRIPT' && el.type === 'application/json') {
      return true;
    }

    return false;
  }

  removeKey(key: string): void {
    const el = this._document.getElementById(key) as HTMLScriptElement | null;

    if (el && el.tagName === 'SCRIPT' && el.type === 'application/json') {
      el.parentNode!.removeChild(el);
    }
  }
}
