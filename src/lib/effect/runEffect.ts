import { runPromise } from "effect/Effect";
import { Eff } from "./types";

export const runEffectPromise = <A, E>(program: Eff<A, E, never>): Promise<A> => 
    runPromise(program);
