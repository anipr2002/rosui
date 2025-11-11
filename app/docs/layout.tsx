import { createDocsSidebarItems } from "@/lib/docs-sidebar";
// import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const docsNavItems = createDocsSidebarItems(source.pageTree);

  return (
    <DocsLayout
      tree={source.pageTree}
      // {...baseOptions()}
      sidebar={{
        defaultOpenLevel: 0,
        banner: undefined, // Remove any banner that might cause gap
      }}
      nav={{
        enabled: false, // If you don't need top nav, disable it
      }}
    >
      {children}
    </DocsLayout>
  );
}
