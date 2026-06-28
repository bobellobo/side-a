import { Eff } from "@/lib/effect/types";
import { DatabaseError, unexpectedError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";

import { AddUserAlbumInput } from "./albums.types";

export interface UserAlbumsServiceInterface {
  readonly addAlbumIdForUser: (input: AddUserAlbumInput) => Eff<void, DatabaseError>;
}

export const UserAlbumsService = Context.GenericTag<UserAlbumsServiceInterface>("UserAlbumsService");

export const supabaseUserAlbumsServiceLayer = Layer.succeed(UserAlbumsService, {
  addAlbumIdForUser: (input) => pipe(
    Effect.tryPromise({
        try: () => supabase.from("user_albums").insert({
          user_id: input.userId,
          discogs_album_id: input.discogsAlbumId,
        }),
        catch: (cause) => unexpectedError("Unable to write album to Supabase.", cause)
    })
  )
});

export const addAlbumIdForUser = (input: AddUserAlbumInput): Eff<void, DatabaseError> =>
  pipe(
    UserAlbumsService,
    Effect.flatMap((service) => service.addAlbumIdForUser(input)),
    Effect.provide(supabaseUserAlbumsServiceLayer)
  );

