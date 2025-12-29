"""
Document Processor Factory
Selects the appropriate document processor based on file type
"""
from typing import Optional, Dict, Type
import structlog

from .base import (
    BaseDocumentProcessor, ProcessedDocument, ProcessorType, SupportedFormat,
    ImageProcessor, VideoProcessor, AudioProcessor
)
from .docling_processor import DoclingProcessor
from .unstructured_processor import UnstructuredProcessor

logger = structlog.get_logger()


# Mapping of file extensions to preferred processor
EXTENSION_PROCESSOR_MAP: Dict[str, ProcessorType] = {
    # Docling-preferred formats (better quality for these)
    "pdf": ProcessorType.DOCLING,
    "docx": ProcessorType.DOCLING,
    "doc": ProcessorType.DOCLING,
    "pptx": ProcessorType.DOCLING,
    "ppt": ProcessorType.DOCLING,
    "html": ProcessorType.DOCLING,
    "htm": ProcessorType.DOCLING,
    "xlsx": ProcessorType.DOCLING,
    "xls": ProcessorType.DOCLING,
    # Unstructured-preferred formats
    "txt": ProcessorType.UNSTRUCTURED,
    "md": ProcessorType.UNSTRUCTURED,
    "markdown": ProcessorType.UNSTRUCTURED,
    "rst": ProcessorType.UNSTRUCTURED,
    "csv": ProcessorType.UNSTRUCTURED,
    # Future formats (not yet implemented)
    "png": ProcessorType.IMAGE_OCR,
    "jpg": ProcessorType.IMAGE_OCR,
    "jpeg": ProcessorType.IMAGE_OCR,
    "gif": ProcessorType.IMAGE_OCR,
    "webp": ProcessorType.IMAGE_OCR,
    "mp4": ProcessorType.VIDEO,
    "webm": ProcessorType.VIDEO,
    "mp3": ProcessorType.AUDIO,
    "wav": ProcessorType.AUDIO,
}


class DocumentProcessorFactory:
    """
    Factory for creating document processors.
    
    Uses Docling as primary processor for rich document formats (PDF, DOCX, PPTX, HTML)
    Falls back to Unstructured for text-based formats or when Docling fails.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._processors: Dict[ProcessorType, BaseDocumentProcessor] = {}
    
    def _get_or_create_processor(self, processor_type: ProcessorType) -> BaseDocumentProcessor:
        """Get or create a processor instance"""
        if processor_type not in self._processors:
            if processor_type == ProcessorType.DOCLING:
                self._processors[processor_type] = DoclingProcessor(
                    chunk_size=self.chunk_size,
                    chunk_overlap=self.chunk_overlap
                )
            elif processor_type == ProcessorType.UNSTRUCTURED:
                self._processors[processor_type] = UnstructuredProcessor(
                    chunk_size=self.chunk_size,
                    chunk_overlap=self.chunk_overlap
                )
            elif processor_type == ProcessorType.IMAGE_OCR:
                self._processors[processor_type] = ImageProcessor(
                    chunk_size=self.chunk_size,
                    chunk_overlap=self.chunk_overlap
                )
            elif processor_type == ProcessorType.VIDEO:
                self._processors[processor_type] = VideoProcessor(
                    chunk_size=self.chunk_size,
                    chunk_overlap=self.chunk_overlap
                )
            elif processor_type == ProcessorType.AUDIO:
                self._processors[processor_type] = AudioProcessor(
                    chunk_size=self.chunk_size,
                    chunk_overlap=self.chunk_overlap
                )
            else:
                raise ValueError(f"Unknown processor type: {processor_type}")
        return self._processors[processor_type]
    
    def get_processor_for_file(self, file_path: str) -> BaseDocumentProcessor:
        """
        Get the appropriate processor for a file based on its extension.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Appropriate document processor
        """
        ext = file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else ''
        processor_type = EXTENSION_PROCESSOR_MAP.get(ext, ProcessorType.UNSTRUCTURED)
        
        logger.debug(
            "Selected processor for file",
            file_path=file_path,
            extension=ext,
            processor=processor_type.value
        )
        
        return self._get_or_create_processor(processor_type)
    
    async def process_document(
        self,
        file_path: str,
        file_url: Optional[str] = None,
        force_processor: Optional[ProcessorType] = None,
        fallback_on_error: bool = True,
        **kwargs
    ) -> ProcessedDocument:
        """
        Process a document using the appropriate processor.
        
        Args:
            file_path: Path to the document
            file_url: Optional URL to fetch document from
            force_processor: Force use of a specific processor
            fallback_on_error: If True, fall back to Unstructured on Docling failure
            **kwargs: Additional arguments passed to processor
            
        Returns:
            ProcessedDocument with chunks and metadata
        """
        if force_processor:
            processor = self._get_or_create_processor(force_processor)
        else:
            processor = self.get_processor_for_file(file_path)
        
        try:
            return await processor.process(file_path, file_url, **kwargs)
        except Exception as e:
            logger.warning(
                "Primary processor failed",
                processor=processor.processor_type.value,
                error=str(e)
            )
            
            # Fall back to Unstructured if Docling fails
            if fallback_on_error and processor.processor_type == ProcessorType.DOCLING:
                logger.info("Falling back to Unstructured processor")
                fallback = self._get_or_create_processor(ProcessorType.UNSTRUCTURED)
                return await fallback.process(file_path, file_url, **kwargs)
            
            raise


# Convenience function for simple usage
_default_factory: Optional[DocumentProcessorFactory] = None


def get_document_processor(
    file_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> BaseDocumentProcessor:
    """
    Get a document processor for the given file.
    
    Args:
        file_path: Path to the file
        chunk_size: Size of text chunks
        chunk_overlap: Overlap between chunks
        
    Returns:
        Appropriate document processor
    """
    global _default_factory
    if _default_factory is None or (
        _default_factory.chunk_size != chunk_size or 
        _default_factory.chunk_overlap != chunk_overlap
    ):
        _default_factory = DocumentProcessorFactory(chunk_size, chunk_overlap)
    return _default_factory.get_processor_for_file(file_path)

