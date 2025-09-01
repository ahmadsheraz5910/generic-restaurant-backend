import * as zod from "zod";
export const MediaSchema = zod.object({
  id: zod.string().optional(),
  url: zod.string(),
  file: zod.any().nullable(), // File
});

export const UpdateCollectionThumbnailSchema = zod.object({
  thumbnail: MediaSchema.optional().nullable(),
});
export type UpdateCollectionThumbnailSchemaType = zod.infer<
  typeof UpdateCollectionThumbnailSchema
>;
