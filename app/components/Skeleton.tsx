import React from "react";

export function MatchSkeleton() {
  return (
    <li className="card p-4 animate-pulse flex flex-col gap-2">
      <div className="h-5 bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-1/3" />
      <div className="h-4 bg-gray-800 rounded w-1/4" />
    </li>
  );
}

export function TournamentSkeleton() {
  return (
    <li className="card p-3 animate-pulse flex flex-col gap-2">
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-800 rounded w-2/3" />
      <div className="h-3 bg-gray-800 rounded w-1/4" />
    </li>
  );
}