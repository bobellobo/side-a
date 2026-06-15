import { Eff } from "@/lib/effect/types";
import { AppError, appError } from "@/lib/errors";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";

import { DiscogsReleases, DiscogsSearchInput } from "./discogs.types";

export interface DiscogsServiceInterface {
  readonly searchReleases: (input: DiscogsSearchInput) => Eff<DiscogsReleases, AppError>;
}

export const DiscogsService = Context.GenericTag<DiscogsServiceInterface>("DiscogsService");

const mockDiscogsResults: DiscogsReleases = [
  { discogsId: 1453365, title: "Daft Punk - Discovery"  , year: "2001", country: "France" },
  { discogsId: 1123778, title: "Nirvana - Nevermind"    , year: "1991", country: "US"     },
  { discogsId: 2495040, title: "Kendrick Lamar - DAMN." , year: "2017", country: "US"     },
  { discogsId: 507569 , title: "Radiohead - OK Computer", year: "1997", country: "UK"     }
];

export const mockDiscogsServiceLayer = Layer.succeed(DiscogsService, {
  searchReleases: (input) => {
    const normalizedQuery = input.query.trim().toLowerCase();

    if (!normalizedQuery) {
      return Effect.fail(appError.unexpected("Missing query", "Search query is required."));
    }

    return Effect.succeed(
      mockDiscogsResults.filter((release) =>
        release.title.toLowerCase().includes(normalizedQuery)
      )
    );
  }
});

export const discogsApiServiceLayer = Layer.succeed(DiscogsService, {
  searchReleases: (input) =>
    Effect.gen(function* () {
      const token = process.env.EXPO_PUBLIC_DISCOGS_TOKEN;

      if (!token) {
        return yield* Effect.fail(
          appError.missingEnv("Missing EXPO_PUBLIC_DISCOGS_TOKEN for Discogs API requests."),
        );
      }

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(
            `https://api.discogs.com/database/search?q=${encodeURIComponent(input.query)}&type=release`,
            {
              headers: {
                Authorization: `Discogs token=${token}`,
              },
            },
          ),
        catch: (cause) => appError.unexpected(cause, "Unable to reach Discogs API."),
      });

      if (!response.ok) {
        return yield* Effect.fail(appError.http(response.status, "Discogs API request failed."));
      }

      // Future implementation: decode response payload and map to DiscogsRelease[].
      return [] as DiscogsReleases;
    }),
});


export const searchDiscogsReleases = (input: DiscogsSearchInput,): Eff<DiscogsReleases, AppError> => pipe(
    DiscogsService,
    Effect.flatMap((service) => service.searchReleases(input)),
    Effect.provide(mockDiscogsServiceLayer)
);
