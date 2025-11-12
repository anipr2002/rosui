"use client";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sign In Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                formButtonPrimary: "bg-[#f56565] hover:bg-[#e53e3e]",
              },
            }}
            redirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>

      {/* Hero Image Section - Hidden on mobile */}
      <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-200 ">
        <div className="mx-auto my-auto mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] scale-150 ">
          <div className="[perspective:1200px] [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] mt-64 -mr-16 pl-16 lg:-mr-56 lg:pl-56">
            <div className="[transform:rotateX(20deg);]">
              <div className="lg:h-[44rem] relative skew-x-[.36rad]">
                <Image
                  className="rounded-[--radius] z-[2] relative border dark:hidden"
                  src="/images/dashboard.png"
                  alt="ROSUI Dashboard"
                  width={2880}
                  height={2074}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div className="md:hidden absolute inset-0 flex items-center justify-center backdrop-filter backdrop-blur-sm md:backdrop-blur-md z-[999999]">
        <div className="grid w-full z-10 grow items-center px-4 sm:justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto w-full sm:w-96",
                card: "shadow-none",
                formButtonPrimary: "bg-[#f56565] hover:bg-[#e53e3e]",
              },
            }}
            redirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}
