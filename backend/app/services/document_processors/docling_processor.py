"""
Docling Document Processor
Uses LangChain's Docling integration for high-quality document parsing
Supports: PDF, DOCX, PPTX, HTML, XLSX
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


class DoclingProcessor(BaseDocumentProcessor):
    """
    Document processor using IBM's Docling via LangChain integration.
    
    Docling provides:
    - AI-powered layout analysis
    - Rich metadata extraction (page numbers, headings, bounding boxes)
    - Native hierarchical chunking
    - Support for PDF, DOCX, PPTX, HTML, XLSX
    """
    
    processor_type = ProcessorType.DOCLING
    supported_formats = [
        SupportedFormat.PDF,
        SupportedFormat.DOCX,
        SupportedFormat.DOC,
        SupportedFormat.PPTX,
        SupportedFormat.PPT,
        SupportedFormat.HTML,
        SupportedFormat.XLSX,
        SupportedFormat.XLS,
    ]
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, use_gpu: bool = False):
        super().__init__(chunk_size, chunk_overlap)
        self.use_gpu = use_gpu
        self._loader_class = None
        self._export_type = None
    
    def _lazy_import(self):
        """Lazy import to avoid loading heavy dependencies until needed"""
        if self._loader_class is None:
            try:
                from langchain_docling import DoclingLoader
                from langchain_docling.loader import ExportType
                self._loader_class = DoclingLoader
                self._export_type = ExportType
                logger.info("Docling loader initialized successfully")
            except ImportError as e:
                logger.error(f"Failed to import langchain-docling: {e}")
                raise ImportError(
                    "langchain-docling is required. Install with: pip install langchain-docling"
                ) from e
    
    def supports_format(self, file_extension: str) -> bool:
        """Check if Docling supports this format"""
        ext = file_extension.lower().lstrip('.')
        return ext in [f.value for f in self.supported_formats]
    
    async def process(
        self,
        file_path: str,
        file_url: Optional[str] = None,
        use_chunking: bool = True,
        **kwargs
    ) -> ProcessedDocument:
        """
        Process document using Docling.
        
        Args:
            file_path: Path to the document file
            file_url: Optional URL to fetch document from
            use_chunking: Whether to use Docling's native chunking
            
        Returns:
            ProcessedDocument with chunks and metadata
        """
        start_time = time.time()
        self._lazy_import()
        
        # Run in thread pool since Docling is CPU-intensive
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._process_sync,
            file_path,
            file_url,
            use_chunking
        )
        
        result.processing_time = time.time() - start_time
        logger.info(
            "Document processed with Docling",
            file_path=file_path,
            chunks=len(result.chunks),
            processing_time=result.processing_time
        )
        return result
    
    def _process_sync(
        self,
        file_path: str,
        file_url: Optional[str],
        use_chunking: bool
    ) -> ProcessedDocument:
        """Synchronous processing (runs in thread pool)"""
        source = file_url or file_path
        
        # Configure export type based on chunking preference
        export_type = (
            self._export_type.DOC_CHUNKS if use_chunking 
            else self._export_type.MARKDOWN
        )
        
        # Create loader with configuration
        loader = self._loader_class(
            file_path=source,
            export_type=export_type,
        )
        
        # Load documents
        documents = loader.load()
        
        # Extract chunks with rich metadata
        chunks: List[DocumentChunk] = []
        raw_text_parts = []
        
        for idx, doc in enumerate(documents):
            content = doc.page_content
            raw_text_parts.append(content)
            
            # Extract Docling-specific metadata
            metadata = doc.metadata or {}
            chunk = DocumentChunk(
                content=content,
                chunk_index=idx,
                metadata=metadata,
                page_number=metadata.get("page_number") or metadata.get("dl_meta", {}).get("page_no"),
                heading=metadata.get("heading") or metadata.get("dl_meta", {}).get("heading"),
                section=metadata.get("section"),
                bounding_box=metadata.get("bounding_box") or metadata.get("dl_meta", {}).get("bbox"),
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
            metadata={"source": source, "export_type": str(export_type)},
        )
    
    def _extract_page_count(self, documents) -> Optional[int]:
        """Extract page count from document metadata"""
        max_page = 0
        for doc in documents:
            meta = doc.metadata or {}
            page = meta.get("page_number") or meta.get("dl_meta", {}).get("page_no", 0)
            if isinstance(page, int) and page > max_page:
                max_page = page
        return max_page if max_page > 0 else None

