import * as e from "effect/Effect";
export type Eff<A, E = never, R = never> = e.Effect<A, E, R>;