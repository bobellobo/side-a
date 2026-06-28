import { Eff } from "@/lib/effect/types";
import { DiscogsError, unexpectedError } from "@/lib/errors";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";

import { DiscogsReleases, DiscogsSearchInput } from "./discogs.types";

export interface DiscogsServiceInterface {
  readonly searchReleases: (input: DiscogsSearchInput) => Eff<DiscogsReleases, DiscogsError>;
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
      return Effect.fail(unexpectedError("Search query is required.", "Missing query"));
    }

    return Effect.succeed(
      mockDiscogsResults.filter((release) =>
        release.title.toLowerCase().includes(normalizedQuery)
      )
    );
  }
});


export const searchDiscogsReleases = (input: DiscogsSearchInput,): Eff<DiscogsReleases, DiscogsError> => pipe(
    DiscogsService,
    Effect.flatMap((service) => service.searchReleases(input)),
    Effect.provide(mockDiscogsServiceLayer)
);
