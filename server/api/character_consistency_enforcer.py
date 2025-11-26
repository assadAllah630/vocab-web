"""
Character Consistency Enforcer
Ensures visual consistency across AI-generated story events by enforcing identical character descriptions.
"""

import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class CharacterConsistencyEnforcer:
    """
    Ensures ALL events use IDENTICAL character descriptions to maintain visual consistency.
    """
    
    def enforce_consistency(self, story_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        1. Extract character description from Event 1
        2. Validate all other events use EXACT same description
        3. Auto-fix any mismatches
        4. Return validated events
        """
        if not story_events or len(story_events) < 2:
            return story_events
            
        # Step 1: Extract base character from first event
        # We assume the first event has the "canonical" description
        event1 = story_events[0]
        if 'image_prompt' not in event1 or 'positive_prompt' not in event1['image_prompt']:
            logger.warning("Event 1 missing image prompt data. Skipping consistency check.")
            return story_events
            
        event1_prompt = event1['image_prompt']['positive_prompt']
        base_character = self.extract_character_description(event1_prompt)
        
        if not base_character:
            logger.warning("Could not extract character description from Event 1. Skipping.")
            return story_events
            
        logger.info(f"Base character description extracted: '{base_character}'")
        
        # Step 2: For each subsequent event, check and fix
        fixed_count = 0
        for i, event in enumerate(story_events[1:], start=2):
            if 'image_prompt' not in event or 'positive_prompt' not in event['image_prompt']:
                continue
                
            current_prompt = event['image_prompt']['positive_prompt']
            current_character = self.extract_character_description(current_prompt)
            
            # If we couldn't find a character description in the current prompt, 
            # we might just prepend the base one, but for now let's try to replace or warn.
            if not current_character:
                # If no character found, prepend base character
                event['image_prompt']['positive_prompt'] = f"{base_character}, {current_prompt}"
                fixed_count += 1
                continue
            
            # Step 3: Compare similarity
            similarity = self.calculate_similarity(base_character, current_character)
            
            # If similarity is low, or if we just want to be strict (which we do for AI consistency)
            # We should probably just replace it if it's not identical or very close.
            # For this implementation, we'll be strict: if it's not a very high match, we replace.
            if similarity < 0.90:
                # Replace character description with Event 1 version
                # We assume the prompt structure is [Character] + [Action/Setting]
                # So we replace the extracted character part with the base character
                
                fixed_prompt = current_prompt.replace(current_character, base_character)
                
                # Fallback if replace failed (e.g. minor whitespace diffs in extraction vs string)
                if fixed_prompt == current_prompt:
                     # Try to reconstruct: Base + (Prompt - Current)
                     remainder = current_prompt.replace(current_character, "").strip()
                     if remainder.startswith(","): remainder = remainder[1:].strip()
                     fixed_prompt = f"{base_character}, {remainder}"

                event['image_prompt']['positive_prompt'] = fixed_prompt
                fixed_count += 1
                
                logger.debug(
                    f"Event {event.get('event_number', i)}: Auto-fixed character inconsistency.\n"
                    f"Was: {current_character}\n"
                    f"Fixed to: {base_character}"
                )
        
        if fixed_count > 0:
            logger.info(f"Fixed character consistency in {fixed_count} events.")
            
        return story_events
    
    def extract_character_description(self, prompt: str) -> str:
        """
        Extract character portion from prompt.
        Heuristic: Usually the first sentence or clause before a comma/action.
        
        Example inputs:
        - "An illustrated adult character with neat short dark hair, wearing blue shorts, walking on beach..."
        - "A graphic novel style character with messy hair, sitting at a desk..."
        
        Returns: "An illustrated adult character with neat short dark hair, wearing blue shorts"
        """
        if not prompt:
            return ""
            
        # Strategy 1: Look for "wearing" as a delimiter, as it's common in our prompts
        # "An illustrated character..., wearing X, action..."
        # We want to capture the "wearing X" part too usually.
        
        # Let's try to capture up to the main action. 
        # Often actions start with verbs ending in "ing" (walking, sitting) AFTER the character desc.
        # But "wearing" is also -ing.
        
        # Simple heuristic for V1: Take the first 2 segments split by commas if they look like character details.
        # Or better: The prompt template usually puts character first.
        # Let's assume the first 20-40 words are character if we can't find a better delimiter.
        
        # Regex to find the first chunk that looks like a person description
        # "An illustrated [adj] character [details]..."
        
        # Let's try splitting by specific keywords that denote start of setting/action if possible
        # But prompts vary.
        
        # Robust Fallback: 
        # The prompt instructions say: "An illustrated adult character... wearing..."
        # We can try to grab everything up to the second or third comma, or look for specific patterns.
        
        # Let's try to identify the "wearing" clause and include it.
        parts = prompt.split(',')
        
        if len(parts) <= 1:
            return prompt
            
        # Usually part 0 is "An illustrated character..."
        # Part 1 might be "wearing..."
        # Part 2 might be action or setting.
        
        candidate = parts[0]
        
        # If part 1 starts with "wearing" or "dressed", append it
        if len(parts) > 1 and any(x in parts[1].lower() for x in ['wearing', 'dressed', 'in ']):
            candidate += "," + parts[1]
            
        return candidate.strip()
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate text similarity (0.0 to 1.0) using simple word overlap (Jaccard index).
        """
        if not text1 or not text2:
            return 0.0
            
        # Normalize
        t1 = text1.lower()
        t2 = text2.lower()
        
        # Remove punctuation
        t1 = re.sub(r'[^\w\s]', '', t1)
        t2 = re.sub(r'[^\w\s]', '', t2)
        
        words1 = set(t1.split())
        words2 = set(t2.split())
        
        if not words1 or not words2:
            return 0.0
            
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
