from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class Weakness:
    """Standardized representation of a detected weakness."""
    type: str  # e.g., 'low_mastery', 'error_pattern', 'decay'
    confidence: float  # 0.0 to 1.0
    title: str
    description: str
    severity: str = 'medium'  # low, medium, high, critical
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self):
        return {
            'type': self.type,
            'confidence': self.confidence,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'metadata': self.metadata
        }

class BaseWeaknessDetector(ABC):
    """Abstract base class for all weakness detectors."""
    
    @abstractmethod
    def detect(self, user) -> List[Weakness]:
        """
        Analyze user data and return a list of detected weaknesses.
        """
        pass
