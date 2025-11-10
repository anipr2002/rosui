import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createDocsSidebarItems } from '@/lib/docs-sidebar'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const docsNavItems = createDocsSidebarItems(source.pageTree)

  return (
    <SidebarProvider>
      <AppSidebar docsNav={docsNavItems} />
      <SidebarInset>
        <DocsLayout
          tree={source.pageTree}
          {...baseOptions()}
          sidebar={{ enabled: false }}
        >
          {children}
        </DocsLayout>
      </SidebarInset>
    </SidebarProvider>
  )
}
