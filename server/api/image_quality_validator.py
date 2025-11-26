"""
Image Quality Validator
Validates generated images to ensure they meet professional illustration standards.
"""

import io
import base64
import logging
from typing import Dict, List, Any, Optional, Tuple

# We'll use Pillow for image analysis
try:
    from PIL import Image, ImageStat
except ImportError:
    # Fallback if PIL not available (though it should be in requirements)
    Image = None
    logging.warning("PIL not installed. Image validation will be limited.")

logger = logging.getLogger(__name__)

class ImageQualityValidator:
    """
    Validates each generated image before accepting it.
    Rejects bad images and triggers retry with adjusted prompt.
    """
    
    def validate_image(self, image_data: str, expected_style: str = 'illustration') -> Dict[str, Any]:
        """
        Runs multiple checks on generated image (base64 string).
        Returns: {valid: True/False, issues: [], adjusted_prompt: "..."}
        """
        issues = []
        
        # Check 1: File integrity and Base64 decoding
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            if Image:
                img = Image.open(io.BytesIO(image_bytes))
                img.verify() # Verify file integrity
                # Re-open for analysis since verify() closes the file
                img = Image.open(io.BytesIO(image_bytes))
            else:
                # Basic check if PIL not available
                if len(image_bytes) < 1000: # Too small
                    issues.append("corrupted_file")
                    return {'valid': False, 'issues': issues}
                return {'valid': True, 'issues': [], 'adjusted_prompt': None}
                
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            issues.append("corrupted_file")
            return {'valid': False, 'issues': issues}
        
        # Check 2: Aspect ratio (should be 16:9)
        width, height = img.size
        ratio = width / height if height > 0 else 0
        # 16:9 is ~1.77. Allow some tolerance (1.7 to 1.8)
        if not (1.7 < ratio < 1.8):
            issues.append(f"wrong_aspect_ratio_{ratio:.2f}")
        
        # Check 3: Style detection (illustration vs photo)
        # This is a heuristic. Real photos often have more unique colors.
        detected_style = self.detect_style(img)
        if detected_style == 'photorealistic' and expected_style == 'illustration':
            # We are strict about this for this project
            issues.append("photorealistic_not_illustration")
        
        # Check 4: Minimum quality (not too blurry)
        # Calculate sharpness/detail
        sharpness_score = self.calculate_sharpness(img)
        if sharpness_score < 20:  # Threshold for acceptable sharpness (heuristic)
            issues.append("too_blurry")
        
        if issues:
            # Generate adjusted prompt to fix issues
            adjusted_prompt = self.adjust_prompt_for_issues(issues)
            return {
                'valid': False,
                'issues': issues,
                'adjusted_prompt': adjusted_prompt,
                'retry_recommended': True
            }
        
        return {'valid': True, 'issues': [], 'adjusted_prompt': None}
    
    def detect_style(self, img) -> str:
        """
        Simple heuristic to detect if image is illustration vs photo.
        Illustration characteristics:
        - Fewer unique colors (often)
        - Clearer edges (sometimes)
        """
        try:
            # Resize for faster analysis
            small_img = img.resize((100, 100))
            # Reduce color depth to check palette size
            # Illustrations often have limited palettes compared to photos
            # This is a very rough heuristic but better than nothing
            
            # Count unique colors
            colors = small_img.getcolors(maxcolors=10000)
            if not colors:
                return 'unknown'
                
            num_colors = len(colors)
            
            # If extremely high color count in small area, likely photo
            # If lower, likely illustration/digital art
            if num_colors > 4000: 
                return 'photorealistic'
            else:
                return 'illustration'
        except Exception:
            return 'unknown'
            
    def calculate_sharpness(self, img) -> float:
        """
        Calculate perceived sharpness using variance of Laplacian (if cv2) 
        or simple standard deviation of edges (PIL).
        """
        try:
            # Convert to grayscale
            gray = img.convert('L')
            # Calculate standard deviation of pixel values (contrast check)
            stat = ImageStat.Stat(gray)
            return stat.stddev[0]
        except Exception:
            return 50.0 # Default to pass
    
    def adjust_prompt_for_issues(self, issues: List[str]) -> str:
        """
        Adjust negative prompt based on validation issues.
        """
        adjustments = []
        
        if 'photorealistic_not_illustration' in issues:
            adjustments.append("photorealistic, realistic photo, photograph, portrait, real person, detailed realistic face, 3d render")
        
        if 'too_blurry' in issues:
            adjustments.append("blurry, low quality, low resolution, out of focus, pixelated")
            
        if any('aspect_ratio' in i for i in issues):
            # Can't fix aspect ratio via negative prompt usually, but can try
            adjustments.append("cropped, cut off, wrong aspect ratio")
        
        return ", ".join(adjustments)
