"""
Basic metrics collection for monitoring.
Collects request count, response time, and error rate.
"""
import time
from collections import defaultdict
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from threading import Lock
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
import structlog

logger = structlog.get_logger()


@dataclass
class EndpointMetrics:
    """Metrics for a single endpoint"""
    request_count: int = 0
    total_response_time: float = 0.0
    error_count: int = 0
    status_codes: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    
    @property
    def avg_response_time(self) -> float:
        if self.request_count == 0:
            return 0.0
        return self.total_response_time / self.request_count
    
    @property
    def error_rate(self) -> float:
        if self.request_count == 0:
            return 0.0
        return self.error_count / self.request_count


class MetricsCollector:
    """Thread-safe metrics collector"""
    
    def __init__(self):
        self._metrics: Dict[str, EndpointMetrics] = defaultdict(EndpointMetrics)
        self._global_metrics = EndpointMetrics()
        self._lock = Lock()
        self._start_time = datetime.utcnow()
    
    def record_request(
        self,
        path: str,
        method: str,
        status_code: int,
        response_time: float
    ):
        """Record a request's metrics"""
        endpoint_key = f"{method}:{path}"
        is_error = status_code >= 400
        
        with self._lock:
            # Update endpoint-specific metrics
            endpoint = self._metrics[endpoint_key]
            endpoint.request_count += 1
            endpoint.total_response_time += response_time
            endpoint.status_codes[status_code] += 1
            if is_error:
                endpoint.error_count += 1
            
            # Update global metrics
            self._global_metrics.request_count += 1
            self._global_metrics.total_response_time += response_time
            self._global_metrics.status_codes[status_code] += 1
            if is_error:
                self._global_metrics.error_count += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all collected metrics"""
        with self._lock:
            uptime = (datetime.utcnow() - self._start_time).total_seconds()
            
            return {
                "uptime_seconds": uptime,
                "global": {
                    "total_requests": self._global_metrics.request_count,
                    "avg_response_time_ms": round(self._global_metrics.avg_response_time * 1000, 2),
                    "error_rate": round(self._global_metrics.error_rate * 100, 2),
                    "error_count": self._global_metrics.error_count,
                    "status_codes": dict(self._global_metrics.status_codes),
                },
                "endpoints": {
                    key: {
                        "request_count": m.request_count,
                        "avg_response_time_ms": round(m.avg_response_time * 1000, 2),
                        "error_rate": round(m.error_rate * 100, 2),
                        "error_count": m.error_count,
                    }
                    for key, m in self._metrics.items()
                },
                "requests_per_second": round(
                    self._global_metrics.request_count / uptime if uptime > 0 else 0, 2
                ),
            }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of metrics"""
        with self._lock:
            return {
                "total_requests": self._global_metrics.request_count,
                "avg_response_time_ms": round(self._global_metrics.avg_response_time * 1000, 2),
                "error_rate_percent": round(self._global_metrics.error_rate * 100, 2),
                "uptime_seconds": (datetime.utcnow() - self._start_time).total_seconds(),
            }
    
    def reset(self):
        """Reset all metrics"""
        with self._lock:
            self._metrics.clear()
            self._global_metrics = EndpointMetrics()
            self._start_time = datetime.utcnow()


# Global metrics collector instance
metrics_collector = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics"""
    
    def __init__(self, app, collector: Optional[MetricsCollector] = None):
        super().__init__(app)
        self.collector = collector or metrics_collector
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip metrics collection for health check endpoints
        if request.url.path in ["/health", "/health/ready", "/metrics"]:
            return await call_next(request)
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise
        finally:
            response_time = time.time() - start_time
            
            # Normalize path to avoid high cardinality (remove UUIDs)
            path = self._normalize_path(request.url.path)
            
            self.collector.record_request(
                path=path,
                method=request.method,
                status_code=status_code,
                response_time=response_time
            )
        
        return response
    
    def _normalize_path(self, path: str) -> str:
        """Normalize path by replacing IDs with placeholders"""
        import re
        # Replace UUIDs
        path = re.sub(
            r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '{id}',
            path,
            flags=re.IGNORECASE
        )
        # Replace MongoDB ObjectIds (24 hex chars)
        path = re.sub(r'/[0-9a-f]{24}(?=/|$)', '/{id}', path, flags=re.IGNORECASE)
        return path

