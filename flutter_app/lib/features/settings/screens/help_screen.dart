import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

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
          'Help & Support',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildItem(
            LucideIcons.mail,
            'Contact Support',
            'Get help with your account',
          ),
          _buildItem(
            LucideIcons.fileText,
            'Documentation',
            'Read the user guide',
          ),
          _buildItem(LucideIcons.bug, 'Report a Bug', 'Found something wrong?'),
          _buildItem(
            LucideIcons.shieldQuestion,
            'Privacy Policy',
            'How we handle data',
          ),
        ],
      ),
    );
  }

  Widget _buildItem(IconData icon, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFA1A1AA)),
        title: Text(title, style: const TextStyle(color: Colors.white)),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF71717A)),
        ),
        trailing: const Icon(
          LucideIcons.chevronRight,
          color: Color(0xFF52525B),
        ),
        onTap: () {},
      ),
    );
  }
}
