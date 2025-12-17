// File generated based on Firebase project: vocabmaster-6a729
// This file is required for Firebase initialization in Flutter
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyC6eSASHaOjdpktqpMls0DpURnLj120cQg',
    appId: '1:53918063752:web:2b63579091f450af15d33d',
    messagingSenderId: '53918063752',
    projectId: 'vocabmaster-6a729',
    authDomain: 'vocabmaster-6a729.firebaseapp.com',
    storageBucket: 'vocabmaster-6a729.firebasestorage.app',
    measurementId: 'G-J1MHS6BN31',
  );

  // Android configuration from google-services.json
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAzWlL6rbgmfoaKAbHqC9L9u4vmnrDjaPA',
    appId: '1:53918063752:android:96873c463551bd2d15d33d',
    messagingSenderId: '53918063752',
    projectId: 'vocabmaster-6a729',
    storageBucket: 'vocabmaster-6a729.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_WITH_IOS_API_KEY',
    appId: '1:53918063752:ios:REPLACE_WITH_IOS_APP_ID',
    messagingSenderId: '53918063752',
    projectId: 'vocabmaster-6a729',
    storageBucket: 'vocabmaster-6a729.firebasestorage.app',
    iosBundleId: 'com.vocabmaster.flutterApp',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'REPLACE_WITH_MACOS_API_KEY',
    appId: '1:53918063752:ios:REPLACE_WITH_MACOS_APP_ID',
    messagingSenderId: '53918063752',
    projectId: 'vocabmaster-6a729',
    storageBucket: 'vocabmaster-6a729.firebasestorage.app',
    iosBundleId: 'com.vocabmaster.flutterApp',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyC6eSASHaOjdpktqpMls0DpURnLj120cQg',
    appId: '1:53918063752:web:2b63579091f450af15d33d',
    messagingSenderId: '53918063752',
    projectId: 'vocabmaster-6a729',
    authDomain: 'vocabmaster-6a729.firebaseapp.com',
    storageBucket: 'vocabmaster-6a729.firebasestorage.app',
    measurementId: 'G-J1MHS6BN31',
  );
}
