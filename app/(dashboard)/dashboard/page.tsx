import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Command, Search } from "lucide-react";

const page = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to ROSUI - Your ROS 2 Dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Command className="h-5 w-5 text-amber-700" />
              <CardTitle className="text-amber-900">Command Palette</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Quick navigation and search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-amber-800">
                Press{" "}
                <kbd className="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs font-mono">
                  Ctrl+K
                </kbd>{" "}
                or{" "}
                <kbd className="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-xs font-mono">
                  ⌘+K
                </kbd>{" "}
                to open the command palette.
              </p>
              <p className="text-sm text-amber-800">
                Search for any page, feature, or functionality across the
                application.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-blue-900">Quick Access</CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              Navigate efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-blue-800">
                Use the command palette to quickly navigate to:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>
                  • ROS Core features (Topics, Services, Parameters, Actions)
                </li>
                <li>• Visualization tools (RQT Graph, TF Tree)</li>
                <li>• Monitoring and diagnostics</li>
                <li>• Settings and configuration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
