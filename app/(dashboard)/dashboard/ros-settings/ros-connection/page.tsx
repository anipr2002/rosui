import { RosConnectionManager } from "@/components/dashboard/ros-connection-manager";

function RosConnectionPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ROS Connection</h1>
        <p className="text-muted-foreground mt-2">
          Configure and manage your connection to the ROS bridge server
        </p>
      </div>
      <RosConnectionManager />
    </div>
  );
}

export default RosConnectionPage;
