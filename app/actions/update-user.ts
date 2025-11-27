"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateUserName(firstName: string, lastName: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      firstName,
      lastName,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating user name:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update name" 
    };
  }
}

export async function updateUsername(username: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      username,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating username:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update username" 
    };
  }
}

export async function updateProfileImage(imageFile: File) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: "Image size must be less than 5MB" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      return { success: false, error: "Only JPG, PNG, and WebP images are supported" };
    }

    const client = await clerkClient();
    await client.users.updateUserProfileImage(userId, {
      file: imageFile,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update profile image" 
    };
  }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long" };
    }

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      password: newPassword,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update password" 
    };
  }
}
