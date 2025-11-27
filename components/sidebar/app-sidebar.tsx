"use client";

import Image from "next/image";
import {
  BookOpen,
  Bot,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
  Wifi,
} from "lucide-react";
import type { ComponentProps } from "react";

import { DocsSidebarNav } from "@/components/sidebar/docs-nav";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { DocsSidebarItem } from "@/lib/docs-sidebar";
import { useUser } from "@clerk/nextjs";
import { useStorageQuota } from "@/hooks/use-storage-quota";

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  docsNav?: DocsSidebarItem[];
};

const sidebarData = {
  navMain: [
    {
      title: "ROS CORE",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Topics",
          url: "/dashboard/ros-core/topics",
        },
        {
          title: "Services",
          url: "/dashboard/ros-core/services",
        },
        {
          title: "Parameters",
          url: "/dashboard/ros-core/parameters",
        },
        {
          title: "Actions",
          url: "/dashboard/ros-core/actions",
        },
      ],
    },
    {
      title: "Visualization",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "RQT Graph",
          url: "/dashboard/visualization/rqt-graph",
        },
        {
          title: "Map Viewer",
          url: "/dashboard/visualization/map-viewer",
        },
        {
          title: "3D Vis",
          url: "/dashboard/visualization/3d-vis",
        },
        {
          title: "Camera Feeds",
          url: "#",
        },
        {
          title: "TF Transforms",
          url: "/dashboard/visualization/tf-tree",
        },
        {
          title: "Live Dashboard",
          url: "/dashboard/visualization/live-dashboard",
        },
      ],
    },
    {
      title: "ROSBAG",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Bag Library",
          url: "/dashboard/rosbag/bag-library",
        },
        {
          title: "Record",
          url: "/dashboard/rosbag/record",
        },
        {
          title: "Convert",
          url: "/dashboard/rosbag/convert",
        },
        {
          title: "Panel Viewer",
          url: "/dashboard/rosbag/panels",
        },
      ],
    },
    {
      title: "Health & Logs",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Diagnostics",
          url: "/dashboard/monitoring/diagnostics",
        },
        {
          title: "Logs",
          url: "/dashboard/monitoring/logs",
        },
        {
          title: "Nodes",
          url: "/dashboard/monitoring/nodes",
        },
        {
          title: "Performance",
          url: "/dashboard/monitoring/performance",
        },
      ],
    },
    {
      title: "Workflows",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Data Processing",
          url: "/dashboard/workflows/data-processing",
        },
        {
          title: "State Machine",
          url: "#",
        },
      ],
    },
    // {
    //   title: "Advanced",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "Dashboards",
    //       url: "/dashboard/advanced/dashboards",
    //     },
    //     {
    //       title: "Fleet Manager",
    //       url: "#",
    //     },
    //     {
    //       title: "Custom Widgets",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Docs",
      url: "/docs",
      icon: BookOpen,
      target: "_blank",
      rel: "noopener noreferrer",
    },
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  settings: [
    {
      name: "ROS Connection",
      url: "/dashboard/ros-settings/ros-connection",
      icon: Wifi,
    },
  ],
};

export function AppSidebar({ docsNav = [], ...props }: AppSidebarProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const { storageInfo } = useStorageQuota();

  const sidebarUser = {
    name: user?.username || "",
    email: user?.emailAddresses[0].emailAddress || "",
    avatar: user?.imageUrl || "",
  };

  const isProUser = storageInfo?.tier === "pro" || storageInfo?.tier === "team";

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg relative">
                  <Image src="/logo.svg" alt="ROSUI" width={16} height={16} />
                </div>
                <div className="flex flex-1 items-center gap-2 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ROSUI</span>
                  {isProUser && (
                    <Badge
                      variant="default"
                      className="group relative ml-1 overflow-hidden border-none bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[11px] h-5"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      Pro
                    </Badge>
                  )}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {docsNav.length > 0 ? <DocsSidebarNav items={docsNav} /> : null}
        <NavMain items={sidebarData.navMain} />
        <NavProjects settings={sidebarData.settings} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser currentUser={sidebarUser} isProUser={isProUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
