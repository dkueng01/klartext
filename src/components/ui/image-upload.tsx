"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onUpload, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0]; // Wir nehmen erst mal eins nach dem anderen, ist sicherer

    const formData = new FormData();
    formData.append("file", file);
    // WICHTIG: Hier muss dein Preset Name rein
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "klartext_upload");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUpload(data.secure_url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Fehler beim Upload. Bitte versuche es erneut.");
    } finally {
      setIsUploading(false);
      // Input resetten, damit man das gleiche Bild nochmal wählen kann falls nötig
      e.target.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        id="image-upload-input"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <label htmlFor="image-upload-input">
        <Button
          type="button"
          disabled={disabled || isUploading}
          variant="outline"
          className={cn(
            "w-full border-dashed border-2 h-12 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/50 transition-all cursor-pointer",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          // Klick auf Button triggert das Label -> Input
          asChild
        >
          <span>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            <span className="text-xs">{isUploading ? "Lade hoch..." : "Bild hochladen"}</span>
          </span>
        </Button>
      </label>
    </div>
  );
}