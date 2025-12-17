import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserProfile {
  final String name;
  final String email;
  final String avatarUrl;
  final int streak;
  final int level;
  final int xp;
  final String targetLanguage;
  final String nativeLanguage;

  const UserProfile({
    required this.name,
    required this.email,
    required this.avatarUrl,
    this.streak = 0,
    this.level = 1,
    this.xp = 0,
    this.targetLanguage = 'German',
    this.nativeLanguage = 'English',
  });

  UserProfile copyWith({
    String? name,
    String? email,
    String? avatarUrl,
    int? streak,
    int? level,
    int? xp,
    String? targetLanguage,
    String? nativeLanguage,
  }) {
    return UserProfile(
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      streak: streak ?? this.streak,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      targetLanguage: targetLanguage ?? this.targetLanguage,
      nativeLanguage: nativeLanguage ?? this.nativeLanguage,
    );
  }
}

class ProfileState {
  final UserProfile user;
  final bool isLoading;

  ProfileState({required this.user, this.isLoading = false});
}

final profileProvider = StateNotifierProvider<ProfileNotifier, ProfileState>((
  ref,
) {
  return ProfileNotifier();
});

class ProfileNotifier extends StateNotifier<ProfileState> {
  ProfileNotifier()
    : super(
        ProfileState(
          user: const UserProfile(
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatarUrl: 'https://i.pravatar.cc/300',
            streak: 12,
            level: 5,
            xp: 2450,
          ),
        ),
      );

  void updateProfile({String? name, String? email, String? avatarUrl}) {
    state = ProfileState(
      user: state.user.copyWith(name: name, email: email, avatarUrl: avatarUrl),
    );
  }

  void updateLanguage({String? target, String? native}) {
    state = ProfileState(
      user: state.user.copyWith(targetLanguage: target, nativeLanguage: native),
    );
  }

  // Method to simulate "Saving" with delay
  Future<void> saveProfile(String name, String email) async {
    state = ProfileState(user: state.user, isLoading: true);
    await Future.delayed(const Duration(seconds: 1));
    updateProfile(name: name, email: email);
    state = ProfileState(user: state.user, isLoading: false);
  }
}
