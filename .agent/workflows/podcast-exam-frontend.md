---
description: Create frontend components for podcast exam - config, player, transcript review
---

# Podcast Exam Frontend Workflow

This workflow creates the frontend components for podcast exams.

## Prerequisites

- Backend complete via `/podcast-exam-models`, `/podcast-exam-agent`, `/podcast-exam-api`
- Context: `.context/modules/mobile/practice.context.md`

## Steps

### 1. Create MobilePodcastExamCreate.jsx

Create `client/src/pages/mobile/MobilePodcastExamCreate.jsx`:

**Key Features**:
- Podcast info header (title, level, duration)
- Question count slider (5, 10, 15, 20)
- Question types toggles (Cloze, Multiple Choice, Matching, Reading, Listening)
- Focus selector (Vocabulary | Grammar | Comprehension | Mixed)
- Difficulty slider (-1 Easier | 0 Same | +1 Harder)
- Generate button with loading state

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';
import { ChevronLeft, Loader, BookOpen, GraduationCap, Brain, Shuffle } from 'lucide-react';

const focusOptions = [
    { id: 'vocabulary', icon: BookOpen, label: 'Vocabulary', desc: 'Focus on new words' },
    { id: 'grammar', icon: GraduationCap, label: 'Grammar', desc: 'Focus on sentence structure' },
    { id: 'comprehension', icon: Brain, label: 'Comprehension', desc: 'Focus on understanding' },
    { id: 'mixed', icon: Shuffle, label: 'Mixed', desc: 'Balanced mix of all' },
];

const difficultyOptions = [
    { value: -1, label: 'Easier', emoji: '😊', color: '#22C55E' },
    { value: 0, label: 'Same Level', emoji: '🎯', color: '#6366F1' },
    { value: 1, label: 'Harder', emoji: '💪', color: '#EF4444' },
];

