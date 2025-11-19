import type { LayoutDirection } from "@/lib/rqt-reactflow/layout-rqt-graph";

export interface RqtGraphConfig {
  searchQuery?: string;
  filterSystemNodes?: boolean;
  showTopics?: boolean;
  layoutDirection?: LayoutDirection;
}
