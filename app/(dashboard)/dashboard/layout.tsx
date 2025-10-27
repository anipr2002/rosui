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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
            <div className="flex items-center gap-2 px-4">
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
          </header>

          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
