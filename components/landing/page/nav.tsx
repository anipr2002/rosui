"use client";

import React from "react";
import {
  UserButton,
  SignInButton,
  SignedIn,
  SignedOut,
  SignOutButton,
  SignIn,
} from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Nav = () => {
  const router = useRouter();
  return (
    <div className="absolute top-6 right-6 sm:top-10 sm:right-10 z-30 flex items-center gap-3">
      {/* Sign In Button - Signed Out */}
      <SignedOut>
        <button
          onClick={() => {
            router.push("/sign-in");
          }}
          className="py-2 px-6 text-[#6B5435] rounded-md relative"
          style={{
            background: "rgba(254, 161, 1, 0.06)",
            boxShadow:
              "rgba(107, 84, 53, 0.06) 0px 3px 6px 0px, rgba(107, 84, 53, 0.06) 0px 1.5px 3px 0px, rgba(107, 84, 53, 0.06) 0px 0.75px 0.75px 0px, rgba(107, 84, 53, 0.06) 0px 0.25px 0.25px 0px, rgba(255, 242, 148, 0.16) 0px -1px 2px 0px inset, rgba(255, 242, 148, 0.16) 0px -0.5px 0.5px 0px inset, rgba(254, 161, 1, 0.12) 0px -8px 16px 0px inset",
          }}
        >
          <div
            className="absolute inset-3 rounded-md"
            style={{
              background:
                "linear-gradient(rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
          <span className="relative">Sign in</span>
        </button>
      </SignedOut>

      {/* Dashboard Button and User Profile - Signed In */}
      <SignedIn>
        <Link
          href="/dashboard"
          className="py-2 px-6 text-[#6B5435] rounded-md relative inline-flex items-center justify-center"
          style={{
            background: "rgba(254, 161, 1, 0.06)",
            boxShadow:
              "rgba(107, 84, 53, 0.06) 0px 3px 6px 0px, rgba(107, 84, 53, 0.06) 0px 1.5px 3px 0px, rgba(107, 84, 53, 0.06) 0px 0.75px 0.75px 0px, rgba(107, 84, 53, 0.06) 0px 0.25px 0.25px 0px, rgba(255, 242, 148, 0.16) 0px -1px 2px 0px inset, rgba(255, 242, 148, 0.16) 0px -0.5px 0.5px 0px inset, rgba(254, 161, 1, 0.12) 0px -8px 16px 0px inset",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-3 rounded-md block"
            style={{
              background:
                "linear-gradient(rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
          <span className="relative">Go to dashboard</span>
        </Link>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 rounded-md relative overflow-hidden"
              style={{
                background: "rgba(254, 161, 1, 0.06)",
                boxShadow:
                  "rgba(107, 84, 53, 0.06) 0px 3px 6px 0px, rgba(107, 84, 53, 0.06) 0px 1.5px 3px 0px, rgba(107, 84, 53, 0.06) 0px 0.75px 0.75px 0px, rgba(107, 84, 53, 0.06) 0px 0.25px 0.25px 0px, rgba(255, 242, 148, 0.16) 0px -1px 2px 0px inset, rgba(255, 242, 148, 0.16) 0px -0.5px 0.5px 0px inset, rgba(254, 161, 1, 0.12) 0px -8px 16px 0px inset",
              }}
            >
              <div
                className="absolute inset-1 rounded-md overflow-hidden"
                style={{
                  background:
                    "linear-gradient(rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 100%)",
                }}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-full h-full",
                    },
                  }}
                  showName={false}
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <SignOutButton>
                <button className="w-full text-left">Sign out</button>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SignedIn>
    </div>
  );
};

export default Nav;
