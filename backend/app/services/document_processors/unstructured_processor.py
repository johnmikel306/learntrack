"""
Unstructured Document Processor
Uses LangChain's Unstructured integration as fallback processor
Supports: PDF, DOCX, PPTX, HTML, TXT, MD, and more
"""
import time
import asyncio
from typing import Optional, List
import structlog

from .base import (
    BaseDocumentProcessor, ProcessedDocument, DocumentChunk,
    ProcessorType, SupportedFormat
)

logger = structlog.get_logger()


class UnstructuredProcessor(BaseDocumentProcessor):
    """
    Document processor using Unstructured via LangChain integration.
    
    Unstructured provides:
    - Broad format support
    - Multiple chunking strategies (basic, by_title)
    - Element-based parsing
    - Good fallback for formats Docling doesn't handle well
    """
    
    processor_type = ProcessorType.UNSTRUCTURED
    supported_formats = [
        SupportedFormat.PDF,
        SupportedFormat.DOCX,
        SupportedFormat.DOC,
        SupportedFormat.PPTX,
        SupportedFormat.PPT,
        SupportedFormat.HTML,
        SupportedFormat.TXT,
        SupportedFormat.MD,
        SupportedFormat.XLSX,
        SupportedFormat.XLS,
    ]
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        chunking_strategy: str = "by_title"
    ):
        super().__init__(chunk_size, chunk_overlap)
        self.chunking_strategy = chunking_strategy
        self._loader_class = None
    
    def _lazy_import(self):
        """Lazy import to avoid loading heavy dependencies until needed"""
        if self._loader_class is None:
            try:
                from langchain_unstructured import UnstructuredLoader
                self._loader_class = UnstructuredLoader
                logger.info("Unstructured loader initialized successfully")
            except ImportError as e:
                logger.error(f"Failed to import langchain-unstructured: {e}")
                raise ImportError(
                    "langchain-unstructured is required. Install with: pip install langchain-unstructured"
                ) from e
    
    def supports_format(self, file_extension: str) -> bool:
        """Check if Unstructured supports this format"""
        ext = file_extension.lower().lstrip('.')
        return ext in [f.value for f in self.supported_formats]
    
    async def process(
        self,
        file_path: str,
        file_url: Optional[str] = None,
        chunking_strategy: Optional[str] = None,
        **kwargs
    ) -> ProcessedDocument:
        """
        Process document using Unstructured.
        
        Args:
            file_path: Path to the document file
            file_url: Optional URL to fetch document from
            chunking_strategy: Override default chunking strategy ('basic' or 'by_title')
            
        Returns:
            ProcessedDocument with chunks and metadata
        """
        start_time = time.time()
        self._lazy_import()
        
        strategy = chunking_strategy or self.chunking_strategy
        
        # Run in thread pool since Unstructured can be CPU-intensive
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._process_sync,
            file_path,
            file_url,
            strategy
        )
        
        result.processing_time = time.time() - start_time
        logger.info(
            "Document processed with Unstructured",
            file_path=file_path,
            chunks=len(result.chunks),
            processing_time=result.processing_time
        )
        return result
    
    def _process_sync(
        self,
        file_path: str,
        file_url: Optional[str],
        chunking_strategy: str
    ) -> ProcessedDocument:
        """Synchronous processing (runs in thread pool)"""
        source = file_url or file_path
        
        # Create loader with chunking configuration
        loader_kwargs = {
            "chunking_strategy": chunking_strategy,
            "max_characters": self.chunk_size,
            "overlap": self.chunk_overlap,
        }
        
        # Handle URL vs file path
        if file_url:
            loader = self._loader_class(web_url=file_url, **loader_kwargs)
        else:
            loader = self._loader_class(file_path, **loader_kwargs)
        
        # Load documents
        documents = loader.load()
        
        # Extract chunks with metadata
        chunks: List[DocumentChunk] = []
        raw_text_parts = []
        
        for idx, doc in enumerate(documents):
            content = doc.page_content
            raw_text_parts.append(content)
            
            metadata = doc.metadata or {}
            chunk = DocumentChunk(
                content=content,
                chunk_index=idx,
                metadata=metadata,
                page_number=metadata.get("page_number"),
                heading=metadata.get("category"),  # Unstructured uses 'category' for element type
                section=metadata.get("parent_id"),
            )
            chunks.append(chunk)
        
        raw_text = "\n\n".join(raw_text_parts)
        file_ext = self.get_file_extension(file_path)
        file_name = file_path.rsplit('/', 1)[-1].rsplit('\\', 1)[-1]
        
        return ProcessedDocument(
            file_path=file_path,
            file_name=file_name,
            file_type=file_ext,
            processor_used=self.processor_type,
            chunks=chunks,
            raw_text=raw_text,
            character_count=len(raw_text),
            token_estimate=self.estimate_tokens(raw_text),
            content_hash=ProcessedDocument.compute_hash(raw_text),
            page_count=self._extract_page_count(documents),
            metadata={"source": source, "chunking_strategy": chunking_strategy},
        )
    
    def _extract_page_count(self, documents) -> Optional[int]:
        """Extract page count from document metadata"""
        max_page = 0
        for doc in documents:
            meta = doc.metadata or {}
            page = meta.get("page_number", 0)
            if isinstance(page, int) and page > max_page:
                max_page = page
        return max_page if max_page > 0 else None

