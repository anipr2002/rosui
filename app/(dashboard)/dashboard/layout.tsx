"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPaletteProvider } from "@/components/command-k";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Command, Search } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  // Capitalize and format segment names
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4 flex-1">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {pathSegments.map((segment, index) => {
                    const isLast = index === pathSegments.length - 1;
                    const href = `/${pathSegments
                      .slice(0, index + 1)
                      .join("/")}`;

                    return (
                      <React.Fragment key={segment}>
                        <BreadcrumbItem
                          className={index === 0 ? "hidden md:block" : ""}
                        >
                          {isLast ? (
                            <BreadcrumbPage>
                              {formatSegment(segment)}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={href}>
                              {formatSegment(segment)}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && (
                          <BreadcrumbSeparator
                            className={index === 0 ? "hidden md:block" : ""}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground border-amber-200 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-100/50"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          </header>

          {children}
        </SidebarInset>
        <CommandPaletteProvider />
      </SidebarProvider>
    </div>
  );
};

export default Layout;
