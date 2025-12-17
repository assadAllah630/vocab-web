import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Settings',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _SettingsTile(
            icon: LucideIcons.globe,
            title: 'Language',
            subtitle: 'Change source and target languages',
            onTap: () => context.push('/profile/settings/language'),
          ),
          _SettingsTile(
            icon: LucideIcons.key,
            title: 'API Configuration',
            subtitle: 'Manage AI provider keys',
            onTap: () => context.push('/profile/settings/api'),
          ),
          _SettingsTile(
            icon: LucideIcons.shield,
            title: 'Security',
            subtitle: 'Password and authentication',
            onTap: () => context.push('/profile/settings/security'),
          ),
          _SettingsTile(
            icon: LucideIcons.bell,
            title: 'Notifications',
            subtitle: 'Push notification preferences',
            onTap: () {}, // TODO: Security Screen
          ),
          const SizedBox(height: 24),
          const Text(
            'Support',
            style: TextStyle(
              color: Color(0xFF71717A),
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          _SettingsTile(
            icon: LucideIcons.helpCircle,
            title: 'Help & Support',
            subtitle: 'Get answers and contact us',
            onTap: () => context.push('/profile/settings/help'),
          ),
          _SettingsTile(
            icon: LucideIcons.info,
            title: 'About',
            subtitle: 'Version info and credits',
            onTap: () => context.push('/profile/settings/about'),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF27272A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFFA1A1AA),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF52525B),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