function MobilePodcastExamCreate() {
    const navigate = useNavigate();
    const { id: podcastId } = useParams();
    
    const [podcast, setPodcast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Configuration state
    const [questionCount, setQuestionCount] = useState(10);
    const [questionTypes, setQuestionTypes] = useState({
        cloze: true,
        multiple_choice: true,
        matching: true,
        reading: true,
        listening: true
    });
    const [focus, setFocus] = useState('mixed');
    const [difficulty, setDifficulty] = useState(0);
    
    useEffect(() => {
        loadPodcast();
    }, [podcastId]);
    
    const loadPodcast = async () => {
        try {
            const res = await api.get(`podcasts/${podcastId}/`);
            setPodcast(res.data);
        } catch (err) {
            console.error('Failed to load podcast:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const selectedTypes = Object.entries(questionTypes)
                .filter(([_, enabled]) => enabled)
                .map(([type]) => type);
            
            const res = await api.post('generate-podcast-exam/', {
                podcast_id: parseInt(podcastId),
                question_count: questionCount,
                question_types: selectedTypes,
                focus,
                difficulty_adjustment: difficulty
            });
            
            // Navigate to the exam player
            navigate(`/m/podcast-exam/${res.data.exam_id}/play`);
        } catch (err) {
            console.error('Failed to generate exam:', err);
        } finally {
            setGenerating(false);
        }
    };
    
    // ... rest of component with UI rendering
}

export default MobilePodcastExamCreate;
```

### 2. Create MobilePodcastExamPlay.jsx

Create `client/src/pages/mobile/MobilePodcastExamPlay.jsx`:

**Key Features**:
- Timer support (same as regular exam)
- All 5 question types including Listening
- Audio player for listening comprehension
- Results modal after submission
- Review mode with correct answers

This extends `MobileExamPlay.jsx` with audio support:
- Audio player component for listening questions
- Play clip functionality with start/end timestamps
- Integration with podcast audio file

### 3. Create ListeningQuestion.jsx Component

Create `client/src/components/mobile/ListeningQuestion.jsx`:

```jsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const MobileListeningQuestion = ({ 
    section, 
    onAnswer, 
    answers, 
    showResults, 
    audioUrl 
}) => {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(null);
    
    const playClip = (clipId, startTime, endTime) => {
        if (audioRef.current) {
            audioRef.current.currentTime = startTime;
            audioRef.current.play();
            setPlaying(clipId);
            
            // Auto-stop at endTime
            const duration = (endTime - startTime) * 1000;
            setTimeout(() => {
                audioRef.current.pause();
                setPlaying(null);
            }, duration);
        }
    };
    
    return (
        <div className="listening-section">
            <audio ref={audioRef} src={audioUrl} />
            
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#FAFAFA' }}>
                🎧 Listening Comprehension
            </h3>
            <p className="text-sm mb-6" style={{ color: '#A1A1AA' }}>
                {section.instruction}
            </p>
            
            <div className="space-y-6">
                {(section.clips || []).map((clip, idx) => {
                    const isPlaying = playing === clip.id;
                    const userAnswer = answers[clip.id];
                    const correctIdx = clip.correct_index;
                    const correctText = clip.options?.[correctIdx];
                    
                    return (
                        <div key={clip.id || idx} className="clip-question">
                            {/* Play button */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => playClip(clip.id, clip.start_time, clip.end_time)}
                                className="w-full mb-4 py-3 rounded-xl flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: isPlaying ? '#22C55E' : '#6366F1',
                                    color: '#FFFFFF'
                                }}
                            >
                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                {isPlaying ? 'Playing...' : `Play Clip (${clip.duration || Math.round(clip.end_time - clip.start_time)}s)`}
                            </motion.button>
                            
                            {/* Question */}
                            <p className="font-medium mb-3" style={{ color: '#FAFAFA' }}>
                                {idx + 1}. {clip.question}
                            </p>
                            
                            {/* Options */}
                            <div className="space-y-2">
                                {(clip.options || []).map((opt, optIdx) => {
                                    const isSelected = userAnswer === opt;
                                    const isCorrect = opt === correctText;
                                    
                                    return (
                                        <label
                                            key={optIdx}
                                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                                            style={{
                                                backgroundColor: showResults
                                                    ? isCorrect
                                                        ? 'rgba(34, 197, 94, 0.2)'
                                                        : isSelected
                                                            ? 'rgba(239, 68, 68, 0.2)'
                                                            : '#1C1C1F'
                                                    : '#1C1C1F'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={clip.id}
                                                onChange={() => onAnswer(clip.id, opt)}
                                                checked={isSelected}
                                                disabled={showResults}
                                            />
                                            <span style={{ color: '#FAFAFA' }}>{opt}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
```

### 4. Create TranscriptReview.jsx Component

Create `client/src/components/mobile/TranscriptReview.jsx`:

**Styling Specs**:
| Element | Style |
|---------|-------|
| Container | Dark background (#141416), rounded, padded |
| Font Sizes | S=14px, M=18px, L=22px, XL=26px |
| Line Height | 1.8 (very readable) |
| Speaker Labels | Color-coded, bold |
| Vocabulary | Highlighted with indigo underline |

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Type } from 'lucide-react';

const TranscriptReview = ({ transcript, extractedVocabulary, onWordClick }) => {
    const [fontSize, setFontSize] = useState('medium');
    
    const fontSizes = {
        small: 14,
        medium: 18,
        large: 22,
        xlarge: 26
    };
    
    const speakerColors = {
        'Host A': '#6366F1',
        'Host B': '#22C55E',
        'Guest': '#F59E0B',
        'Host': '#6366F1'
    };
    
    const highlightVocabulary = (text) => {
        if (!extractedVocabulary?.length) return text;
        
        const words = extractedVocabulary.map(v => v.word);
        const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, idx) => {
            const isVocab = words.some(w => w.toLowerCase() === part.toLowerCase());
            if (isVocab) {
                return (
                    <span
                        key={idx}
                        onClick={() => onWordClick?.(part)}
                        style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.3)',
                            padding: '0 4px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            borderBottom: '2px solid #6366F1'
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };
    
    const renderTranscript = () => {
        return transcript.split('\n').map((line, idx) => {
            const speakerMatch = line.match(/^\*\*(.+?):\*\*/);
            
            if (speakerMatch) {
                const speaker = speakerMatch[1];
                const text = line.replace(/^\*\*.+?:\*\*/, '').trim();
                
                return (
                    <div key={idx} style={{ marginBottom: '1rem' }}>
                        <span
                            style={{
                                color: speakerColors[speaker] || '#A1A1AA',
                                fontWeight: 700,
                                fontSize: fontSizes[fontSize] * 0.85
                            }}
                        >
                            {speaker}:
                        </span>
                        <p
                            style={{
                                fontSize: fontSizes[fontSize],
                                lineHeight: 1.8,
                                color: '#FAFAFA',
                                marginTop: '0.25rem'
                            }}
                        >
                            {highlightVocabulary(text)}
                        </p>
                    </div>
                );
            }
            
            return (
                <p
                    key={idx}
                    style={{
                        fontSize: fontSizes[fontSize],
                        lineHeight: 1.8,
                        color: '#E4E4E7',
                        marginBottom: '0.75rem'
                    }}
                >
                    {line}
                </p>
            );
        });
    };
    
    return (
        <div
            style={{
                backgroundColor: '#141416',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #27272A'
            }}
        >
            {/* Font Size Controls */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Type size={16} color="#A1A1AA" />
                {['small', 'medium', 'large', 'xlarge'].map(size => (
                    <motion.button
                        key={size}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFontSize(size)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            backgroundColor: fontSize === size ? '#6366F1' : '#27272A',
                            color: fontSize === size ? '#FFFFFF' : '#A1A1AA',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12
                        }}
                    >
                        {size.charAt(0).toUpperCase()}
                    </motion.button>
                ))}
            </div>
            
            {/* Transcript Content */}
            <div className="transcript-content">
                {renderTranscript()}
            </div>
        </div>
    );
};

export default TranscriptReview;
```

### 5. Create VocabularyPanel.jsx Component

Create `client/src/components/mobile/VocabularyPanel.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';

const VocabularyPanel = ({ vocabulary, onAddToList }) => {
    return (
        <div
            style={{
                backgroundColor: '#141416',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid #27272A'
            }}
        >
            <h3 
                className="flex items-center gap-2 mb-4"
                style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 600 }}
            >
                <BookOpen size={20} />
                New Words from Podcast
            </h3>
            
            <div className="space-y-3">
                {vocabulary.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                            backgroundColor: '#1C1C1F',
                            borderRadius: '0.75rem',
                            padding: '1rem'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 16 }}>
                                {item.word}
                            </span>
                            <span
                                style={{
                                    backgroundColor: '#27272A',
                                    color: '#A1A1AA',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: 12
                                }}
                            >
                                {item.type}
                            </span>
                        </div>
                        
                        <p style={{ color: '#6366F1', fontSize: 14, marginBottom: 8 }}>
                            {item.translation}
                        </p>
                        
                        {item.example && (
                            <p style={{ color: '#71717A', fontSize: 13, fontStyle: 'italic' }}>
                                "{item.example}"
                            </p>
                        )}
                        
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAddToList?.(item)}
                            className="mt-3 w-full py-2 rounded-lg flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                color: '#6366F1',
                                fontSize: 13,
                                fontWeight: 600
                            }}
                        >
                            <Plus size={14} />
                            Add to Vocabulary
                        </motion.button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default VocabularyPanel;
```

### 6. Add Routes to MobileApp.jsx

Add to `client/src/MobileApp.jsx`:

```jsx
import MobilePodcastExamCreate from './pages/mobile/MobilePodcastExamCreate';
import MobilePodcastExamPlay from './pages/mobile/MobilePodcastExamPlay';

// In routes:
<Route path="/m/podcast/:id/exam/create" element={<MobilePodcastExamCreate />} />
<Route path="/m/podcast-exam/:id/play" element={<MobilePodcastExamPlay />} />
<Route path="/m/podcast-exam/:id/review" element={<MobilePodcastExamPlay mode="review" />} />
```

### 7. Add "Generate Exam" button to MobilePodcastStudio.jsx

Add to podcast detail section in `client/src/pages/mobile/MobilePodcastStudio.jsx`:

```jsx
<motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => navigate(`/m/podcast/${podcast.id}/exam/create`)}
    className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold"
    style={{
        backgroundColor: '#6366F1',
        color: '#FFFFFF'
    }}
>
    <span>📝</span>
    Generate Exam
</motion.button>
```

### 8. Build and test

// turbo
```bash
cd client && npm run build
```

## Verification

// turbo
```bash
cd client && npm run lint
```

Test manually:
1. Open podcast detail page
2. Click "Generate Exam"
3. Configure options
4. Generate and take exam
5. Review transcript with font sizes
6. Check vocabulary panel

---

*Workflow version: 1.0*
