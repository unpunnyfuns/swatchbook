/**
 * Wrap a Terrazzo `Resolver` so every `.apply()` invocation increments
 * a counter. Used by the bench harness to partition `resolver.apply`
 * cost between cell construction and the joint-pair probe — the two
 * resolver-bound phases.
 */
import type { Resolver, TokenNormalized } from '@terrazzo/parser';

export interface CountedResolver {
  resolver: Resolver;
  getCount(): number;
  reset(): void;
}

export function wrapResolver(inner: Resolver): CountedResolver {
  let count = 0;
  const proxied: Resolver = new Proxy(inner, {
    get(target, prop, receiver) {
      if (prop === 'apply') {
        return (tuple: Record<string, string>): Record<string, TokenNormalized> => {
          count++;
          return target.apply(tuple);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  return {
    resolver: proxied,
    getCount: () => count,
    reset: () => {
      count = 0;
    },
  };
}
