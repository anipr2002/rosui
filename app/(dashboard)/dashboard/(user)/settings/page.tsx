"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ProfileImageUpload } from "@/components/settings/profile-image-upload";
import { toast } from "sonner";
import {
  updateUserName,
  updateUsername,
  updatePassword,
} from "@/app/actions/update-user";
import {
  User,
  Mail,
  AtSign,
  Lock,
  Bell,
  Eye,
  Shield,
  Loader2,
  Check,
  Crown,
  CreditCard,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const userProfile = useQuery(api.users.getUserProfile);
  const updateProfile = useMutation(api.users.updateUserProfile);
  const polarSubscription = useQuery(api.polar.getCurrentSubscription);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Original values for change detection
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Initialize form values when data loads
  useEffect(() => {
    if (clerkUser) {
      const first = clerkUser.firstName || "";
      const last = clerkUser.lastName || "";
      const user = clerkUser.username || "";
      
      setFirstName(first);
      setLastName(last);
      setUsername(user);
      
      setOriginalFirstName(first);
      setOriginalLastName(last);
      setOriginalUsername(user);
    }
  }, [clerkUser]);

  // Check if name has changed
  const nameHasChanged = firstName !== originalFirstName || lastName !== originalLastName;
  
  // Check if username has changed
  const usernameHasChanged = username !== originalUsername;
  
  // Check if password fields are filled
  const passwordFieldsFilled = currentPassword && newPassword && confirmPassword;

  const handleUpdateName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsUpdatingName(true);
    try {
      const result = await updateUserName(firstName, lastName);

      if (result.success) {
        // Update Convex database
        await updateProfile({ name: `${firstName} ${lastName}` });
        // Update original values
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        toast.success("Name updated successfully");
      } else {
        toast.error(result.error || "Failed to update name");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const result = await updateUsername(username);

      if (result.success) {
        // Update original value
        setOriginalUsername(username);
        toast.success("Username updated successfully");
      } else {
        toast.error(result.error || "Failed to update username");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await updatePassword(currentPassword, newPassword);

      if (result.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Loading state
  if (!isLoaded || !userProfile) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Subscription Card */}
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-blue-50 border-blue-200 border-b rounded-t-xl pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-blue-900">
                    Current Subscription
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your active plan and billing information
                  </CardDescription>
                </div>
                <Badge
                  className={
                    polarSubscription?.tier === "free"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : polarSubscription?.tier === "pro"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-green-100 text-green-700 border-green-200"
                  }
                >
                  {polarSubscription?.tier === "free" && "Free Plan"}
                  {polarSubscription?.tier === "pro" && "Pro Plan"}
                  {polarSubscription?.tier === "team" && "Team Plan"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Plan */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    {polarSubscription?.tier === "free" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : polarSubscription?.tier === "pro" ? (
                      <Crown className="h-3.5 w-3.5" />
                    ) : (
                      <Crown className="h-3.5 w-3.5" />
                    )}
                    Plan
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {polarSubscription?.tier === "free" && "Free"}
                    {polarSubscription?.tier === "pro" && "Pro - $3.99/mo"}
                    {polarSubscription?.tier === "team" && "Team - $12.99/mo"}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <CreditCard className="h-3.5 w-3.5" />
                    Status
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {polarSubscription?.tier === "free"
                      ? "Free"
                      : polarSubscription?.cancelAtPeriodEnd
                        ? "Cancelling"
                        : "Active"}
                  </p>
                </div>

                {/* Next Billing */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    {polarSubscription?.cancelAtPeriodEnd
                      ? "Access Until"
                      : "Next Billing"}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {polarSubscription?.currentPeriodEnd
                      ? new Date(
                          polarSubscription.currentPeriodEnd
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>

                {/* Go to billing button */}
                <Link href="/dashboard/billing">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Go to Billing
                  </Button>
                </Link>
              </div>

              {/* Upgrade prompt for free users */}
              {polarSubscription?.tier === "free" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    Upgrade to unlock more features and storage
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/dashboard/billing")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
              <CardTitle className="text-base text-gray-900">
                Profile Information
              </CardTitle>
              <CardDescription className="text-xs">
                Update your personal information and profile photo
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Profile Image */}
              <div>
                <ProfileImageUpload
                  currentImageUrl={clerkUser?.imageUrl || ""}
                  userName={userProfile.name}
                  onImageUpdate={() => window.location.reload()}
                />
              </div>

              <Separator />

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="bg-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleUpdateName}
                disabled={isUpdatingName || !nameHasChanged}
                className={
                  nameHasChanged
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 border-gray-500 border text-gray-500 hover:bg-gray-300 hover:text-gray-700"
                }
              >
                {isUpdatingName ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Name
                  </>
                )}
              </Button>

              <Separator />

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Email changes must be done through your account security
                  settings
                </p>
              </div>

              <Separator />

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Your username must be unique
                </p>
              </div>

              <Button
                onClick={handleUpdateUsername}
                disabled={isUpdatingUsername || !usernameHasChanged}
                className={
                  usernameHasChanged
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 border-gray-500 border text-gray-500 hover:bg-gray-300 hover:text-gray-700"
                }
              >
                {isUpdatingUsername ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Username
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
              <CardTitle className="text-base text-gray-900">
                Security Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="bg-white"
                  />
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || !passwordFieldsFilled}
                  className={
                    passwordFieldsFilled
                      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 border-gray-500 border text-gray-500 hover:bg-gray-300 hover:text-gray-700"
                  }
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-none pt-0 rounded-xl">
            <CardHeader className="bg-gray-50 border-gray-200 border-b rounded-t-xl pt-6">
              <CardTitle className="text-base text-gray-900">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive email notifications about your account activity
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              <Separator />

              {/* Marketing Emails */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Marketing Emails
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive emails about new features and updates
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              <Separator />

              <Button className="bg-gray-200 border-gray-500 border text-gray-500 hover:bg-gray-300 hover:text-gray-700">
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
