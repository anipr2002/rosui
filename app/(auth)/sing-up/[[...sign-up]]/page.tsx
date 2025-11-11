"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-filter backdrop-blur-sm md:backdrop-blur-md z-[9999999]">
      <div className="grid w-full grow items-center px-4 sm:justify-center">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full sm:w-96",
              card: "shadow-none",
              formButtonPrimary: "bg-[#f56565] hover:bg-[#e53e3e]",
            },
          }}
          redirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
