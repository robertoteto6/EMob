"use client";

import { lazy, Suspense } from "react";
import { Spinner } from "./LoadingOptimized";

// Lazy load the Search component
const Search = lazy(() => import("./Search"));

interface SearchLazyProps {
  game?: string;
  placeholder?: string;
  compact?: boolean;
  globalSearch?: boolean;
}

export default function SearchLazy(props: SearchLazyProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    }>
      <Search {...props} />
    </Suspense>
  );
}