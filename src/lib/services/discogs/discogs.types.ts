import * as S from "effect/Schema";


/* ************************************************ */

export const DiscogsSearchInputSchema = S.Struct({
  query: S.String
});

export type DiscogsSearchInput = typeof DiscogsSearchInputSchema.Type;

/* ************************************************ */

export const DiscogsReleaseSchema = S.Struct({
    discogsId: S.Number,
    title: S.String,
    year: S.String,
    country: S.String
});

export type DiscogsRelease = typeof DiscogsReleaseSchema.Type;

/* ************************************************ */

export type DiscogsReleases = ReadonlyArray<DiscogsRelease>;

/* ************************************************ */

