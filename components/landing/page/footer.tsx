"use client";

import React, { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Dither from "../effects/Dither";

function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // Handle waitlist submission
    console.log("Waitlist email:", email);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
    setEmail("");
  };

  return (
    <footer className="bg-background border-t border-gray-5 mt-40">
      {/* Waitlist Section */}
      <div className="mx-auto px-4 py-20 relative">
        {/* Dither Background */}
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={[0.5, 0.5, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
          />
        </div>
        <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10 px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Join the Waitlist
          </h2>
          <p className="text-lg sm:text-xl">
            Be the first to experience the future of ROS development. Get early
            access and exclusive updates.
          </p>

          {/* Waitlist Form */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              onClick={handleSubmit}
              className="bg-blue-50 border border-blue-200 flex items-center gap-2 hover:bg-blue-100 text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-200 whitespace-nowrap"
            >
              <ArrowRightIcon className="w-4 h-4" />
              {status === "loading"
                ? "Adding to waitlist..."
                : "Get early access"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-gray-5">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="ROSUI Logo"
                  width={30}
                  height={30}
                />
                <span className="text-xl font-bold tracking-tighter">
                  ROSUI
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The web dashboard ROS developers actually want to use.
              </p>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#docs"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#blog"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#support"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#community"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#github"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                © {new Date().getFullYear()} ROSUI. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                <a
                  href="#privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
            <div className="flex justify-center sm:justify-start">
              <p className="text-sm text-muted-foreground">
                Website by{" "}
                <a
                  href="https://navana.studio"
                  className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Navana Studio
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
