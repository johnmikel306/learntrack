"""
RAG (Retrieval-Augmented Generation) Service
Handles document processing, embedding, and retrieval using Qdrant
"""
import asyncio
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import structlog
import httpx

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import UnstructuredFileLoader, PyPDFLoader, TextLoader
from langchain.schema import Document
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.models.file import UploadedFile, EmbeddingStatus

logger = structlog.get_logger()


class RAGService:
    """RAG service for document processing and retrieval"""

    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.db = db
        self.qdrant_client = None
        self.embedding_dimension = 1536
        self._initialize_qdrant()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""]
        )

    def _initialize_qdrant(self):
        """Initialize Qdrant client"""
        try:
            qdrant_url = getattr(settings, 'QDRANT_URL', None)
            qdrant_api_key = getattr(settings, 'QDRANT_API_KEY', None)
            if qdrant_url:
                self.qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
            else:
                self.qdrant_client = QdrantClient(":memory:")
                logger.info("Using in-memory Qdrant client for development")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant client: {e}")
            self.qdrant_client = None

    async def create_tutor_collection(self, tutor_id: str) -> str:
        """Create isolated Qdrant collection for tutor"""
        collection_name = f"tutor_{tutor_id.replace('-', '_')}"
        if not self.qdrant_client:
            logger.error("Qdrant client not initialized")
            return collection_name
        try:
            collections = self.qdrant_client.get_collections()
            existing_names = [c.name for c in collections.collections]
            if collection_name not in existing_names:
                self.qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=self.embedding_dimension, distance=Distance.COSINE)
                )
                logger.info(f"Created Qdrant collection: {collection_name}")
            return collection_name
        except Exception as e:
            logger.error(f"Failed to create collection for tutor {tutor_id}: {e}")
            raise

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings using OpenAI API"""
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.embeddings.create(model="text-embedding-3-small", input=texts)
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"Failed to get embeddings: {e}")
            raise

    async def process_document(
        self, file_path: str, file_id: str, tutor_id: str, file_url: str = None
    ) -> Dict[str, Any]:
        """Process document and store in vector database"""
        try:
            if self.db:
                await self._update_file_embedding_status(file_id, EmbeddingStatus.PROCESSING)
            content = await self._load_document(file_path, file_url)
            if not content:
                raise ValueError("Failed to load document content")
            chunks = self.text_splitter.split_text(content)
            logger.info(f"Split document into {len(chunks)} chunks")
            embeddings = await self.get_embeddings(chunks)
            collection_name = await self.create_tutor_collection(tutor_id)
            await self._store_embeddings(collection_name, file_id, chunks, embeddings, tutor_id)
            if self.db:
                await self._update_file_after_embedding(file_id, len(chunks), collection_name)
            return {"file_id": file_id, "chunks": len(chunks), "collection": collection_name, "status": "completed"}
        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            if self.db:
                await self._update_file_embedding_status(file_id, EmbeddingStatus.FAILED, str(e))
            raise

    async def _load_document(self, file_path: str, file_url: str = None) -> str:
        """Load document content from file or URL"""
        try:
            if file_url:
                async with httpx.AsyncClient() as client:
                    response = await client.get(file_url)
                    response.raise_for_status()
                    return response.text
            if file_path.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
            elif file_path.endswith('.txt'):
                loader = TextLoader(file_path)
            else:
                loader = UnstructuredFileLoader(file_path)
            documents = loader.load()
            return "\n".join([doc.page_content for doc in documents])
        except Exception as e:
            logger.error(f"Failed to load document: {e}")
            return None

    async def _store_embeddings(
        self, collection_name: str, file_id: str, chunks: List[str],
        embeddings: List[List[float]], tutor_id: str
    ):
        """Store embeddings in Qdrant"""
        if not self.qdrant_client:
            logger.warning("Qdrant client not available, skipping storage")
            return
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(PointStruct(
                id=point_id, vector=embedding,
                payload={"file_id": file_id, "tutor_id": tutor_id, "chunk_index": i,
                         "content": chunk, "created_at": datetime.now(timezone.utc).isoformat()}
            ))
        self.qdrant_client.upsert(collection_name=collection_name, points=points)
        logger.info(f"Stored {len(points)} embeddings in {collection_name}")


    async def _update_file_embedding_status(self, file_id: str, status: EmbeddingStatus, error: str = None):
        """Update file embedding status in database"""
        update_data = {"embedding_status": status.value, "updated_at": datetime.now(timezone.utc)}
        if error:
            update_data["embedding_error"] = error
        await self.db.files.update_one({"_id": file_id}, {"$set": update_data})

    async def _update_file_after_embedding(self, file_id: str, chunk_count: int, collection_name: str):
        """Update file record after successful embedding"""
        await self.db.files.update_one(
            {"_id": file_id},
            {"$set": {
                "embedding_status": EmbeddingStatus.COMPLETED.value,
                "chunk_count": chunk_count,
                "qdrant_collection_id": collection_name,
                "last_embedded_at": datetime.now(timezone.utc),
                "embedding_model_used": "text-embedding-3-small"
            }}
        )

    async def retrieve_context(
        self, query: str, tutor_id: str, document_ids: List[str] = None, top_k: int = 5
    ) -> List[Document]:
        """Retrieve relevant context from tutor's documents"""
        if not self.qdrant_client:
            logger.warning("Qdrant client not available")
            return []
        try:
            collection_name = f"tutor_{tutor_id.replace('-', '_')}"
            query_embedding = (await self.get_embeddings([query]))[0]

            search_filter = None
            if document_ids:
                search_filter = Filter(
                    should=[FieldCondition(key="file_id", match=MatchValue(value=doc_id)) for doc_id in document_ids]
                )

            results = self.qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=top_k,
                query_filter=search_filter
            )

            documents = []
            for result in results:
                doc = Document(
                    page_content=result.payload.get("content", ""),
                    metadata={
                        "file_id": result.payload.get("file_id"),
                        "chunk_index": result.payload.get("chunk_index"),
                        "score": result.score
                    }
                )
                documents.append(doc)
            return documents
        except Exception as e:
            logger.error(f"Context retrieval failed: {e}")
            return []

    async def delete_file_embeddings(self, file_id: str, tutor_id: str):
        """Delete embeddings for a specific file"""
        if not self.qdrant_client:
            return
        try:
            collection_name = f"tutor_{tutor_id.replace('-', '_')}"
            self.qdrant_client.delete(
                collection_name=collection_name,
                points_selector=Filter(must=[FieldCondition(key="file_id", match=MatchValue(value=file_id))])
            )
            logger.info(f"Deleted embeddings for file {file_id}")
        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")

    async def delete_tutor_data(self, tutor_id: str):
        """Delete all tutor data from Qdrant"""
        if not self.qdrant_client:
            return
        collection_name = f"tutor_{tutor_id.replace('-', '_')}"
        try:
            self.qdrant_client.delete_collection(collection_name)
            logger.info(f"Deleted collection {collection_name}")
        except Exception as e:
            logger.error(f"Failed to delete collection for tutor {tutor_id}: {e}")

    async def get_collection_stats(self, tutor_id: str) -> Dict[str, Any]:
        """Get statistics for tutor's collection"""
        if not self.qdrant_client:
            return {"points_count": 0, "segments_count": 0}
        try:
            collection_name = f"tutor_{tutor_id.replace('-', '_')}"
            info = self.qdrant_client.get_collection(collection_name)
            return {"points_count": info.points_count, "segments_count": info.segments_count, "status": info.status.value}
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {"points_count": 0, "segments_count": 0}