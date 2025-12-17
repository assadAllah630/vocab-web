import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/primary_button.dart';

class APISettingsScreen extends StatefulWidget {
  const APISettingsScreen({super.key});

  @override
  State<APISettingsScreen> createState() => _APISettingsScreenState();
}

class _APISettingsScreenState extends State<APISettingsScreen> {
  final _openAIController = TextEditingController();
  final _geminiController = TextEditingController();
  bool _isLoading = false;

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
          'API Configuration',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            AppTextField(
              controller: _openAIController,
              label: 'OpenAI API Key',
              hintText: 'sk-...',
              prefixIcon: const Icon(
                LucideIcons.key,
                size: 20,
                color: Color(0xFF52525B),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 20),
            AppTextField(
              controller: _geminiController,
              label: 'Gemini API Key',
              hintText: 'AI...',
              prefixIcon: const Icon(
                LucideIcons.key,
                size: 20,
                color: Color(0xFF52525B),
              ),
              obscureText: true,
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Save Keys',
              isLoading: _isLoading,
              onPressed: () async {
                setState(() => _isLoading = true);
                await Future.delayed(const Duration(seconds: 1)); // Simulate
                setState(() => _isLoading = false);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('API Keys saved!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  context.pop();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
