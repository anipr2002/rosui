"use client";

import { useEffect, useState } from "react";
import { useRosStore } from "@/store/ros-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  Settings2,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";

const CONFIG_DESCRIPTIONS = {
  url: "The WebSocket URL for rosbridge or the node server URL to connect using socket.io (if socket.io exists in the page). Can be specified later with connect.",
  groovyCompatibility:
    "Don't use interfaces that changed after the last groovy release or rosbridge_suite and related tools.",
  transportLibrary:
    "One of 'websocket', 'workersocket', 'socket.io' or RTCPeerConnection instance controlling how the connection is created in connect.",
  transportOptions:
    "The options to use when creating a connection. Currently only used if transportLibrary is RTCPeerConnection.",
};

export function RosConnectionManager() {
  const {
    status,
    errorMessage,
    config,
    setConfig,
    connect,
    disconnect,
    resetError,
  } = useRosStore();

  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConnect = async () => {
    setConfig(localConfig);
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <Wifi className="h-5 w-5 text-green-600" />;
      case "connecting":
        return <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColors = () => {
    switch (status) {
      case "connected":
        return {
          border: "border-green-300",
          headerBg: "bg-green-50",
          headerText: "text-green-900",
          descriptionText: "text-green-800",
        };
      case "connecting":
        return {
          border: "border-amber-300",
          headerBg: "bg-amber-50",
          headerText: "text-amber-900",
          descriptionText: "text-amber-800",
        };
      case "error":
        return {
          border: "border-red-300",
          headerBg: "bg-red-50",
          headerText: "text-red-900",
          descriptionText: "text-red-800",
        };
      default:
        return {
          border: "border-gray-200",
          headerBg: "bg-gray-50",
          headerText: "text-gray-900",
          descriptionText: "text-gray-800",
        };
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Connected
            </div>
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting...
            </div>
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Error
            </div>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              Disconnected
            </div>
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <Card className={`shadow-none pt-0 ${getStatusColors().border}`}>
        <CardHeader
          className={`${getStatusColors().headerBg} ${
            getStatusColors().border
          } border-b rounded-t-xl pt-6 `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon()}</div>
              <div>
                <CardTitle
                  className={`text-base ${getStatusColors().headerText}`}
                >
                  ROS Connection Status
                </CardTitle>
                <CardDescription
                  className={`mt-1 ${getStatusColors().descriptionText}`}
                >
                  Manage your ROS bridge connection
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Connection Error
                </p>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetError}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            {status !== "connected" ? (
              <Button
                onClick={handleConnect}
                disabled={status === "connecting"}
                className="bg-gray-200 border-gray-500 border-1 text-gray-500 hover:bg-gray-300 hover:text-gray-700"
              >
                {status === "connecting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card className={`shadow-none pt-0 ${getStatusColors().border}`}>
        <CardHeader
          className={`${getStatusColors().headerBg} ${
            getStatusColors().border
          } border-b rounded-t-xl pt-6`}
        >
          <div className="flex items-center gap-2">
            <Settings2 className={`h-5 w-5 ${getStatusColors().headerText}`} />
            <CardTitle className={`text-base ${getStatusColors().headerText}`}>
              Connection Settings
            </CardTitle>
          </div>
          <CardDescription className={getStatusColors().descriptionText}>
            Configure your ROS bridge connection parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WebSocket URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="url" className="text-sm font-medium">
                WebSocket URL
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p>{CONFIG_DESCRIPTIONS.url}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="url"
              type="text"
              value={localConfig.url}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, url: e.target.value })
              }
              placeholder="ws://localhost:9090"
              className="bg-white"
              disabled={status === "connected"}
            />
            <p className="text-xs text-gray-500">
              The WebSocket URL for rosbridge server
            </p>
          </div>

          <Separator />

          {/* Transport Library */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="transport" className="text-sm font-medium">
                Transport Library
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p>{CONFIG_DESCRIPTIONS.transportLibrary}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-white"
                  disabled={status === "connected"}
                >
                  <span>
                    {localConfig.transportLibrary === "websocket"
                      ? "WebSocket"
                      : localConfig.transportLibrary === "workersocket"
                      ? "Worker Socket"
                      : "Socket.IO"}
                  </span>
                  <Settings2 className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" align="start">
                <DropdownMenuLabel>Select Transport Protocol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setLocalConfig({
                      ...localConfig,
                      transportLibrary: "websocket",
                    })
                  }
                >
                  WebSocket
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setLocalConfig({
                      ...localConfig,
                      transportLibrary: "workersocket",
                    })
                  }
                >
                  Worker Socket
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setLocalConfig({
                      ...localConfig,
                      transportLibrary: "socket.io",
                    })
                  }
                >
                  Socket.IO
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-gray-500">
              Choose the transport protocol for the connection
            </p>
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Advanced Options
            </h4>

            {/* Groovy Compatibility */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="groovy" className="text-sm font-medium">
                    Groovy Compatibility
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <p>{CONFIG_DESCRIPTIONS.groovyCompatibility}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-500">
                  Enable for rosbridge versions before Hydro
                </p>
              </div>
              <Switch
                id="groovy"
                checked={localConfig.groovyCompatibility}
                onCheckedChange={(checked) =>
                  setLocalConfig({
                    ...localConfig,
                    groovyCompatibility: checked,
                  })
                }
                disabled={status === "connected"}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>

            <Separator />

            {/* Auto Reconnect */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="autoReconnect" className="text-sm font-medium">
                  Auto Reconnect
                </Label>
                <p className="text-xs text-gray-500">
                  Automatically reconnect on connection loss
                </p>
              </div>
              <Switch
                id="autoReconnect"
                checked={localConfig.autoReconnect}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, autoReconnect: checked })
                }
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>

            {/* Reconnect Interval */}
            {localConfig.autoReconnect && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label
                    htmlFor="reconnectInterval"
                    className="text-sm font-medium"
                  >
                    Reconnect Interval (ms)
                  </Label>
                  <Input
                    id="reconnectInterval"
                    type="number"
                    min="1000"
                    step="500"
                    value={localConfig.reconnectInterval}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        reconnectInterval: Number(e.target.value),
                      })
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Time to wait before attempting reconnection
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Apply Button */}
          {status !== "connected" && (
            <Button
              onClick={() => setConfig(localConfig)}
              variant="outline"
              className="w-full"
            >
              Save Settings
            </Button>
          )}

          {status === "connected" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Disconnect to modify connection settings
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
