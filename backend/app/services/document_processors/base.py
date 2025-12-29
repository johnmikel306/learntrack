"""
Base Document Processor
Abstract base class for all document processors
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime, timezone
import hashlib


class ProcessorType(str, Enum):
    """Document processor types"""
    DOCLING = "docling"
    UNSTRUCTURED = "unstructured"
    PYPDF = "pypdf"
    TEXT = "text"
    IMAGE_OCR = "image_ocr"
    VIDEO = "video"
    AUDIO = "audio"


class SupportedFormat(str, Enum):
    """Supported document formats"""
    PDF = "pdf"
    DOCX = "docx"
    DOC = "doc"
    PPTX = "pptx"
    PPT = "ppt"
    HTML = "html"
    TXT = "txt"
    MD = "md"
    XLSX = "xlsx"
    XLS = "xls"
    # Future formats (boilerplate)
    PNG = "png"
    JPG = "jpg"
    JPEG = "jpeg"
    GIF = "gif"
    WEBP = "webp"
    MP4 = "mp4"
    WEBM = "webm"
    MP3 = "mp3"
    WAV = "wav"


@dataclass
class DocumentChunk:
    """Represents a chunk of processed document"""
    content: str
    chunk_index: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    # Rich metadata from Docling
    page_number: Optional[int] = None
    heading: Optional[str] = None
    section: Optional[str] = None
    bounding_box: Optional[Dict[str, float]] = None
    
    @property
    def token_estimate(self) -> int:
        """Estimate token count (rough: ~4 chars per token)"""
        return len(self.content) // 4


@dataclass
class ProcessedDocument:
    """Result of document processing"""
    file_path: str
    file_name: str
    file_type: str
    processor_used: ProcessorType
    chunks: List[DocumentChunk]
    raw_text: str
    character_count: int
    token_estimate: int
    content_hash: str
    page_count: Optional[int] = None
    processing_time: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    processed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def compute_hash(cls, content: str) -> str:
        """Compute SHA-256 hash of content"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()


class BaseDocumentProcessor(ABC):
    """Abstract base class for document processors"""
    
    processor_type: ProcessorType
    supported_formats: List[SupportedFormat]
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    @abstractmethod
    async def process(
        self,
        file_path: str,
        file_url: Optional[str] = None,
        **kwargs
    ) -> ProcessedDocument:
        """Process a document and return structured result"""
        pass
    
    @abstractmethod
    def supports_format(self, file_extension: str) -> bool:
        """Check if this processor supports the given format"""
        pass
    
    def get_file_extension(self, file_path: str) -> str:
        """Extract file extension from path"""
        return file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else ''
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text) // 4


# Boilerplate for future processors
class ImageProcessor(BaseDocumentProcessor):
    """Placeholder for image OCR processing (future implementation)"""
    processor_type = ProcessorType.IMAGE_OCR
    supported_formats = [SupportedFormat.PNG, SupportedFormat.JPG, 
                         SupportedFormat.JPEG, SupportedFormat.GIF, SupportedFormat.WEBP]
    
    async def process(self, file_path: str, file_url: Optional[str] = None, **kwargs) -> ProcessedDocument:
        raise NotImplementedError("Image OCR processing not yet implemented")
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() in [f.value for f in self.supported_formats]


class VideoProcessor(BaseDocumentProcessor):
    """Placeholder for video transcription (future implementation)"""
    processor_type = ProcessorType.VIDEO
    supported_formats = [SupportedFormat.MP4, SupportedFormat.WEBM]
    
    async def process(self, file_path: str, file_url: Optional[str] = None, **kwargs) -> ProcessedDocument:
        raise NotImplementedError("Video transcription not yet implemented")
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() in [f.value for f in self.supported_formats]


class AudioProcessor(BaseDocumentProcessor):
    """Placeholder for audio transcription (future implementation)"""
    processor_type = ProcessorType.AUDIO
    supported_formats = [SupportedFormat.MP3, SupportedFormat.WAV]
    
    async def process(self, file_path: str, file_url: Optional[str] = None, **kwargs) -> ProcessedDocument:
        raise NotImplementedError("Audio transcription not yet implemented")
    
    def supports_format(self, file_extension: str) -> bool:
        return file_extension.lower() in [f.value for f in self.supported_formats]

