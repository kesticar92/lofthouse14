"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

type PlacePhotoProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

const FALLBACK =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format";

export function PlacePhoto({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
}: PlacePhotoProps) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
      }}
    />
  );
}
