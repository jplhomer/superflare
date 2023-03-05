import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import React from "react";
import { Fence } from "./components/Fence";

export function renderMarkdoc(content: RenderableTreeNode) {
  return Markdoc.renderers.react(content, React, {
    components: {
      Fence,
    },
  });
}
