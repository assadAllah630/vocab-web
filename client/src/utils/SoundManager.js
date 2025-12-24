/**
 * SoundManager - Handles game audio effects
 * Uses Web Audio API or HTML5 Audio for low latency
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;

        // Preload sounds (placeholders for now - normally would load files)
        // In a real app, we would load these from assets
        this.registry = {
            click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Pop
            correct: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Success chime
            wrong: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Error buzz
            streak: 'https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3', // Power up
            gameOver: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Win
            freeze: 'https://assets.mixkit.co/active_storage/sfx/1618/1618-preview.mp3', // Magic
        };

        this.init();
    }

    init() {
        Object.keys(this.registry).forEach(key => {
            this.sounds[key] = new Audio(this.registry[key]);
            this.sounds[key].volume = 0.5;
        });
    }

    play(name) {
        if (this.muted || !this.sounds[name]) return;

        // Clone for overlapping sounds
        const sound = this.sounds[name].cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Audio play failed', e));
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

export const soundManager = new SoundManager();
