"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function addToWaitlist(email: string) {
  try {
    const client = await clerkClient();
    const entry = await client.waitlistEntries.create({
      emailAddress: email,
    });

    // Convert to plain object by extracting only the data you need
    return {
      success: true,
      data: {
        id: entry.id,
        emailAddress: entry.emailAddress,
        status: entry.status,
        createdAt: entry.createdAt,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to join waitlist" };
  }
}

export async function getWaitlistCount() {
  try {
    const client = await clerkClient();
    const { totalCount } = await client.waitlistEntries.list({
      limit: 1,
    });

    return { success: true, count: totalCount };
  } catch (error) {
    return { success: false, count: 0 };
  }
}
