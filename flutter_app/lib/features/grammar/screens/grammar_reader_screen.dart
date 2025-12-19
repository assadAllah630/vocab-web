import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/grammar_provider.dart';

class GrammarReaderScreen extends ConsumerStatefulWidget {
  final int id;
  const GrammarReaderScreen({super.key, required this.id});

  @override
  ConsumerState<GrammarReaderScreen> createState() =>
      _GrammarReaderScreenState();
}

class _GrammarReaderScreenState extends ConsumerState<GrammarReaderScreen> {
  double _fontSize = 16;
  bool _isFullScreen = false;
  bool _showSettings = false;
  double _scrollProgress = 0;
  final ScrollController _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.hasClients) {
      final progress =
          _scrollCtrl.offset / (_scrollCtrl.position.maxScrollExtent);
      setState(() => _scrollProgress = progress.clamp(0.0, 1.0));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(grammarProvider);
    final topic = state.topics.firstWhere(
      (t) => t.id == widget.id,
      orElse: () => GrammarTopic(
        id: 0,
        title: '',
        level: '',
        category: '',
        content: '',
        examples: [],
      ),
    );

    if (topic.id == 0) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF6366F1)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            _buildProgressBar(),
            if (!_isFullScreen) _buildHeader(topic),
            if (_showSettings && !_isFullScreen) _buildSettingsPanel(),
            Expanded(
              child: Stack(
                children: [
                  _buildContent(topic),
                  if (_isFullScreen) _buildExitFullScreenButton(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      height: 4,
      width: double.infinity,
      color: const Color(0xFF27272A),
      child: FractionallySizedBox(
        alignment: Alignment.centerLeft,
        widthFactor: _scrollProgress,
        child: Container(color: const Color(0xFF6366F1)),
      ),
    );
  }

  Widget _buildHeader(GrammarTopic topic) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: const BoxDecoration(
        color: Color(0xCC09090B),
        border: Border(bottom: BorderSide(color: Color(0xFF27272A))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(LucideIcons.chevronLeft, color: Color(0xFFA1A1AA)),
          ),
          Row(
            children: [
              IconButton(
                onPressed: () => setState(() => _showSettings = !_showSettings),
                icon: Icon(
                  LucideIcons.type,
                  color: _showSettings
                      ? const Color(0xFFFAFAFA)
                      : const Color(0xFFA1A1AA),
                ),
              ),
              IconButton(
                onPressed: () => setState(() => _isFullScreen = true),
                icon: const Icon(
                  LucideIcons.maximize2,
                  color: Color(0xFFA1A1AA),
                ),
              ),
              _buildMenu(topic),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMenu(GrammarTopic topic) {
    return PopupMenuButton<String>(
      icon: const Icon(LucideIcons.moreVertical, color: Color(0xFFA1A1AA)),
      color: const Color(0xFF1C1C1F),
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (val) {
        if (val == 'edit') {
          context.push('/practice/grammar/generate', extra: topic);
        } else if (val == 'delete') {
          _confirmDelete(topic.id);
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'edit',
          child: Row(
            children: [
              Icon(LucideIcons.edit2, size: 16, color: Colors.white),
              SizedBox(width: 12),
              Text('Edit', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(LucideIcons.trash2, size: 16, color: Color(0xFFEF4444)),
              SizedBox(width: 12),
              Text('Delete', style: TextStyle(color: Color(0xFFEF4444))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF141416),
        border: Border(bottom: BorderSide(color: Color(0xFF27272A))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildFontSizeBtn(false),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              '${_fontSize.toInt()}px',
              style: const TextStyle(
                color: Color(0xFFA1A1AA),
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          _buildFontSizeBtn(true),
        ],
      ),
    ).animate().slideY(begin: -0.2, end: 0).fadeIn(duration: 200.ms);
  }

  Widget _buildFontSizeBtn(bool isIncrease) {
    return GestureDetector(
      onTap: () => setState(() {
        if (isIncrease) {
          _fontSize = (_fontSize + 2).clamp(12.0, 24.0);
        } else {
          _fontSize = (_fontSize - 2).clamp(12.0, 24.0);
        }
      }),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFF27272A)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Text(
            isIncrease ? 'A+' : 'A-',
            style: TextStyle(
              color: const Color(0xFFFAFAFA),
              fontSize: isIncrease ? 18 : 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(GrammarTopic topic) {
    return SingleChildScrollView(
      controller: _scrollCtrl,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTitleBlock(topic),
          const SizedBox(height: 16),
          MarkdownBody(
            data: topic.content,
            styleSheet: MarkdownStyleSheet(
              p: TextStyle(
                color: const Color(0xFFA1A1AA),
                fontSize: _fontSize,
                height: 1.6,
              ),
              h1: TextStyle(
                color: const Color(0xFFFAFAFA),
                fontSize: _fontSize * 1.75,
                fontWeight: FontWeight.w900,
                height: 1.2,
              ),
              h2: TextStyle(
                color: const Color(0xFFFAFAFA),
                fontSize: _fontSize * 1.4,
                fontWeight: FontWeight.bold,
              ),
              h3: TextStyle(
                color: const Color(0xFFFAFAFA),
                fontSize: _fontSize * 1.2,
                fontWeight: FontWeight.bold,
              ),
              strong: const TextStyle(
                color: Color(0xFFFAFAFA),
                fontWeight: FontWeight.bold,
              ),
              blockquote: const TextStyle(
                color: Color(0xFFE0E7FF),
                fontStyle: FontStyle.italic,
              ),
              blockquoteDecoration: BoxDecoration(
                color: const Color(0xFF6366F1).withAlpha(25),
                border: const Border(
                  left: BorderSide(color: Color(0xFF6366F1), width: 4),
                ),
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
              ),
              code: const TextStyle(
                color: Color(0xFFFAFAFA),
                backgroundColor: Color(0xFF27272A),
                fontFamily: 'monospace',
                fontSize: 14,
              ),
              codeblockDecoration: BoxDecoration(
                color: const Color(0xFF141416),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              tableBorder: TableBorder.all(
                color: const Color(0xFF27272A),
                width: 1,
              ),
              tableHead: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFFA1A1AA),
              ),
              tableBody: const TextStyle(color: Color(0xFFFAFAFA)),
            ),
          ),
          if (topic.examples.isNotEmpty) _buildExamplesSection(topic),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _buildTitleBlock(GrammarTopic topic) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF27272A),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                topic.level,
                style: const TextStyle(
                  color: Color(0xFFA1A1AA),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF71717A),
              size: 12,
            ),
            const SizedBox(width: 8),
            Text(
              topic.category,
              style: const TextStyle(
                color: Color(0xFF71717A),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          topic.title,
          style: const TextStyle(
            color: Color(0xFFFAFAFA),
            fontSize: 32,
            fontWeight: FontWeight.w900,
            height: 1.1,
          ),
        ),
      ],
    );
  }

  Widget _buildExamplesSection(GrammarTopic topic) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 48),
        Container(height: 1, color: const Color(0xFF27272A)),
        const SizedBox(height: 32),
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF6366F1).withAlpha(51),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.bookOpen,
                size: 16,
                color: Color(0xFF6366F1),
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Examples',
              style: TextStyle(
                color: Color(0xFFFAFAFA),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ...topic.examples.map((example) => _buildExampleCard(example)).toList(),
      ],
    );
  }

  Widget _buildExampleCard(GrammarExample example) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MarkdownBody(
            data: example.german,
            styleSheet: MarkdownStyleSheet(
              p: TextStyle(
                color: const Color(0xFFFAFAFA),
                fontSize: _fontSize + 2,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 4),
          MarkdownBody(
            data: example.english,
            styleSheet: MarkdownStyleSheet(
              p: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExitFullScreenButton() {
    return Positioned(
      bottom: 24,
      right: 24,
      child: GestureDetector(
        onTap: () => setState(() => _isFullScreen = false),
        child: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: const Color(0xCC27272A),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF3F3F46)),
          ),
          child: const Icon(LucideIcons.minimize2, color: Colors.white),
        ).animate().scale(),
      ),
    );
  }

  void _confirmDelete(int id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1F),
        title: const Text(
          'Delete Topic?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'This will permanently remove this grammar topic.',
          style: TextStyle(color: Color(0xFFA1A1AA)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Color(0xFFA1A1AA)),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(grammarProvider.notifier).deleteTopic(id);
              if (mounted) context.pop();
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Color(0xFFEF4444)),
            ),
          ),
        ],
      ),
    );
  }
}
