'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PlayerProfileSkeleton() {
  return (
    <main className="min-h-screen pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-8 flex items-center gap-2">
          <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-600 rounded animate-pulse" />
        </div>

        {/* Hero section skeleton */}
        <div className="relative mb-12">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar skeleton */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-gray-700 animate-pulse" />
                  <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-gray-600 animate-pulse" />
                </div>
                <div className="mt-4 h-8 w-32 bg-gray-700 rounded-full animate-pulse" />
              </div>

              {/* Info skeleton */}
              <div className="flex-1 text-center lg:text-left">
                <div className="h-12 w-64 bg-gray-700 rounded animate-pulse mb-4 mx-auto lg:mx-0" />
                <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-6 mx-auto lg:mx-0" />
                
                {/* Badges skeleton */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-24 bg-gray-700 rounded-full animate-pulse" />
                  ))}
                </div>

                {/* Quick stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                      <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                      <div className="h-4 w-12 bg-gray-800 rounded animate-pulse mx-auto" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Team card skeleton */}
              <div className="min-w-[280px]">
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-5 border border-gray-700">
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-4" />
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-700 animate-pulse" />
                    <div>
                      <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements skeleton */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-700 animate-pulse" />
            <div>
              <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-gray-800/50 rounded-2xl border border-gray-700 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Media gallery skeleton */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-700 animate-pulse" />
            <div>
              <div className="h-8 w-56 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-40 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-video bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-700 animate-pulse" />
            <div>
              <div className="h-8 w-52 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-44 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 w-32 bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
