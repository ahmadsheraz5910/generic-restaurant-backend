import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileUploadDropzone,
  FileUploadButton,
} from "../../components/file-upload";
import { Form } from "../../components/Form";
import { UseFormReturn } from "react-hook-form";
import { Button, clx } from "@medusajs/ui";
import { Trash as DeleteIcon } from "@medusajs/icons";
import { FileType } from "../../components/file-upload/types";
import { UpdateCollectionThumbnailSchemaType } from "./constants";
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
interface Props {
  form: UseFormReturn<UpdateCollectionThumbnailSchemaType>;
}

export const FileUploadFormItem = ({ form }: Props) => {
  const { t } = useTranslation();

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f.file.type)
      );

      if (invalidFile) {
        form.setError("thumbnail", {
          type: "invalid_file",
          message: t("products.media.invalidFileType", {
            name: invalidFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
          }),
        });

        return true;
      }

      return false;
    },
    [form, t]
  );

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors("thumbnail");
      if (hasInvalidFiles(files)) {
        return;
      }

      form.setValue("thumbnail", files[0], {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form, hasInvalidFiles]
  );

  return (
    <Form.Field
      control={form.control}
      name="thumbnail"
      render={({ field }) => {
        return (
          <Form.Item>
            <div className="flex flex-col gap-y-2">
              <Form.Control>
                <div>
                  {field.value?.url ? (
                    <div
                      className={clx(
                        "overflow-hidden relative w-full h-[280px]  border border-ui-border-strong transition-fg rounded-lg border border-dashed",
                        {
                          "!border-ui-border-error":
                            !!form.formState.errors.thumbnail,
                        }
                      )}
                    >
                      <img
                        src={field.value?.url}
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
                          <Button
                            size="small"
                            type='button'
                            onClick={() => field.onChange(null)}
                          >
                            <DeleteIcon />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FileUploadDropzone
                      label={"Upload Image"}
                      hint={"Drag and drop your image here or click to upload"}
                      hasError={!!form.formState.errors.thumbnail}
                      formats={SUPPORTED_FORMATS}
                      onUploaded={onUploaded}
                      multiple={false}
                      className="w-full h-[280px] items-center justify-center"
                    />
                  )}
                </div>
              </Form.Control>
              <Form.ErrorMessage />
            </div>
          </Form.Item>
        );
      }}
    />
  );
};
