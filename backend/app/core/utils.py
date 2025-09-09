"""
Utility functions for the LearnTrack application
"""
from typing import Union
from bson import ObjectId


def to_object_id(id_value: str) -> Union[ObjectId, str]:
    """
    Convert a string ID to ObjectId if it's a valid ObjectId format,
    otherwise return the original string.
    
    This helper standardizes ObjectId handling across all services
    to prevent database query failures.
    
    Args:
        id_value: String ID that may or may not be a valid ObjectId
        
    Returns:
        ObjectId if the string is a valid ObjectId format, otherwise the original string
    """
    if ObjectId.is_valid(id_value):
        return ObjectId(id_value)
    return id_value
