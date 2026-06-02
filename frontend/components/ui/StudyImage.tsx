"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder-xray.svg";

interface StudyImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
}

function isSvg(src: string): boolean {
  return src.endsWith(".svg");
}

function isRemote(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

/**
 * Renders study images from the API or local placeholders.
 * Remote JPEG/PNG use unoptimized next/image; SVGs use native img.
 */
export function StudyImage({
  src,
  alt,
  className,
  fill = false,
  sizes = "100vw",
  priority = false,
  objectFit = "cover",
}: StudyImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? PLACEHOLDER : src;
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  if (isSvg(resolved) || (!isRemote(resolved) && resolved.startsWith("/"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        onError={() => setFailed(true)}
        className={cn(
          fill && "absolute inset-0 h-full w-full",
          fitClass,
          className,
        )}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        onError={() => setFailed(true)}
        className={cn(fitClass, className)}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={400}
      height={400}
      unoptimized
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn(fitClass, className)}
    />
  );
}
