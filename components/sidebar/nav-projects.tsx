"use client";

import Link from "next/link";
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRosStore } from "@/store/ros-store";
import { cn } from "@/lib/utils";

export function NavProjects({
  settings,
}: {
  settings: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const { isMobile } = useSidebar();
  const status = useRosStore((state) => state.status);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Settings</SidebarGroupLabel>
      <SidebarMenu>
        {settings.map((item) => {
          const isRosConnection = item.name === "ROS Connection";
          const isConnected = status === "connected";
          const isDisconnected =
            status === "disconnected" || status === "error";

          // Use dynamic icon based on connection status for ROS Connection
          const ItemIcon = isRosConnection
            ? isConnected
              ? Wifi
              : WifiOff
            : item.icon;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link
                  href={item.url}
                  className={cn(
                    "transition-colors",
                    isRosConnection &&
                      isConnected &&
                      "text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100",
                    isRosConnection &&
                      isDisconnected &&
                      "text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  )}
                >
                  <ItemIcon
                    className={cn(
                      isRosConnection && isConnected && "text-green-600",
                      isRosConnection && isDisconnected && "text-red-600"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <Folder className="text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}
        <SidebarMenuItem>
          <SidebarMenuButton>
            <MoreHorizontal />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
