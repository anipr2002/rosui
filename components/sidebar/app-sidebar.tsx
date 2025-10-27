"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Command,
  Wifi,
  WifiOff,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

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
import { url } from "inspector";
import { title } from "process";
import Image from "next/image";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
          url: "#",
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
      title: "Monitoring",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Diagnostics",
          url: "#",
        },
        {
          title: "Logs",
          url: "#",
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
          url: "#",
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
  Settings: [
    {
      name: "ROS Connection",
      url: "/dashboard/settings/ros-connection",
      icon: Wifi,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/logo.svg" alt="ROSUI" width={16} height={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ROSUI</span>
                  {/* <span className="truncate text-xs">Enterprise</span> */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects settings={data.Settings} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
