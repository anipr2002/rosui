"use client";

import React, { useEffect } from "react";
import { useServicesStore } from "@/store/service-store";
import { useRosStore } from "@/store/ros-store";
import { ServiceCard } from "@/components/dashboard/services";
import { Spinner, SpinnerCustom } from "@/components/ui/spinner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ServerOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ServicesPage() {
  const { services, isLoadingServices, getServicesList, cleanup } =
    useServicesStore();
  const { status } = useRosStore();
  const isConnected = status === "connected";

  useEffect(() => {
    if (isConnected) {
      getServicesList();
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [isConnected, getServicesList, cleanup]);

  if (!isConnected) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS services
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-900">
                    ROS Connection Required
                  </h3>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Please connect to ROS bridge from the Settings page to view
                  services.
                </p>
                <SpinnerCustom />
                <Link href="/dashboard/settings/ros-connection">
                  <Button variant="outline" className="mt-4">
                    Go to Settings
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingServices) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-amber-900">
                  Loading ROS Services...
                </h3>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Please wait while we load the ROS services...
              </p>
              <SpinnerCustom />
              <Link href="/dashboard/settings/ros-connection">
                <Button variant="outline" className="mt-4">
                  Go to Settings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ServerOff className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Services Found</h2>
        <p className="text-gray-600">
          No ROS services were found on the connected instance.
        </p>
      </div>
    );
  }

  const rosServices = services.filter(
    (service) =>
      service.name.startsWith("/rosapi/") ||
      service.name.startsWith("/rosbridge_websocket/")
  );

  const otherServices = services.filter(
    (service) =>
      !service.name.startsWith("/rosapi/") &&
      !service.name.startsWith("/rosbridge_websocket/")
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ROS Services</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS services ({services.length} available)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {otherServices.map((service) => (
          <ServiceCard
            key={service.name}
            serviceName={service.name}
            serviceType={service.type}
          />
        ))}
      </div>
      {rosServices.length > 0 && (
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="ros-services">
            <AccordionTrigger className="text-xl">
              ROS API & Bridge Services ({rosServices.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rosServices.map((service) => (
                  <ServiceCard
                    key={service.name}
                    serviceName={service.name}
                    serviceType={service.type}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
