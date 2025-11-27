"use client";

import React from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import terminalAnimation from "@/public/lottie/terminal.json";

interface RosConnectionRequiredProps {
  title: string;
  description?: string;
}

export function RosConnectionRequired({
  title,
  description = "Please check the rosbridge connection or check the terminal for errors.",
}: RosConnectionRequiredProps) {
  return (
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS {title.toLowerCase()}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 max-w-3xl w-full text-center">
          <div className="mb-6 flex justify-center">
            <Lottie
              animationData={terminalAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 700, maxWidth: "100%" }}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ROS Connection Required
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {description}
          </p>
          <Link href="/dashboard/settings/ros-connection">
            <Button variant="outline" className="gap-2">
              Go to Settings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
