import { ChangeEvent, useRef } from "react";
import { FileType } from "./types";
import { Button } from "@medusajs/ui";
import { Pencil } from "@medusajs/icons";

type Props = {
  formats: string[];
  multiple: boolean;
  onUploaded: (files: FileType[]) => void;
};

export const FileUploadButton = ({ formats, multiple, onUploaded }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleOpenFileSelector = () => {
    inputRef.current?.click();
  };

  const handleUploaded = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const fileList = Array.from(files);
    const fileObj = fileList.map((file) => {
      const id = Math.random().toString(36).substring(7);

      const previewUrl = URL.createObjectURL(file);
      return {
        id: id,
        url: previewUrl,
        file,
      };
    });

    onUploaded(fileObj);
  };
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    handleUploaded(event.target.files);
  };
  return (
    <div>
      <Button type='button' size="small" onClick={handleOpenFileSelector}>
        <Pencil />
      </Button>
      <input
        hidden
        ref={inputRef}
        onChange={handleFileChange}
        type="file"
        accept={formats.join(",")}
        multiple={multiple}
      />
    </div>
  );
};

