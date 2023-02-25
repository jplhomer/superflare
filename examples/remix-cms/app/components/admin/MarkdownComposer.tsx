import {
  type ClipboardEventHandler,
  type DragEventHandler,
  useCallback,
  useRef,
} from "react";
import TextareaMarkdown, {
  type TextareaMarkdownRef,
} from "textarea-markdown-editor";

/**
 * MarkdownComposer is a wrapper around the [`TextareaMarkdown`](https://github.com/Resetand/textarea-markdown-editor) component.
 * It installs a listener for pasting or dragging-and-dropping images and allows you to hook into the upload process.
 */
export default function MarkdownComposer({
  onInsertImage,
  ...props
}: {
  /**
   * @param file The incoming file to upload.
   * @returns A URL string to the uploaded file.
   */
  onInsertImage?: (file: File) => Promise<string>;
} & React.ComponentProps<typeof TextareaMarkdown>) {
  const ref = useRef<TextareaMarkdownRef>(null);

  const print = useCallback((text: string) => {
    const textarea = ref.current;
    const cursor = textarea?.cursor;
    if (!cursor) {
      console.log("no cursor!");
      return;
    }
    cursor.insert(`${cursor.MARKER}${text}${cursor.MARKER}`);
  }, []);

  const upload = useCallback(
    async (file: File) => {
      if (!onInsertImage) return;
      print(`![${file!.name}](Uploading...)`);
      const url = await onInsertImage(file);
      print(`![${file.name}](${url})`);
    },
    [onInsertImage, print]
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    async (event) => {
      const files = event.clipboardData?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.indexOf("image") !== -1) {
            upload(file);
            event.preventDefault();
          }
        }
      }
    },
    [upload]
  );

  const onDrop = useCallback<DragEventHandler<HTMLTextAreaElement>>(
    async (event) => {
      const files = event.dataTransfer?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.indexOf("image") !== -1) {
            upload(file);
            event.preventDefault();
          }
        }
      }
    },
    [upload]
  );

  return (
    <TextareaMarkdown onPaste={onPaste} onDrop={onDrop} ref={ref} {...props} />
  );
}
