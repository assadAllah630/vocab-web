import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton loading components for mobile UI
 */

// Generic skeleton base
const SkeletonBase = ({ className }) => (
    <div className={`bg-slate-700 animate-pulse rounded ${className}`} />
);

// Card skeleton
export const CardSkeleton = ({ lines = 3 }) => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
        <SkeletonBase className="h-5 w-3/4 mb-3" />
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBase key={i} className={`h-4 mb-2 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
        ))}
    </div>
);

// List item skeleton
export const ListItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-pulse">
        <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1">
            <SkeletonBase className="h-4 w-2/3 mb-2" />
            <SkeletonBase className="h-3 w-1/2" />
        </div>
        <SkeletonBase className="w-6 h-6 rounded" />
    </div>
);

// Assignment skeleton
export const AssignmentSkeleton = () => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <SkeletonBase className="h-5 w-1/2" />
            <SkeletonBase className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBase className="h-4 w-full mb-2" />
        <SkeletonBase className="h-4 w-3/4 mb-4" />
        <div className="flex gap-2">
            <SkeletonBase className="h-8 w-20 rounded-lg" />
            <SkeletonBase className="h-8 w-24 rounded-lg" />
        </div>
    </div>
);

// Session skeleton
export const SessionSkeleton = () => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse flex gap-4">
        <SkeletonBase className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1">
            <SkeletonBase className="h-5 w-16 mb-2 rounded-full" />
            <SkeletonBase className="h-4 w-3/4 mb-2" />
            <div className="flex gap-3">
                <SkeletonBase className="h-3 w-16" />
                <SkeletonBase className="h-3 w-12" />
            </div>
        </div>
    </div>
);

// Dashboard stat skeleton
export const StatSkeleton = () => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
            <SkeletonBase className="w-4 h-4 rounded" />
            <SkeletonBase className="h-3 w-16" />
        </div>
        <SkeletonBase className="h-8 w-12 mb-2" />
        <SkeletonBase className="h-2 w-full rounded-full" />
    </div>
);

// Full page skeleton
export const PageSkeleton = ({ count = 3 }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 p-4"
    >
        {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} lines={2 + (i % 2)} />
        ))}
    </motion.div>
);

// Avatar skeleton
export const AvatarSkeleton = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };
    return <SkeletonBase className={`${sizeClasses[size]} rounded-full`} />;
};

// Text skeleton
export const TextSkeleton = ({ width = 'full', height = 4 }) => (
    <SkeletonBase className={`h-${height} w-${width}`} />
);

export default {
    CardSkeleton,
    ListItemSkeleton,
    AssignmentSkeleton,
    SessionSkeleton,
    StatSkeleton,
    PageSkeleton,
    AvatarSkeleton,
    TextSkeleton
};
