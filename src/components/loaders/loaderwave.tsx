"use client"

import * as React from "react";

type LoaderProps = {
  className?: string;
};

export default function BlocksWave({ className = '' }: LoaderProps) {
  const primaryBgClass = "bg-amber-600 dark:bg-amber-400";
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`}>
      <style>{`
        @keyframes waveBob {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
      `}</style>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-3 ${primaryBgClass} rounded-sm`}
          style={{
            height: `${[34, 65, 100, 65, 34][i]}%`,
            transformOrigin: 'bottom',
            animation: `waveBob 1.1s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}