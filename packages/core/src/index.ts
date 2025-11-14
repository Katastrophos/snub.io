/**
 * @snub/core - Universal noise filtering framework
 *
 * Core abstractions and interfaces for the snub.io platform
 */

// Types
export type {
  Signal,
  Content,
  Metadata,
  FilterScore,
  FilterResult,
} from './types/signal'

export type {
  FilterConfig,
  NoiseFilter,
  AdaptiveFilter,
  FilterChain as IFilterChain,
} from './types/filter'

export {
  SignalSource,
  FilterDecision,
} from './types/signal'

// Base implementations
export { BaseFilter } from './filters/base-filter'
export { FilterChain } from './filters/filter-chain'

// Version
export const VERSION = '0.1.0'
