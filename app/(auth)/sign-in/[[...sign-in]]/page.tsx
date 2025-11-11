"use client";
import { SignIn } from "@clerk/nextjs";
export default function SignInPage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-filter backdrop-blur-sm md:backdrop-blur-md z-[999999]">
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
  );
}
