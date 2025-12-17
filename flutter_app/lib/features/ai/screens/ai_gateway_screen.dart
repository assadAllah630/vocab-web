import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../providers/ai_gateway_provider.dart';

class AIGatewayScreen extends ConsumerStatefulWidget {
  const AIGatewayScreen({super.key});

  @override
  ConsumerState<AIGatewayScreen> createState() => _AIGatewayScreenState();
}

class _AIGatewayScreenState extends ConsumerState<AIGatewayScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiGatewayProvider.notifier).loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiGatewayProvider);

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, ref),
            _buildTabBar(),
            if (aiState.isLoading && aiState.dashboard == null)
              const Expanded(child: Center(child: CircularProgressIndicator()))
            else if (aiState.error != null && aiState.dashboard == null)
              Expanded(child: _buildErrorView(aiState.error!))
            else
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _OverviewTab(dashboard: aiState.dashboard),
                    _ModelsTab(dashboard: aiState.dashboard),
                    _KeysTab(
                      providers: aiState.providers,
                      keys: aiState.keys,
                      onAddKey: (data) =>
                          ref.read(aiGatewayProvider.notifier).addKey(data),
                      onTestKey: (id) =>
                          ref.read(aiGatewayProvider.notifier).testKey(id),
                      onDeleteKey: (id) =>
                          ref.read(aiGatewayProvider.notifier).deleteKey(id),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(
                  LucideIcons.chevronLeft,
                  color: Colors.white70,
                ),
                onPressed: () => context.pop(),
              ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  LucideIcons.cpu,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'AI Gateway',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(
              LucideIcons.refreshCw,
              color: Colors.white70,
              size: 20,
            ),
            onPressed: () => ref.read(aiGatewayProvider.notifier).loadData(),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: const Color(0xFF6366F1),
          borderRadius: BorderRadius.circular(8),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey,
        tabs: const [
          Tab(text: "Overview", icon: Icon(LucideIcons.barChart3, size: 16)),
          Tab(text: "Models", icon: Icon(LucideIcons.sparkles, size: 16)),
          Tab(text: "Keys", icon: Icon(LucideIcons.key, size: 16)),
        ],
      ),
    );
  }

  Widget _buildErrorView(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alertCircle, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(error, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(aiGatewayProvider.notifier).loadData(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

// OVERVIEW TAB
class _OverviewTab extends StatelessWidget {
  final AIDashboard? dashboard;

  const _OverviewTab({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    if (dashboard == null) return const SizedBox();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _StatusCard(
                label: "Active Keys",
                value: "${dashboard!.summary['active_keys'] ?? 0}",
                color: const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusCard(
                label: "Blocked Keys",
                value: "${dashboard!.blockedKeys?.length ?? 0}",
                color: const Color(0xFFEF4444),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusCard(
                label: "Blocked Models",
                value:
                    "${dashboard!.models?.blockedList?.length ?? 0}", // Assuming blockedList is in models
                // Or if blocked_models is top level
                // value: "${dashboard!.blockedModels?.length ?? 0}",
                // let's check blockedModels top level first
                // value: "${dashboard!.blockedModels?.length ?? 0}",
                color: const Color(0xFFF59E0B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _DetailedStatCard(
                label: "Remaining Today",
                value: "${dashboard!.summary['remaining_daily_capacity'] ?? 0}",
                icon: LucideIcons.zap,
                color: const Color(0xFF6366F1),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _DetailedStatCard(
                label: "Resets In",
                value:
                    "${dashboard!.resetTimes?['next_daily_reset_hours'] ?? 0}h",
                icon: LucideIcons.clock,
                color: const Color(0xFF8B5CF6),
              ),
            ),
          ],
        ),
      ].animate().fadeIn().slideY(begin: 0.1, end: 0),
    );
  }
}

// MODELS TAB
class _ModelsTab extends StatelessWidget {
  final AIDashboard? dashboard;

  const _ModelsTab({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    if (dashboard?.models == null) {
      return const Center(
        child: Text('No model data', style: TextStyle(color: Colors.grey)),
      );
    }

    final models = dashboard!.models!;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: _StatusPill(
                label: "Healthy",
                value: "${models.healthy}",
                color: const Color(0xFF22C55E),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusPill(
                label: "Degraded",
                value: "${models.degraded}",
                color: const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusPill(
                label: "Blocked",
                value:
                    "${(models.blockedList?.length ?? 0) + (dashboard?.blockedKeys?.length ?? 0)}",
                color: const Color(0xFFEF4444),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (models.topModels.isNotEmpty)
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF141416),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF1F1F23)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.trendingUp,
                        color: Color(0xFF6366F1),
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        "Best Available Models",
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFF1F1F23)),
                ...models.topModels.asMap().entries.map((entry) {
                  final i = entry.key;
                  final m = entry.value;
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: i < models.topModels.length - 1
                              ? const Color(0xFF1F1F23)
                              : Colors.transparent,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF6366F1,
                            ).withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            "${i + 1}",
                            style: const TextStyle(
                              color: Color(0xFF6366F1),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m['display_name'] ?? 'Unknown',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                "${m['provider']} • Key ${m['key_id']}",
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          "${((m['confidence_score'] ?? 0) * 100).toInt()}%",
                          style: const TextStyle(
                            color: Color(0xFF22C55E),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
      ].animate().fadeIn().slideY(begin: 0.1, end: 0),
    );
  }
}

// KEYS TAB
class _KeysTab extends StatefulWidget {
  final List<AIProvider> providers;
  final List<AIKey> keys;
  final Function(Map<String, dynamic>) onAddKey;
  final Function(int) onTestKey;
  final Function(int) onDeleteKey;

  const _KeysTab({
    required this.providers,
    required this.keys,
    required this.onAddKey,
    required this.onTestKey,
    required this.onDeleteKey,
  });

  @override
  State<_KeysTab> createState() => _KeysTabState();
}

class _KeysTabState extends State<_KeysTab> {
  bool _showAddForm = false;
  final _keyController = TextEditingController();
  final _nicknameController = TextEditingController();
  String? _selectedProvider;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GestureDetector(
          onTap: () {
            setState(() {
              _showAddForm = !_showAddForm;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _showAddForm ? LucideIcons.x : LucideIcons.plus,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  _showAddForm ? "Cancel" : "Add API Key",
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_showAddForm) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF141416),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF27272A)),
            ),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _selectedProvider,
                  dropdownColor: const Color(0xFF1F1F23),
                  decoration: const InputDecoration(
                    labelText: 'Provider',
                    filled: true,
                    fillColor: Color(0xFF1F1F23),
                    border: OutlineInputBorder(),
                  ),
                  items: widget.providers
                      .map(
                        (p) => DropdownMenuItem(
                          value: p.id,
                          child: Text(
                            p.name,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _selectedProvider = v),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _keyController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'API Key',
                    filled: true,
                    fillColor: Color(0xFF1F1F23),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _nicknameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Nickname (Optional)',
                    filled: true,
                    fillColor: Color(0xFF1F1F23),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                    ),
                    onPressed: () {
                      if (_selectedProvider != null &&
                          _keyController.text.isNotEmpty) {
                        widget.onAddKey({
                          'provider': _selectedProvider,
                          'api_key': _keyController.text,
                          'nickname': _nicknameController.text,
                        });
                        setState(() => _showAddForm = false);
                        _keyController.clear();
                        _nicknameController.clear();
                      }
                    },
                    child: const Text('Save Key'),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        ...widget.keys.map(
          (key) => _KeyCard(
            keyItem: key,
            onTest: widget.onTestKey,
            onDelete: widget.onDeleteKey,
          ),
        ),
      ],
    );
  }
}

class _KeyCard extends StatelessWidget {
  final AIKey keyItem;
  final Function(int) onTest;
  final Function(int) onDelete;

  const _KeyCard({
    required this.keyItem,
    required this.onTest,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F1F23)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        keyItem.nickname ?? keyItem.provider,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (keyItem.isBlocked)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            "BLOCKED",
                            style: TextStyle(
                              color: Colors.red,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  Text(
                    keyItem.provider,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color:
                      (keyItem.healthScore > 80 ? Colors.green : Colors.orange)
                          .withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "${keyItem.healthScore}%",
                  style: TextStyle(
                    color: keyItem.healthScore > 80
                        ? Colors.green
                        : Colors.orange,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${keyItem.requestsToday}/${keyItem.dailyQuota} today",
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              Text(
                "${keyItem.avgLatencyMs}ms latency",
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => onTest(keyItem.id),
                  child: const Text(
                    "Test",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () => onDelete(keyItem.id),
                icon: const Icon(
                  LucideIcons.trash2,
                  color: Colors.red,
                  size: 18,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Helpers
class _StatusCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatusCard({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatusPill({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(label, style: TextStyle(color: color, fontSize: 10)),
        ],
      ),
    );
  }
}

class _DetailedStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _DetailedStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F1F23)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}
