import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { Check, Copy, Terminal } from 'lucide-react';

const MermaidDiagram = ({ children }) => {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (children) {
            const renderDiagram = async () => {
                try {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'dark',
                        themeVariables: {
                            primaryColor: '#1C1C1F',
                            primaryTextColor: '#FAFAFA',
                            primaryBorderColor: '#6366F1',
                            lineColor: '#6366F1',
                            secondaryColor: '#27272A',
                            tertiaryColor: '#3F3F46',
                            background: '#141416',
                            mainBkg: '#1C1C1F',
                            secondBkg: '#27272A',
                            mainContrastColor: '#FAFAFA',
                            darkMode: true,
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            nodeBorder: '#6366F1',
                            clusterBkg: '#27272A',
                            clusterBorder: '#3F3F46',
                            titleColor: '#FAFAFA',
                            edgeLabelBackground: '#1C1C1F',
                            nodeTextColor: '#FAFAFA'
                        },
                        flowchart: {
                            curve: 'basis',
                            htmlLabels: true,
                            useMaxWidth: true
                        },
                        securityLevel: 'loose',
                        suppressErrorRendering: true
                    });

                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    let code = children;

                    // Auto-fix common syntax errors
                    if (code.includes('(') && code.includes('[')) {
                        code = code.replace(/\[([^"\[\]]*?\([^"\[\]]*?\)[^"\[\]]*?)\]/g, '["$1"]');
                        code = code.replace(/\(([^"()]*?\([^"()]*?\)[^"()]*?)\)/g, '("$1")');
                    }

                    const { svg } = await mermaid.render(id, code);
                    setSvg(svg);
                } catch (error) {
                    console.error('Mermaid rendering failed:', error);
                    setSvg(`
                        <div class="p-4 border border-red-900/50 rounded-xl bg-red-900/10 text-red-400 text-xs">
                            Failed to render diagram
                        </div>
                    `);
                }
            };
            renderDiagram();
        }
    }, [children]);

    return (
        <div
            className="my-6 p-4 bg-[#141416] rounded-xl border border-[#27272A] overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!inline && match && match[1].toLowerCase() === 'mermaid') {
        return <MermaidDiagram>{String(children).replace(/\n$/, '')}</MermaidDiagram>;
    }

    return !inline && match ? (
        <div className="relative group my-6 rounded-xl overflow-hidden border border-[#27272A] bg-[#141416]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1C1C1F] border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                    <Terminal size={14} color="#71717A" />
                    <span className="text-xs font-mono text-[#71717A]">{match[1]}</span>
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
                language={match[1]}
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
    ) : (
        <code className={`${inline
            ? 'bg-[#27272A] text-[#FAFAFA] px-1.5 py-0.5 rounded text-sm font-mono'
            : 'block bg-[#141416] p-4 rounded-xl text-sm font-mono overflow-x-auto my-4 text-[#FAFAFA] border border-[#27272A]'
            }`} {...props}>
            {children}
        </code>
    );
};

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
        code: CodeBlock,
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
                className="px-4 py-3 whitespace-nowrap text-sm text-[#FAFAFA] border-b border-[#27272A] last:border-0"
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

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MobileMarkdownRenderer;
