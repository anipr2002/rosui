import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import * as TabsComponents from "fumadocs-ui/components/tabs";

import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

// Custom components
import { TopicDemoCard } from "@/components/docs/TopicDemoCard";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    img: (props) => <ImageZoom {...(props as any)} />,
    ...TabsComponents,

    // Add custom components here
    TopicDemoCard,

    ...components,
  };
}
