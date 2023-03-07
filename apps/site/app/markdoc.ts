import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";
import React from "react";
import { Fence } from "./components/Fence";
import { Callout } from "./components/Callout";
import { QuickLink, QuickLinks } from "./components/QuickLinks";

export function renderMarkdoc(content: RenderableTreeNode) {
  return Markdoc.renderers.react(content, React, {
    components: {
      Fence,
      QuickLink,
      QuickLinks,
      Callout,
    },
  });
}
