import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import './GrammarViewer.css';

const MermaidDiagram = ({ children }) => {
    const [svg, setSvg] = React.useState('');

    useEffect(() => {
        if (children) {
            const renderDiagram = async () => {
                try {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'neutral',
                        flowchart: { curve: 'basis' },
                        securityLevel: 'loose',
                        fontFamily: 'inherit',
                        suppressErrorRendering: true
                    });

                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                    // Auto-fix common syntax errors (e.g. unquoted labels with parentheses)
                    // Replaces [Text (Info)] with ["Text (Info)"]
                    let code = children;
                    if (code.includes('(') && code.includes('[')) {
                        // Allow newlines in the match
                        code = code.replace(/\[([^"\[\]]*?\([^"\[\]]*?\)[^"\[\]]*?)\]/g, '["$1"]');
                        code = code.replace(/\(([^"()]*?\([^"()]*?\)[^"()]*?)\)/g, '("$1")');
                    }

                    const { svg } = await mermaid.render(id, code);
                    setSvg(svg);
                } catch (error) {
                    console.error('Mermaid rendering failed:', error);
                    setSvg(`
                        <div class="flex flex-col gap-4">
                            <div class="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                                <p class="font-bold">Failed to render diagram</p>
                                <p class="text-sm mt-2">${error.message}</p>
                            </div>
                            <pre class="bg-slate-800 text-slate-200 p-4 rounded text-xs overflow-x-auto"><code>${children}</code></pre>
                        </div>
                    `);
                }
            };
            renderDiagram();
        }
    }, [children]);

    return (
        <div className="mermaid-container my-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
    );
};

const GrammarViewer = ({ topic }) => {
    if (!topic) return <div className="p-8 text-center text-gray-500">Select a topic to view</div>;

    return (
        <div className="grammar-viewer-container">
            <div className="grammar-header">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${topic.level === 'A1' ? 'bg-green-100 text-green-800' :
                        topic.level === 'A2' ? 'bg-blue-100 text-blue-800' :
                            topic.level === 'B1' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                        }`}>
                        {topic.level}
                    </span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-500 text-sm">{topic.category}</span>
                </div>
                <h1>{topic.title}</h1>
                <div className="text-sm text-gray-400 mt-2">
                    {topic.estimated_read_time && <span>⏱️ {topic.estimated_read_time} read</span>}
                </div>
            </div>

            <div className="grammar-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            const isMermaid = match && match[1].toLowerCase() === 'mermaid';

                            if (isMermaid) {
                                return <MermaidDiagram>{String(children).replace(/\n$/, '')}</MermaidDiagram>;
                            }

                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                >
                    {topic.content}
                </ReactMarkdown>
            </div>

            {topic.sources && topic.sources.length > 0 && (
                <div className="grammar-footer mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Sources</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        {topic.sources.map((source, index) => (
                            <li key={index} className="text-gray-600">
                                {source.url ? (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        {source.name || source.url}
                                    </a>
                                ) : (
                                    <span>{source.name}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GrammarViewer;
