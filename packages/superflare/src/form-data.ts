import { streamMultipart } from "@web3-storage/multipart-parser";

/**
 * Copied from Remix:
 * @see https://github.com/remix-run/remix/blob/72c22b3deb9e84e97359b481f7f2af6cdc355877/packages/remix-server-runtime/formData.ts
 * Copyright 2021 Remix Software Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export type UploadHandlerPart = {
  name: string;
  filename?: string;
  contentType: string;
  data: AsyncIterable<Uint8Array>;
  stream: ReadableStream<Uint8Array>;
};

export type UploadHandler = (
  part: UploadHandlerPart
) => Promise<File | string | null | undefined>;

/**
 * Allows you to handle multipart forms (file uploads) for your app.
 */
export async function parseMultipartFormData(
  request: Request,
  uploadHandler: UploadHandler
): Promise<FormData> {
  let contentType = request.headers.get("Content-Type") || "";
  const [type, boundary] = contentType.split(/\s*;\s*boundary=/);

  if (!request.body || !boundary || type !== "multipart/form-data") {
    throw new TypeError("Could not parse content as FormData.");
  }

  const formData = new FormData();
  const parts: AsyncIterable<UploadHandlerPart & { done?: true }> =
    streamMultipart(request.body, boundary);

  for await (let part of parts) {
    if (part.done) break;

    if (typeof part.filename === "string") {
      // only pass basename as the multipart/form-data spec recommends
      // https://datatracker.ietf.org/doc/html/rfc7578#section-4.2
      part.filename = part.filename.split(/[/\\]/).pop();
    }

    /**
     * Build a convenience ReadableStream for the part data.
     */
    const stream = new ReadableStream({
      async pull(controller) {
        for await (let chunk of part.data) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    let value = await uploadHandler({
      ...part,
      stream,
    });
    if (typeof value !== "undefined" && value !== null) {
      formData.append(part.name, value as any);
    }
  }

  return formData;
}
