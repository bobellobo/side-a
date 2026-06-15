import * as S from "effect/Schema";

/* ************************************************ */

export const AddUserAlbumInputSchema = S.Struct({
    userId: S.String,
    discogsAlbumId: S.Number
});

export type AddUserAlbumInput = typeof AddUserAlbumInputSchema.Type;

/* ************************************************ */
