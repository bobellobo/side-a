import { AppError, appError } from "@/lib/errors/appError";
import { pipe } from "effect";
import { catchAll, fail, flatMap, timeoutFail } from "effect/Effect";
import { sleep } from "effect/TestClock";
import { Eff } from "./types";

export type NetworkPolicyConfig = {
  timeoutMs  : number;
  maxRetries : number;
  baseDelayMs: number;
};

type AppErrorEff<A, R> = Eff<A, AppError, R>;

const defaultNetworkPolicy: NetworkPolicyConfig = {
  timeoutMs  : 7_000,
  maxRetries : 2,
  baseDelayMs: 300
};

const isRetryableAppError = (error: AppError): boolean => 
  error._tag === "TimeoutError" || error._tag === "UnexpectedError"

const stopRetry = (attempt: number, maxRetries: number) => (error: AppError): boolean => 
    !isRetryableAppError(error) || attempt >= maxRetries;

const exponentialBackoffDelay = (attempt: number, baseDelayMs: number): number =>
    baseDelayMs * 2 ** attempt;


const retryWithBackoff = 
    <A, R>(maxRetries: number, baseDelayMs: number) => 
        (program: AppErrorEff<A, R>) : AppErrorEff<A, R> => {

        const loop = (attempt: number): AppErrorEff<A, R> => pipe(
            program,
            catchAll( error => 
                stopRetry(attempt, maxRetries)(error)
                    ? fail(error)
                    : pipe(
                        sleep(`${exponentialBackoffDelay(attempt, baseDelayMs)} millis`),
                        flatMap(() => loop(attempt + 1))
                    )
            )
        )
        return loop(0);
    };

export const withNetworkPolicy = <A, R>(config: Partial<NetworkPolicyConfig> = {}) => 
    (program: AppErrorEff<A, R>): AppErrorEff<A, R> => {

        const merged: NetworkPolicyConfig = {
            ...defaultNetworkPolicy,
            ...config,
        };

        return pipe(
            program, 
            timeoutFail({
                duration: `${merged.timeoutMs} millis`,
                onTimeout: () => appError.timeout("Network request timed out"),
            }),
            retryWithBackoff(merged.maxRetries, merged.baseDelayMs)
        );
    };


