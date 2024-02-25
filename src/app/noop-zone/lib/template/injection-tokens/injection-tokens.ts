import { Priority } from '../../core';
import { FactoryProvider, InjectOptions, InjectionToken, ValueProvider, inject } from "@angular/core";
import { Observable } from 'rxjs';

const _injectOptions: InjectOptions & { optional: true } = { optional: true, skipSelf: true }

export interface QueryView {
  readonly onCheckRequested: Observable<void>;
  readonly onCheckAborted: Observable<void>;
  readonly onCheckDone: Observable<void>;
  readonly onCheckStart: Observable<void>;
  notify(scope: object): void;
  register(item: QueryViewItem): void;
  unregister(item: QueryViewItem): void;
  dismiss(scope: object): void;
  isCheckRequested(): boolean;
  isChecking(): boolean;
}

export interface QueryViewItem {
  onBeforeQueryViewCheck(): void;
  onAfterQueryViewCheck(): void;
  onQueryViewCheckRequested(): void;
  onQueryViewCheckAborted(): void;
}


export interface NzIfConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  optimized?: boolean;
}

export interface NzLetConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  detach?: boolean;
  optimized?: boolean;
  syncCreation?: boolean;
}

export interface NzDetachedViewConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  syncCreation?: boolean;
}

export interface NzQueryViewConfiguration {
  defaultPriority?: Priority;
  syncCreation?: boolean;
}

export interface NzForConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  optimized?: boolean;
}

export interface NzSwitchConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  optimized?: boolean;
}

export interface NzLocalViewConfiguration {
  defaultPriority?: Priority;
  notifyQueryView?: boolean;
  syncCreation?: boolean;
}

// export const NZ_CD_REF_PROVIDER = new InjectionToken<CdRefProvider>('NZ_CD_REF_PROVIDER');
export const NZ_QUERY_VIEW = new InjectionToken<QueryView>('NZ_QUERY_VIEW');
// export const NZ_DETACHED_VIEW = new InjectionToken<DetachedView>('NZ_DETACHED_VIEW');

export const NZ_IF_CONFIG = new InjectionToken<NzIfConfiguration>('NZ_IF_CONFIG');
export const NZ_LET_CONFIG = new InjectionToken<NzLetConfiguration>('NZ_LET_CONFIG');
export const NZ_DETACHED_VIEW_CONFIG = new InjectionToken<NzDetachedViewConfiguration>('NZ_DETACHED_VIEW_CONFIG');
export const NZ_QUERY_VIEW_CONFIG = new InjectionToken<NzQueryViewConfiguration>('NZ_QUERY_VIEW_CONFIGURATION');
export const NZ_FOR_CONFIG = new InjectionToken<NzForConfiguration>('NZ_FOR_CONFIG');
export const NZ_SWITCH_CONFIG = new InjectionToken<NzSwitchConfiguration>('NZ_SWITCH_CONFIG');
export const NZ_LOCAL_VIEW_CONFIG = new InjectionToken<NzLocalViewConfiguration>('NZ_LOCAL_VIEW_CONFIG');
export const NZ_IN_PIPE_DEFAULT_PRIORITY = new InjectionToken<Priority>('NZ_IN_PIPE_DEFAULT_PRIORITY');
// export const NZ_LAZY_VIEW_CONFIG = new InjectionToken<NzQueryViewConfiguration>('NZ_LAZY_VIEW_CONFIGURATION');

export function provideNzIfConfiguration(config: NzIfConfiguration): FactoryProvider {
  return {
    provide: NZ_IF_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_IF_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzLetConfiguration(config: NzLetConfiguration): FactoryProvider {
  return {
    provide: NZ_LET_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_LET_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzDetachedViewConfiguration(config: NzDetachedViewConfiguration): FactoryProvider {
  return {
    provide: NZ_DETACHED_VIEW_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_DETACHED_VIEW_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzQueryViewConfiguration(config: NzQueryViewConfiguration): FactoryProvider {
  return {
    provide: NZ_QUERY_VIEW_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_QUERY_VIEW_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzForConfiguration(config: NzForConfiguration): FactoryProvider {
  return {
    provide: NZ_FOR_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_FOR_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzSwitchConfiguration(config: NzSwitchConfiguration): FactoryProvider {
  return {
    provide: NZ_SWITCH_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_SWITCH_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function provideNzLocalViewConfiguration(config: NzLocalViewConfiguration): FactoryProvider {
  return {
    provide: NZ_LOCAL_VIEW_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_LOCAL_VIEW_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  };
}

export function inPipeDefaultPriority(priority: Priority): ValueProvider {
  return {
    provide: NZ_IN_PIPE_DEFAULT_PRIORITY,
    useValue: priority
  };
}

// export function provideNzLazyViewConfiguration(config: NzLazyViewConfiguration): ValueProvider {
//   return { provide: NZ_LAZY_VIEW_CONFIG, useValue: config };
// }
