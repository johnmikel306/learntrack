"""
WebSocket module for real-time chat
"""
from .socket_manager import sio, get_socket_app

__all__ = ["sio", "get_socket_app"]

