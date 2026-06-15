import { Eff } from "@/lib/effect/types";
import { AppError, appError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";

import { AddUserAlbumInput } from "./albums.types";

export interface UserAlbumsServiceInterface {
  readonly addAlbumIdForUser: (input: AddUserAlbumInput) => Eff<void, AppError>;
}

export const UserAlbumsService = Context.GenericTag<UserAlbumsServiceInterface>("UserAlbumsService");

export const mockUserAlbumsServiceLayer = Layer.succeed(UserAlbumsService, {
  addAlbumIdForUser: (input) => {
    if (!input.userId) {
      return Effect.fail(appError.unexpected("Missing user id", "Missing signed-in user id."));
    }

    if (!input.discogsAlbumId) {
      return Effect.fail(appError.unexpected("Missing album id", "No selected album id to save."));
    }

    return Effect.void;
  }
});

export const supabaseUserAlbumsServiceLayer = Layer.succeed(UserAlbumsService, {
  addAlbumIdForUser: (input) => pipe(
    Effect.tryPromise({
        try: () => supabase.from("user_albums").insert({
          user_id: input.userId,
          discogs_album_id: input.discogsAlbumId,
        }),
        catch: (cause) => appError.unexpected(cause, "Unable to write album to Supabase.")
    })
  )
});

export const addAlbumIdForUser = (input: AddUserAlbumInput): Eff<void, AppError> =>
  pipe(
    UserAlbumsService,
    Effect.flatMap((service) => service.addAlbumIdForUser(input)),
    Effect.provide(supabaseUserAlbumsServiceLayer)
  );

