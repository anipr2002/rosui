"use client";

import React, { useEffect } from "react";
import { useServicesStore } from "@/store/service-store";
import { useRosStore } from "@/store/ros-store";
import {
  ServiceCard,
  ServiceLoading,
  ServicesEmptyState,
} from "@/components/dashboard/roscore/services";
import { ServerOff } from "lucide-react";
import { RosConnectionRequired } from "@/components/dashboard/misc";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

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
    return <RosConnectionRequired title="Services" />;
  }

  if (isLoadingServices) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ServiceLoading key={`service-loading-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="w-full px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">ROS Services</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your ROS services
          </p>
        </div>

        <ServicesEmptyState />
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
    <div className="w-full px-4 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ROS Services</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your ROS services ({services.length} available)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
