
import logging
import trafilatura
from typing import Optional
import re
import requests
from urllib.parse import urljoin
from api.text_extraction_service import extract_text_from_file

logger = logging.getLogger(__name__)

class TranscriptScraperService:
    """
    Smart recursive scraper that acts like an agent:
    1. Fetches the page.
    2. Looks for better candidates (links to PDFs, "Manuskript" pages).
    3. Fetches candidates and compares length to find the best transcript.
    """
    
    @staticmethod
    def fetch_transcript(url: str) -> Optional[str]:
        if not url:
            return None
            
        logger.info(f"Scraping transcript from: {url}")
        try:
            # 1. Fetch base page
            # 1. Fetch base page using requests (better headers control than trafilatura)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            try:
                resp = requests.get(url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    logger.error(f"Failed to fetch URL: {url} Status: {resp.status_code}")
                    return None
                downloaded = resp.content
            except Exception as req_err:
                logger.error(f"Request failed for {url}: {req_err}")
                return None
                
            # Helper to extract content from HTML bytes
            def extract_content(html_bytes, base_url):
                # Try PDF extraction if bytes look like PDF signature
                if html_bytes.startswith(b'%PDF'):
                     try:
                         res = extract_text_from_file(html_bytes, "transcript.pdf")
                         return res.get('text', ''), 'pdf'
                     except:
                         return '', 'error'

                # HTML Extraction
                text = trafilatura.extract(
                    html_bytes, 
                    include_comments=False,
                    include_tables=False,
                    favor_precision=True,
                    deduplicate=True
                )
                return text or '', 'html'

            # Extract Main Page Content
            main_text, type_ = extract_content(downloaded, url)
            
            # 2. Link Discovery (The "Agent" part)
            # Find links that might be the "Real" transcript
            # Keywords: "manuskript", "transcript", "druckfassung", ".pdf", "lesen"
            
            candidates = []
            
            # Parse HTML for links (using lxml for speed and because trafilatura uses it)
            from lxml import html
            try:
                tree = html.fromstring(downloaded)
                links = tree.xpath('//a[@href]')
                
                for link in links:
                    href = link.get('href')
                    text = (link.text_content() or "").lower()
                    
                    full_url = urljoin(url, href)
                    
                    # Heuristics for a "Better Transcript" link
                    score = 0
                    if 'pdf' in href.lower(): score += 5
                    if 'manus' in text or 'manus' in href.lower(): score += 10 # Manuskript
                    if 'transkript' in text or 'transcript' in text: score += 10
                    if 'text' in text and 'lesen' in text: score += 3
                    
                    if score >= 5:
                        candidates.append((score, full_url))
                        
                # Sort by score descending
                candidates.sort(key=lambda x: x[0], reverse=True)
                
            except Exception as e:
                logger.warning(f"Link parsing failed: {e}")

            # 3. Evaluate Top Candidates (Limit to top 3 to verify)
            best_text = main_text
            best_source = url
            
            # If main text is short (summary), be broader in search
            if len(main_text) < 1000:
                logger.info("Main text is short. Hunting for better transcript...")
                
                for score, cand_url in candidates[:3]: # Check top 3
                    logger.info(f"Checking candidate: {cand_url} (Score: {score})")
                    try:
                        resp = requests.get(cand_url, timeout=10)
                        if resp.status_code == 200:
                            cand_text, cand_type = extract_content(resp.content, cand_url)
                            
                            logger.info(f"Candidate {cand_url} length: {len(cand_text)}")
                            
                            # If candidate is significantly longer, take it
                            if len(cand_text) > len(best_text) + 500:
                                best_text = cand_text
                                best_source = cand_url
                                if cand_type == 'pdf':
                                    best_text = f"# Transcript from PDF ({cand_url})\n\n{best_text}"
                                else:
                                    best_text = f"# Transcript from Linked Page ({cand_url})\n\n{best_text}"
                                break # Found a winner, stop
                    except Exception as err:
                        logger.error(f"Failed to check candidate {cand_url}: {err}")
            
            return best_text if len(best_text) > 50 else None
                
        except Exception as e:
            logger.error(f"Scraping error for {url}: {str(e)}")
            return None
