"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function deleteImageFromCloudinary(imageUrl: string) {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
    const match = imageUrl.match(regex);

    if (!match || !match[1]) {
      console.error("Could not extract public_id from url:", imageUrl);
      return { success: false, error: "Invalid URL format" };
    }

    const publicId = match[1];

    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error: "Failed to delete image" };
  }
}