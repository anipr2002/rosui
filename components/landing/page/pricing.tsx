"use client";
import { Button } from "@/components/ui/button";
import React from "react";

// Pricing Plans Configuration
const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    billingInfo: "Get started for free",
    buttonText: "Choose Plan",
    buttonColor: "bg-amber-500",
    cardColor: "bg-amber-50",
    // badge: { text: "Current plan", style: "text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded" },
    features: [
      "Subscribe/Publish to Topics",
      "Call Services and Actions",
      "Edit/Delete Params",
      "View Live Image topics, URDFs, and other sensor data",
      "Visulize Data with Plots and other charts",
      "Navigate TF-Tree and access to RQT Graph",
      "Record ROSBAG Files (.mcap format)",
      "Convert ROSBAG Files to .mcap format",
      "Access to 1 layout",
      "Access to 5 Workflows",
      "View Live Logs",
    ],
  },
  {
    name: "Pro",
    price: "$3.99",
    period: "/mo",
    billingInfo: "Billed yearly at $40.00/year",
    buttonText: "Upgrade",
    buttonColor: "bg-blue-500 hover:bg-blue-600",
    cardColor: "bg-blue-50",
    badge: {
      text: "Most popular",
      style: "text-xs text- border border-blue-400  px-2 py-1 rounded",
    },
    featuresPrefix: "Everything in Free, plus:",
    features: [
      "Create upto 10 layouts",
      "Access to 50 Workflows per month",
      "Storage of ROSBAG Files upto 50GB",
      "Create sharable links to layouts and ROSBAGS",
      "Priority Support",
    ],
  },
  {
    name: "Teams",
    price: "$12.99",
    period: "/mo",
    billingInfo: "Billed yearly at $130.00/year",
    buttonText: "Upgrade",
    buttonColor: "bg-green-500 hover:bg-green-600",
    cardColor: "bg-green-50",
    featuresPrefix: "Everything in Pro, plus:",
    features: [
      "Unlimited Layouts",
      "Unlimited Workflows",
      "Storage of ROSBAG Files upto 500GB",
      "ROSBAGS and Layouts can be shared accross the team",
      "And many more features",
    ],
  },
];

const Pricing = () => {
  return (
    <section className="relative w-full min-h-screen ">
      {/* Header Section */}
      <div className="relative px-4 sm:px-6 md:px-12 lg:px-20 pt-8 sm:pt-12 md:pt-16 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4 md:px-6">
            {/* Left: Title */}
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3 md:mb-4 tracking-wide">
                PRICING
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900">
                Tool{" "}
                <img
                  src="/logo.svg"
                  alt=""
                  className="inline-block bg-black p-2 sm:p-3 md:p-4 rounded-md "
                ></img>{" "}
                Built For Growth.
              </h2>
            </div>

            {/* Right: Subtitle */}
            <div className="md:max-w-md text-left md:text-right h-full flex items-center">
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">
                Choose the perfect plan for your business. No hidden fees,
                cancel anytime.{" "}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Horizontal Line */}
      <div className="w-full h-px bg-black/15" />

      {/* Cards Section with Vertical Lines */}
      <div className="relative px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Vertical Lines - positioned to touch card edges and extend beyond */}
          <div className="hidden md:block absolute left-0 -top-32 -bottom-32 w-px bg-black/15 pointer-events-none" />
          <div className="hidden md:block absolute right-0 -top-32 -bottom-32 w-px bg-black/15 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {PRICING_PLANS.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative min-h-[500px] sm:min-h-[550px] md:min-h-[600px] ${plan.cardColor} ${
                  index === 0
                    ? "border-l border-r border-black/10"
                    : index === 1
                      ? "border-r border-black/10"
                      : ""
                } ${index > 0 ? "border-t md:border-t-0 border-black/10" : ""}`}
              >
                <div className="p-5 sm:p-6 md:p-8">
                  {/* Plan Header */}
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                      {plan.badge && (
                        <span className={plan.badge.style}>
                          {plan.badge.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5 md:mb-6">
                    {plan.billingInfo}
                  </p>

                  {/* Button */}
                  <Button
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-lg ${plan.buttonColor} text-white font-medium mb-2 transition-colors text-sm sm:text-base`}
                  >
                    {plan.buttonText}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mb-6 sm:mb-7 md:mb-8">
                    Cancel anytime
                  </p>

                  {/* Features */}
                  {plan.featuresPrefix && (
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">
                      {plan.featuresPrefix}
                    </p>
                  )}
                  <div className="space-y-2.5 sm:space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-2.5 sm:gap-3"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-900">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Line */}
      <div className="w-full h-px bg-black/15" />
    </section>
  );
};

export default Pricing;
