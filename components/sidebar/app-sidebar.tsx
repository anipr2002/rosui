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
import type { DocsSidebarItem } from "@/lib/docs-sidebar";
import { useUser } from "@clerk/nextjs";

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
      ],
    },
    {
      title: "ROSBAG",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Record",
          url: "/dashboard/rosbag/record",
        },
        {
          title: "Convert",
          url: "/dashboard/rosbag/convert",
        },
      ],
    },
    {
      title: "Monitoring",
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
          title: "Performance",
          url: "#",
        },
        {
          title: "Nodes",
          url: "#",
        },
      ],
    },
    {
      title: "Data Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Recordings",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
      ],
    },
    {
      title: "Advanced",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Dashboards",
          url: "/dashboard/advanced/dashboards",
        },
        {
          title: "Fleet Manager",
          url: "#",
        },
        {
          title: "Custom Widgets",
          url: "#",
        },
      ],
    },
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
      url: "/dashboard/settings/ros-connection",
      icon: Wifi,
    },
  ],
};

export function AppSidebar({ docsNav = [], ...props }: AppSidebarProps) {
  const { isSignedIn, user, isLoaded } = useUser();

  const sidebarUser = {
    name: user?.fullName || "",
    email: user?.emailAddresses[0].emailAddress || "",
    avatar: user?.imageUrl || "",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/logo.svg" alt="ROSUI" width={16} height={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ROSUI</span>
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
        <NavUser currentUser={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
