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

export function TeamSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-16"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
          <div className="h-3 bg-gray-700 rounded w-20"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-16"></div>
          </div>
          <div className="h-3 bg-gray-800 rounded w-12"></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
        <div className="h-3 bg-gray-800 rounded w-8"></div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-20"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-3 bg-gray-800 rounded w-12"></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
        <div className="h-3 bg-gray-800 rounded w-12"></div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}