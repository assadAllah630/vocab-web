import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/grammar_provider.dart';

class GrammarDashboardScreen extends ConsumerStatefulWidget {
  const GrammarDashboardScreen({super.key});

  @override
  ConsumerState<GrammarDashboardScreen> createState() =>
      _GrammarDashboardScreenState();
}

class _GrammarDashboardScreenState
    extends ConsumerState<GrammarDashboardScreen> {
  String _selectedLevel = 'A1';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  final Map<String, bool> _expandedCategories = {};

  static const Map<String, String> categoriesMapping = {
    'articles': 'Articles',
    'plurals': 'Plurals',
    'verbs': 'Verb Conjugation',
    'separable_verbs': 'Separable Verbs',
    'modal_verbs': 'Modal Verbs',
    'cases': 'Cases',
    'prepositions': 'Prepositions',
    'sentence_structure': 'Sentence Structure',
    'word_order': 'Word Order',
    'time_expressions': 'Time Expressions',
    'adjective_endings': 'Adjective Endings',
    'comparatives': 'Comparatives & Superlatives',
    'uncategorized': 'Uncategorized',
  };

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(grammarProvider.notifier).fetchTopics();
    });
    // Auto-expand all categories by default
    for (var key in categoriesMapping.keys) {
      _expandedCategories[key] = true;
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(grammarProvider);
    final topics = state.topics;

    final filteredTopics = topics.where((topic) {
      final matchesLevel = topic.level == _selectedLevel;
      final matchesSearch =
          _searchQuery.isEmpty ||
          topic.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          topic.content.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    }).toList();

    // Group by category
    final Map<String, List<GrammarTopic>> topicsByCategory = {};
    for (var topic in filteredTopics) {
      final category = categoriesMapping.containsKey(topic.category)
          ? topic.category
          : 'uncategorized';
      topicsByCategory.putIfAbsent(category, () => []).add(topic);
    }

    // Only show categories that have topics
    final displayCategories = categoriesMapping.keys
        .where((cat) => topicsByCategory.containsKey(cat))
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchAndTabs(),
            Expanded(
              child: state.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF6366F1),
                      ),
                    )
                  : filteredTopics.isEmpty
                  ? _buildEmptyState()
                  : _buildTopicsList(displayCategories, topicsByCategory),
            ),
          ],
        ),
      ),
      floatingActionButton: filteredTopics.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => context.push('/practice/grammar/generate'),
              backgroundColor: const Color(0xFF6366F1),
              child: const Icon(LucideIcons.sparkles, color: Colors.white),
            ).animate().scale()
          : null,
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(LucideIcons.chevronLeft, color: Color(0xFFA1A1AA)),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFF1C1C1F),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const Text(
            'Grammar',
            style: TextStyle(
              color: Color(0xFFFAFAFA),
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          IconButton(
            onPressed: () => context.push('/practice/grammar/generate'),
            icon: const Icon(LucideIcons.plus, color: Color(0xFF6366F1)),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFF1C1C1F),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndTabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1F),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF27272A)),
            ),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(color: Color(0xFFFAFAFA)),
              decoration: const InputDecoration(
                icon: Icon(
                  LucideIcons.search,
                  color: Color(0xFF71717A),
                  size: 18,
                ),
                hintText: 'Search topics...',
                hintStyle: TextStyle(color: Color(0xFF71717A)),
                border: InputBorder.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1F),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: ['A1', 'A2', 'B1'].map((level) {
                final isSelected = _selectedLevel == level;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedLevel = level),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF27272A)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          level,
                          style: TextStyle(
                            color: isSelected
                                ? const Color(0xFFFAFAFA)
                                : const Color(0xFF71717A),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            color: Color(0xFF1C1C1F),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            LucideIcons.bookOpen,
            size: 40,
            color: Color(0xFF71717A),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Grammar Guide',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Create your personal grammar reference using AI-powered topic generation.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 14),
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () => context.push('/practice/grammar/generate'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          icon: const Icon(LucideIcons.sparkles, size: 18),
          label: const Text(
            'Generate Topic',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildTopicsList(
    List<String> displayCategories,
    Map<String, List<GrammarTopic>> topicsByCategory,
  ) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      itemCount: displayCategories.length,
      itemBuilder: (context, index) {
        final catKey = displayCategories[index];
        final catName = categoriesMapping[catKey] ?? 'Uncategorized';
        final catTopics = topicsByCategory[catKey]!;
        final isExpanded = _expandedCategories[catKey] ?? false;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF141416),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF27272A)),
          ),
          child: Column(
            children: [
              GestureDetector(
                onTap: () =>
                    setState(() => _expandedCategories[catKey] = !isExpanded),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isExpanded ? 0 : 20),
                      bottomRight: Radius.circular(isExpanded ? 0 : 20),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        catName,
                        style: const TextStyle(
                          color: Color(0xFFFAFAFA),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF27272A),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${catTopics.length}',
                              style: const TextStyle(
                                color: Color(0xFFA1A1AA),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            isExpanded
                                ? LucideIcons.chevronDown
                                : LucideIcons.chevronRight,
                            color: const Color(0xFF71717A),
                            size: 16,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              if (isExpanded)
                Column(
                  children: catTopics
                      .map((topic) => _buildTopicItem(topic))
                      .toList(),
                ),
            ],
          ),
        ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.1, end: 0);
      },
    );
  }

  Widget _buildTopicItem(GrammarTopic topic) {
    return GestureDetector(
      onTap: () => context.push('/practice/grammar/${topic.id}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFF27272A))),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                topic.title,
                style: const TextStyle(
                  color: Color(0xFFD4D4D8),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF52525B),
              size: 14,
            ),
          ],
        ),
      ),
    );
  }
}
