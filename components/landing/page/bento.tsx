"use client";
import React from "react";
import Lottie from "lottie-react";
import { BlurText } from "@/components/landing/effects/BlurText";
import topicsAnimation from "@/public/lottie/topics.json";
import tfTreeAnimation from "@/public/lottie/tf-tree.json";
import rosbagAnimation from "@/public/lottie/rosbag.json";
import layoutAnimation from "@/public/lottie/layout.json";
import cloudAnimation from "@/public/lottie/cloud.json";
import terminalAnimation from "@/public/lottie/terminal.json";
import FadeContent from "../effects/FadeContent";

const Bento = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:gap-6 mt-8 sm:mt-12 md:mt-[52px]">
        {/* Title Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <BlurText className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-3 sm:mb-4">
            Powerful ROS Tools
          </BlurText>
          <BlurText className="text-lg sm:text-xl md:text-2xl text-muted-foreground px-4 sm:px-0">
            Everything you need to monitor, debug, and control your ROS
            applications
          </BlurText>
        </div>
        {/* First Row - 2 columns */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mx-auto w-full md:grid-cols-2">
          {/* Topics Animation */}
          <FadeContent className="flex-1">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full min-w-full">
              <div className="relative flex-1 flex-grow justify-center content-center">
                <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] mx-auto">
                  <Lottie animationData={topicsAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Monitor Everything in Real-Time
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Track all ROS communication layers from one unified interface.
                  Watch topics stream data, inspect active services, monitor
                  running actions, and adjust parameters on the fly. No more
                  switching between rqt plugins—everything updates live with
                  sub-100ms latency.
                </p>
              </div>
            </div>
          </FadeContent>

          {/* Rosbag Animation */}
          <FadeContent delay={200} className="flex-1">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full min-w-full">
              <div className="relative flex-1 flex-grow justify-center content-center">
                <div className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[420px] mx-auto">
                  <Lottie animationData={rosbagAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Replay Bags with Frame Precision
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Upload rosbags and scrub through recordings with a visual
                  timeline. See video feeds update in sync, analyze sensor data
                  with waveform graphs, and jump to specific timestamps. Control
                  playback speed from 0.1x to 4x with smooth interpolation for
                  detailed debugging.
                </p>
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Second Row - 3 columns */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {/* TF Tree Animation */}
          <FadeContent delay={400} className="h-full">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full">
              <div
                style={{ top: "15px" }}
                className="relative flex-1 flex-grow justify-center content-center sm:top-[25px]"
              >
                <div className="w-full max-w-[250px] sm:max-w-[300px] md:max-w-[350px] mx-auto">
                  <Lottie animationData={tfTreeAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Debug Transforms Visually
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Navigate your robot's coordinate frame hierarchy with an
                  interactive 3D tree. See parent-child relationships, inspect
                  transform values in real-time, and identify broken links
                  instantly. Click any frame to view its position, rotation, and
                  lineage back to base_link.
                </p>
              </div>
            </div>
          </FadeContent>

          {/* Layout Animation */}
          <FadeContent delay={600} className="h-full">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full">
              <div className="relative flex-1 flex-grow justify-center content-center">
                <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[560px] mx-auto scale-100 sm:scale-125 md:scale-150">
                  <Lottie animationData={layoutAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Manage Multiple Robots Effortlessly
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Switch between robots with a single click. Each connection
                  maintains its own dashboard state, saved to the cloud. Monitor
                  CPU usage, memory, network status, and active nodes across
                  your entire fleet
                </p>
              </div>
            </div>
          </FadeContent>

          {/* Empty placeholder */}
          <FadeContent delay={800} className="h-full">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full">
              <div className="relative flex-1 flex-grow justify-center content-center">
                <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] scale-100 sm:scale-125 md:scale-150 mx-auto">
                  <Lottie animationData={cloudAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Async collaboration that actually works
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Collaborate with your team in real-time. Share your screen,
                  view each other's RViz views, and sync rosbags in real-time.
                </p>
              </div>
            </div>
          </FadeContent>
        </div>

        {/* Third Row - 1 column */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Terminal Animation */}
          <FadeContent delay={1000} className="h-full">
            <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 justify-evenly p-4 sm:p-6 text-left rounded-xl border md:p-8 bg-gray-1 border-gray-5 h-full">
              <div className="relative flex-1 flex-grow justify-center content-center">
                <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[600px] mx-auto">
                  <Lottie animationData={terminalAnimation} loop={true} />
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-end h-fit">
                <h3 className="text-base sm:text-lg font-medium">
                  Just one command
                </h3>
                <p className="text-sm sm:text-base text-gray-10">
                  Connect to your ROS environment instantly via rosbridge
                  websocket. No complex setup required—just paste your WebSocket
                  URL and start monitoring your robot in real-time. Works with
                  any ROS1 or ROS2 system running the rosbridge_suite package.
                </p>
              </div>
            </div>
          </FadeContent>
        </div>
      </div>
    </div>
  );
};

export default Bento;
