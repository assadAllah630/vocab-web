import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:markdown/markdown.dart' as md;

class MarkdownRenderer extends StatelessWidget {
  final String content;
  final double fontSize;

  const MarkdownRenderer({
    super.key,
    required this.content,
    this.fontSize = 16,
  });

  @override
  Widget build(BuildContext context) {
    // Basic preprocessing to handle escaped newlines common in AI responses
    final processedContent = content.replaceAll(r'\n', '\n');

    return Markdown(
      data: processedContent,
      selectable: true,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      styleSheet: MarkdownStyleSheet(
        p: TextStyle(
          fontSize: fontSize,
          color: const Color(0xFFA1A1AA),
          height: 1.6,
        ),
        h1: TextStyle(
          fontSize: fontSize * 1.75,
          fontWeight: FontWeight.w900,
          color: Colors.white,
          letterSpacing: -0.5,
          height: 1.2,
        ),
        h2: TextStyle(
          fontSize: fontSize * 1.4,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          decoration: TextDecoration.underline,
          decorationColor: const Color(0xFF27272A),
          decorationStyle: TextDecorationStyle.solid,
        ),
        h3: TextStyle(
          fontSize: fontSize * 1.2,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        // Code block styling
        code: TextStyle(
          fontFamily: 'monospace',
          fontSize: fontSize * 0.9,
          color: const Color(0xFFFAFAFA),
          backgroundColor: const Color(0xFF141416),
        ),
        codeblockDecoration: BoxDecoration(
          color: const Color(0xFF141416),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        blockquote: TextStyle(
          fontSize: fontSize,
          color: const Color(0xFFE0E7FF),
          fontStyle: FontStyle.italic,
        ),
        blockquoteDecoration: BoxDecoration(
          color: const Color(0xFF6366F1).withValues(alpha: 0.1),
          borderRadius: const BorderRadius.only(
            topRight: Radius.circular(12),
            bottomRight: Radius.circular(12),
          ),
          border: const Border(
            left: BorderSide(color: Color(0xFF6366F1), width: 4),
          ),
        ),
        listBullet: const TextStyle(color: Color(0xFFA1A1AA)),
      ),
      builders: {'code': CodeBlockBuilder()},
      extensionSet: md.ExtensionSet(
        md.ExtensionSet.gitHubFlavored.blockSyntaxes,
        [md.EmojiSyntax(), ...md.ExtensionSet.gitHubFlavored.inlineSyntaxes],
      ),
    );
  }
}

class CodeBlockBuilder extends MarkdownElementBuilder {
  @override
  Widget? visitElementAfter(md.Element element, TextStyle? preferredStyle) {
    var language = '';
    if (element.attributes['class'] != null) {
      String lg = element.attributes['class'] as String;
      language = lg.substring(9);
    }

    final textContent = element.textContent;

    if (language == 'mermaid') {
      return MermaidDiagram(code: textContent);
    }

    // Default code block
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SelectableText(
          textContent.trim(),
          style: const TextStyle(
            fontFamily: 'monospace',
            color: Color(0xFFFAFAFA),
          ),
        ),
      ),
    );
  }
}

class MermaidDiagram extends StatefulWidget {
  final String code;

  const MermaidDiagram({super.key, required this.code});

  @override
  State<MermaidDiagram> createState() => _MermaidDiagramState();
}

class _MermaidDiagramState extends State<MermaidDiagram> {
  late final WebViewController _controller;
  final double _height = 300;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF141416))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            // Adjust height if needed? For now fixed height.
          },
        ),
      )
      ..loadHtmlString(_getHtml(widget.code));
  }

  String _getHtml(String mermaidCode) {
    // Clean code
    final code = mermaidCode.replaceAll('`', '');

    return '''
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
          mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            themeVariables: {
              primaryColor: '#1C1C1F',
              primaryTextColor: '#FAFAFA',
              lineColor: '#6366F1',
              mainBkg: '#1C1C1F'
            }
          });
        </script>
        <style>
          body { background-color: #141416; margin: 0; display: flex; justify-content: center; }
          .mermaid { width: 100%; text-align: center; }
        </style>
      </head>
      <body>
        <div class="mermaid">
          $code
        </div>
      </body>
      </html>
    ''';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: _height,
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
