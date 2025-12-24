import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const MermaidDiagram = ({ children }) => {
    const [svg, setSvg] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (children) {
            const renderDiagram = async () => {
                try {
                    setLoading(true);
                    // Dynamically import mermaid only when needed
                    const mermaid = (await import('mermaid')).default;

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
                            useMaxWidth: false,
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
                        code = code.replace(/\[([^"\[\]]*?\([^"\[\]]*?\)[^"\[\]]*?)\]/g, '["$1"]');
                        code = code.replace(/\(([^"()]*?\([^"()]*?\)[^"()]*?)\)/g, '("$1")');
                    }

                    // Remove backticks to prevent code styling in nodes
                    code = code.replace(/`/g, '');

                    const { svg } = await mermaid.render(id, code);
                    setSvg(svg);
                    setLoading(false);
                } catch (err) {
                    console.error('Mermaid rendering failed:', err);
                    setError('Failed to render diagram');
                    setLoading(false);
                }
            };
            renderDiagram();
        }
    }, [children]);

    if (loading) {
        return (
            <div className="my-6 flex justify-center p-8 bg-[#141416] rounded-xl border border-[#27272A]">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-6 p-4 border border-red-900/50 rounded-xl bg-red-900/10 text-red-400 text-xs text-center">
                {error}
                <pre className="mt-2 text-[10px] text-left opacity-50 overflow-x-auto">
                    {children}
                </pre>
            </div>
        );
    }

    return (
        <div className="my-6 overflow-x-auto flex justify-center custom-mermaid-container">
            <style>{`
                .custom-mermaid-container .node foreignObject {
                    overflow: visible !important;
                }
                .custom-mermaid-container .node foreignObject div {
                    white-space: normal !important;
                    overflow: visible !important;
                    text-align: center !important;
                    line-height: 1.4 !important;
                }
            `}</style>
            <div
                className="p-4 bg-[#141416] rounded-xl border border-[#27272A] min-w-min inline-block"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
};

export default MermaidDiagram;
