"use client";

import React from "react";
import Test from "@/components/dashboard/visulatization/layouts/core/test";
import { useRosStore } from "@/store/ros-store";
import { RosConnectionRequired } from "@/components/dashboard/misc/ros-connection-required";

const DashboardsPage = () => {
  const { status } = useRosStore();

  // Not connected state
  if (status !== "connected") {
    return <RosConnectionRequired title="Live Dashboard" />;
  }

  return <Test />;
};

export default DashboardsPage;
