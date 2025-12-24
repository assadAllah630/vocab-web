import React, { useState, useEffect, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Loader2 } from 'lucide-react';

// Lazy load the code block component which handles syntax highlighting and mermaid diagrams
const CodeBlock = React.lazy(() => import('./markdown/CodeBlock'));

// Lightweight loading placeholder for code blocks
const CodeLoader = () => (
    <div className="my-6 rounded-xl overflow-hidden border border-[#27272A] bg-[#141416] opacity-50 h-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={20} />
    </div>
);

const MobileMarkdownRenderer = ({ content, fontSize = 16 }) => {
    const components = {
        h1: ({ node, ...props }) => (
            <h1
                className="font-black text-[#FAFAFA] mb-6 mt-8 tracking-tight"
                style={{ fontSize: `${fontSize * 1.75}px`, lineHeight: 1.2 }}
                {...props}
            />
        ),
        h2: ({ node, ...props }) => (
            <h2
                className="font-bold text-[#FAFAFA] mb-4 mt-8 pb-2 border-b border-[#27272A] flex items-center gap-2"
                style={{ fontSize: `${fontSize * 1.4}px` }}
                {...props}
            />
        ),
        h3: ({ node, ...props }) => (
            <h3
                className="font-bold text-[#FAFAFA] mb-3 mt-6"
                style={{ fontSize: `${fontSize * 1.2}px` }}
                {...props}
            />
        ),
        p: ({ node, ...props }) => (
            <p
                className="mb-4 text-[#A1A1AA] leading-relaxed"
                style={{ fontSize: `${fontSize}px` }}
                {...props}
            />
        ),
        strong: ({ node, ...props }) => (
            <strong className="font-bold text-[#FAFAFA] text-shadow-sm" {...props} />
        ),
        ul: ({ node, ...props }) => (
            <ul
                className="list-disc list-outside ml-5 mb-4 space-y-2 text-[#A1A1AA]"
                style={{ fontSize: `${fontSize}px` }}
                {...props}
            />
        ),
        ol: ({ node, ...props }) => (
            <ol
                className="list-decimal list-outside ml-5 mb-4 space-y-2 text-[#A1A1AA]"
                style={{ fontSize: `${fontSize}px` }}
                {...props}
            />
        ),
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
        blockquote: ({ node, ...props }) => (
            <blockquote
                className="border-l-4 border-[#6366F1] pl-4 py-2 my-6 bg-[#6366F1]/10 rounded-r-xl text-[#E0E7FF] italic"
                style={{ fontSize: `${fontSize}px` }}
                {...props}
            />
        ),
        // Wrap CodeBlock in Suspense (Handles Highlighting + Mermaid)
        code: (props) => (
            <Suspense fallback={<CodeLoader />}>
                <CodeBlock {...props} />
            </Suspense>
        ),
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-[#27272A]">
                <table className="min-w-full divide-y divide-[#27272A]" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-[#1C1C1F]" {...props} />,
        th: ({ node, ...props }) => (
            <th
                className="px-4 py-3 text-left text-xs font-bold text-[#A1A1AA] uppercase tracking-wider border-b border-[#27272A]"
                {...props}
            />
        ),
        td: ({ node, ...props }) => (
            <td
                className="px-4 py-3 text-sm text-[#FAFAFA] border-b border-[#27272A] last:border-0 align-top leading-relaxed"
                {...props}
            />
        ),
        a: ({ node, ...props }) => (
            <a
                className="text-[#6366F1] hover:underline font-medium"
                {...props}
            />
        ),
    };

    // Pre-process content to handle escaped newlines often returned by AI
    const processedContent = content ? content.replace(/\\n/g, '\n') : '';

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
        >
            {processedContent}
        </ReactMarkdown>
    );
};

export default MobileMarkdownRenderer;
