import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileUploadDropzone,
  FileUploadButton,
} from "./file-upload";
import { Button, clx } from "@medusajs/ui";
import { Trash as DeleteIcon } from "@medusajs/icons";
import { FileType } from "./file-upload/types";
import * as zod from "zod";

export const MediaSchema = zod
  .object({
    id: zod.string().optional(),
    url: zod.string(),
    file: zod.any().nullable(), // File
  }).nullable()

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
];

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
];
type Value = zod.infer<typeof MediaSchema>;
interface Props {
  value: Value;
  error?: string;
  onChange: (value: Value) => void;
  setError: (type: string, message: string) => void;
  clearError: () => void;
}

export const ImageUploadField = ({
  value,
  error,
  onChange,
  setError,
  clearError,
}: Props) => {
  const { t } = useTranslation();

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f.file.type)
      );

      if (invalidFile) {
        setError(
          "invalid_file",
          t("products.media.invalidFileType", {
            name: invalidFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
          })
        );

        return true;
      }

      return false;
    },
    [t]
  );

  const onUploaded = useCallback(
    (files: FileType[]) => {
      clearError();
      if (hasInvalidFiles(files)) {
        return;
      }
      onChange(files[0]);
    },
    [hasInvalidFiles]
  );

  return (
    <div>
      {value?.url ? (
        <div
          className={clx(
            "overflow-hidden relative w-full h-[280px]  border border-ui-border-strong transition-fg rounded-lg border border-dashed",
            {
              "!border-ui-border-error": !!error,
            }
          )}
        >
          <img
            src={value?.url}
            alt="thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <div className="flex gap-x-2">
              <FileUploadButton
                formats={SUPPORTED_FORMATS}
                multiple={false}
                onUploaded={onUploaded}
              />
              <Button size="small" type="button" onClick={() => onChange(null)}>
                <DeleteIcon />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <FileUploadDropzone
          label={"Upload Image"}
          hint={"Drag and drop your image here or click to upload"}
          hasError={!!error}
          formats={SUPPORTED_FORMATS}
          onUploaded={onUploaded}
          multiple={false}
          className="w-full h-[280px] items-center justify-center"
        />
      )}
    </div>
  );
};
