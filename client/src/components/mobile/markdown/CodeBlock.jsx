import React, { useState, Suspense } from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Terminal, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Fallback for code block while loading
const CodeFallback = ({ children, language }) => (
    <div className="my-6 rounded-xl overflow-hidden border border-[#27272A] bg-[#141416] opacity-70">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1C1C1F] border-b border-[#27272A]">
            <div className="flex items-center gap-2">
                <Terminal size={14} color="#71717A" />
                <span className="text-xs font-mono text-[#71717A]">{language || 'text'}</span>
            </div>
        </div>
        <div className="p-4 font-mono text-xs text-[#FAFAFA] overflow-x-auto">
            {children}
        </div>
    </div>
);

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const [copied, setCopied] = useState(false);
    const language = match ? match[1] : null;

    // Handle Mermaid blocks separately - this should ideally be handled by the parent
    // but we check here just in case class identification flows through
    if (!inline && language === 'mermaid') {
        const MermaidDiagram = React.lazy(() => import('./MermaidDiagram'));
        return (
            <Suspense fallback={<div className="h-40 bg-[#141416] animate-pulse rounded-xl my-6" />}>
                <MermaidDiagram>{String(children).replace(/\n$/, '')}</MermaidDiagram>
            </Suspense>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!inline && match) {
        return (
            <div className="relative group my-6 rounded-xl overflow-hidden border border-[#27272A] bg-[#141416]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1C1C1F] border-b border-[#27272A]">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} color="#71717A" />
                        <span className="text-xs font-mono text-[#71717A]">{language}</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-[#27272A] rounded-lg transition-colors"
                    >
                        {copied ? <Check size={14} color="#22C55E" /> : <Copy size={14} color="#71717A" />}
                    </button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        backgroundColor: '#141416',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        );
    }

    const content = String(children);
    const isShortBlock = !inline && !match && !content.includes('\n') && content.length < 50;

    // Choose styling based on block type
    let wrapperClass = '';

    if (inline) {
        wrapperClass = 'bg-[#27272A] text-[#FAFAFA] px-1.5 py-0.5 rounded text-sm font-mono';
    } else if (isShortBlock) {
        // "Chip" style for short blocks
        wrapperClass = 'inline-block bg-[#141416] px-3 py-1 rounded-lg text-sm font-mono align-middle mx-1 border border-[#27272A] text-[#FAFAFA]';
    } else {
        // Full block styling
        wrapperClass = 'block bg-[#141416] p-4 rounded-xl text-sm font-mono overflow-x-auto my-4 text-[#FAFAFA] border border-[#27272A]';
    }

    return (
        <code className={wrapperClass} {...props}>
            {!inline ? (
                <ReactMarkdown
                    components={{
                        p: ({ node, ...props }) => <span {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-[#FAFAFA]" {...props} />
                    }}
                >
                    {String(children)}
                </ReactMarkdown>
            ) : (
                children
            )}
        </code>
    );
};

export default CodeBlock;
