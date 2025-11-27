"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  Command,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
  Wifi,
  Radio,
  Wrench,
  Sliders,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  useRosStore,
  useTopicsStore,
  useServicesStore,
  useParamsStore,
  useActionsStore,
} from "@/store";

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
  keywords?: string[];
}

interface NavigationGroup {
  title: string;
  icon: LucideIcon;
  items: NavigationItem[];
}

const navigationData: NavigationGroup[] = [
  {
    title: "ROS CORE",
    icon: SquareTerminal,
    items: [
      {
        title: "Topics",
        url: "/dashboard/ros-core/topics",
        icon: SquareTerminal,
        description: "Manage ROS topics and subscriptions",
        keywords: ["topics", "messages", "publish", "subscribe"],
      },
      {
        title: "Services",
        url: "/dashboard/ros-core/services",
        icon: Settings2,
        description: "Call and manage ROS services",
        keywords: ["services", "calls", "requests", "responses"],
      },
      {
        title: "Parameters",
        url: "/dashboard/ros-core/parameters",
        icon: Settings2,
        description: "View and modify ROS parameters",
        keywords: ["parameters", "config", "settings", "values"],
      },
      {
        title: "Actions",
        url: "/dashboard/ros-core/actions",
        icon: Command,
        description: "Execute and monitor ROS actions",
        keywords: ["actions", "goals", "execution", "monitoring"],
      },
    ],
  },
  {
    title: "Visualization",
    icon: BookOpen,
    items: [
      {
        title: "RQT Graph",
        url: "/dashboard/visualization/rqt-graph",
        icon: BookOpen,
        description: "Visualize ROS node connections",
        keywords: ["graph", "nodes", "connections", "rqt", "visualization"],
      },
      {
        title: "TF Transforms",
        url: "/dashboard/visualization/tf-tree",
        icon: BookOpen,
        description: "View coordinate frame transforms",
        keywords: ["tf", "transforms", "frames", "coordinates"],
      },
      {
        title: "Map Viewer",
        url: "#",
        icon: BookOpen,
        description: "View robot maps and navigation",
        keywords: ["map", "navigation", "viewer", "robot"],
      },
      {
        title: "Camera Feeds",
        url: "#",
        icon: BookOpen,
        description: "Monitor camera streams",
        keywords: ["camera", "video", "streams", "feeds"],
      },
    ],
  },
  {
    title: "Monitoring",
    icon: Bot,
    items: [
      {
        title: "Diagnostics",
        url: "/dashboard/monitoring/diagnostics",
        icon: Bot,
        description: "System health and diagnostics",
        keywords: ["diagnostics", "health", "status", "monitoring"],
      },
      {
        title: "Logs",
        url: "#",
        icon: Bot,
        description: "View system logs and messages",
        keywords: ["logs", "messages", "debug", "errors"],
      },
      {
        title: "Performance",
        url: "#",
        icon: Bot,
        description: "Monitor system performance",
        keywords: ["performance", "metrics", "cpu", "memory"],
      },
      {
        title: "Nodes",
        url: "#",
        icon: Bot,
        description: "Manage ROS nodes",
        keywords: ["nodes", "processes", "management"],
      },
    ],
  },
  {
    title: "Data Management",
    icon: Settings2,
    items: [
      {
        title: "Recordings",
        url: "#",
        icon: Settings2,
        description: "Record and playback ROS data",
        keywords: ["recordings", "rosbag", "playback", "data"],
      },
      {
        title: "Analytics",
        url: "#",
        icon: Settings2,
        description: "Analyze collected data",
        keywords: ["analytics", "analysis", "insights", "data"],
      },
    ],
  },
  {
    title: "Advanced",
    icon: Settings2,
    items: [
      {
        title: "Dashboards",
        url: "#",
        icon: Settings2,
        description: "Custom dashboard views",
        keywords: ["dashboards", "custom", "views", "widgets"],
      },
      {
        title: "Fleet Manager",
        url: "#",
        icon: Settings2,
        description: "Manage multiple robots",
        keywords: ["fleet", "robots", "management", "multiple"],
      },
      {
        title: "Custom Widgets",
        url: "#",
        icon: Settings2,
        description: "Create custom interface widgets",
        keywords: ["widgets", "custom", "interface", "components"],
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings2,
    items: [
      {
        title: "ROS Connection",
        url: "/dashboard/ros-settings/ros-connection",
        icon: Wifi,
        description: "Configure ROS connection settings",
        keywords: ["connection", "ros", "wifi", "settings", "config"],
      },
    ],
  },
  {
    title: "Support",
    icon: LifeBuoy,
    items: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
        description: "Get help and support",
        keywords: ["support", "help", "documentation", "assistance"],
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
        description: "Send feedback and suggestions",
        keywords: ["feedback", "suggestions", "improvements", "contact"],
      },
    ],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  // ROS stores
  const { status } = useRosStore();
  const { topics } = useTopicsStore();
  const { services } = useServicesStore();
  const { params } = useParamsStore();
  const { actions } = useActionsStore();

  const handleSelect = React.useCallback(
    (url: string) => {
      if (url && url !== "#") {
        router.push(url);
        onOpenChange(false);
        setSearch("");
      }
    },
    [router, onOpenChange]
  );

  // Create dynamic ROS entity groups when connected
  const rosEntityGroups: NavigationGroup[] = React.useMemo(() => {
    if (status !== "connected") return [];

    const groups: NavigationGroup[] = [];

    // Topics group
    if (topics.length > 0) {
      groups.push({
        title: `ROS Topics (${topics.length})`,
        icon: Radio,
        items: topics.map((topic) => ({
          title: topic.name,
          url: "/dashboard/ros-core/topics",
          icon: Radio,
          description: `Topic type: ${topic.type}`,
          keywords: ["topic", topic.name, topic.type],
        })),
      });
    }

    // Services group
    if (services.length > 0) {
      groups.push({
        title: `ROS Services (${services.length})`,
        icon: Wrench,
        items: services.map((service) => ({
          title: service.name,
          url: "/dashboard/ros-core/services",
          icon: Wrench,
          description: `Service type: ${service.type}`,
          keywords: ["service", service.name, service.type],
        })),
      });
    }

    // Parameters group
    if (params.length > 0) {
      groups.push({
        title: `ROS Parameters (${params.length})`,
        icon: Sliders,
        items: params.map((param) => ({
          title: param.name,
          url: "/dashboard/ros-core/parameters",
          icon: Sliders,
          description: param.type
            ? `Parameter type: ${param.type}`
            : "ROS parameter",
          keywords: ["parameter", "param", param.name, param.type || ""],
        })),
      });
    }

    // Actions group
    if (actions.length > 0) {
      groups.push({
        title: `ROS Actions (${actions.length})`,
        icon: PlayCircle,
        items: actions.map((action) => ({
          title: action.name,
          url: "/dashboard/ros-core/actions",
          icon: PlayCircle,
          description: `Action type: ${action.type}`,
          keywords: ["action", action.name, action.type],
        })),
      });
    }

    return groups;
  }, [status, topics, services, params, actions]);

  // Merge navigation and ROS entity groups
  const allGroups = React.useMemo(() => {
    return [...navigationData, ...rosEntityGroups];
  }, [rosEntityGroups]);

  const filteredGroups = React.useMemo(() => {
    if (!search) return allGroups;

    return allGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const searchLower = search.toLowerCase();
          return (
            item.title.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.keywords?.some((keyword) =>
              keyword.toLowerCase().includes(searchLower)
            )
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [search, allGroups]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search for a page to navigate to..."
      className="max-w-2xl"
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        {filteredGroups.map((group) => {
          // Determine if this is a ROS entity group
          const isRosGroup = group.title.startsWith("ROS");

          return (
            <CommandGroup
              key={group.title}
              heading={
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md border",
                    isRosGroup
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  )}
                >
                  <group.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{group.title}</span>
                </div>
              }
              className="[&_[cmdk-group-heading]]:font-medium"
            >
              {group.items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${
                    item.description
                  } ${item.keywords?.join(" ")}`}
                  onSelect={() => handleSelect(item.url)}
                  className="group relative cursor-pointer rounded-lg border border-transparent bg-white px-3 py-2 transition-all hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {item.title}
                        </span>
                        {item.url === "#" && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <CommandShortcut className="text-gray-500">
                    {item.url !== "#" ? "↵" : ""}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
