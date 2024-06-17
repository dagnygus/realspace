import { Priority } from '../../core';
import { FactoryProvider, InjectOptions, InjectionToken, ValueProvider, inject } from "@angular/core";

const _injectOptions: InjectOptions & { optional: true } = { optional: true, skipSelf: true }

export interface NzIfConfiguration {
  defaultPriority?: Priority;
  optimized?: boolean;
}

export interface SigIfConfiguration {
  defaultPriority?: Priority;
}

export interface SigForConfiguration {
  defaultPriority?: Priority;
}

export interface NzLetConfiguration {
  defaultPriority?: Priority;
  detach?: boolean;
  optimized?: boolean;
  syncCreation?: boolean;
}

export interface NzWatchConfiguration {
  defaultPriority?: Priority,
  detach?: boolean,
  asapCreation?: boolean
}

export interface NzDetachedViewConfiguration {
  defaultPriority?: Priority;
  syncCreation?: boolean;
}

export interface NzForConfiguration {
  defaultPriority?: Priority;
  optimized?: boolean;
}

export interface NzSwitchConfiguration {
  defaultPriority?: Priority;
  optimized?: boolean;
}

export interface SigSwitchConfiguration {
  defaultPriority?: Priority
}

export interface NzLocalViewConfiguration {
  defaultPriority?: Priority;
  syncCreation?: boolean;
}


export const NZ_IF_CONFIG = new InjectionToken<NzIfConfiguration>('NZ_IF_CONFIG');
export const SIG_IF_CONFIG = new InjectionToken<SigIfConfiguration>('SIG_IF_CONFIG');
export const NZ_LET_CONFIG = new InjectionToken<NzLetConfiguration>('NZ_LET_CONFIG');
export const NZ_WATCH_CONFIG = new InjectionToken<NzWatchConfiguration>('NZ_WATCH_CONFIG')
export const NZ_DETACHED_VIEW_CONFIG = new InjectionToken<NzDetachedViewConfiguration>('NZ_DETACHED_VIEW_CONFIG');
export const NZ_FOR_CONFIG = new InjectionToken<NzForConfiguration>('NZ_FOR_CONFIG');
export const SIG_FOR_CONFIG = new InjectionToken<SigForConfiguration>('SIG_FOR_CONFIG')
export const NZ_SWITCH_CONFIG = new InjectionToken<NzSwitchConfiguration>('NZ_SWITCH_CONFIG');
export const SIG_SWITCH_CONFIG = new InjectionToken<SigSwitchConfiguration>('SIG_SWITCH_CONFIG');
export const NZ_LOCAL_VIEW_CONFIG = new InjectionToken<NzLocalViewConfiguration>('NZ_LOCAL_VIEW_CONFIG');
export const NZ_IN_PIPE_DEFAULT_PRIORITY = new InjectionToken<Priority>('NZ_IN_PIPE_DEFAULT_PRIORITY');

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

export function provideSigIfConfiguration(config: SigIfConfiguration): FactoryProvider {
  return {
    provide: SIG_IF_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_IF_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config
    }
  }
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

export function provideNzWatchConfiguration(config: NzWatchConfiguration): FactoryProvider {
  return {
    provide: NZ_WATCH_CONFIG,
    useFactory: () => {
      const currentConfig = inject(NZ_WATCH_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  }
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

export function provideSigForConfiguration(config: SigForConfiguration): FactoryProvider {
  return {
    provide: SIG_FOR_CONFIG,
    useFactory: () => {
      const currentConfig = inject(SIG_FOR_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config };
      }

      return config;
    }
  }
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

export function provideSigSwitchConfiguration(config: SigSwitchConfiguration): FactoryProvider {
  return {
    provide: SIG_SWITCH_CONFIG,
    useFactory: () => {
      const currentConfig = inject(SIG_SWITCH_CONFIG, _injectOptions);

      if (currentConfig) {
        return { ...currentConfig, ...config }
      }

      return config;
    }
  }
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
