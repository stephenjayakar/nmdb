from dataclasses import dataclass
from datetime import datetime
import base64
import hashlib

@dataclass
class Message:
    sender: str
    message: str
    timestamp: datetime

    def __repr__(self):
        return f'{self.timestamp} {self.sender}: {self.message}'

    def is_complete(self):
        return self.sender != None and self.message != None and self.timestamp != None

    def hash(self):
        if not self.is_complete():
            raise Exception("can't hash an incomplete message")
        return hashlib.md5(self.__repr__().encode()).digest()

    # Dict that's used for JSON serialization
    def to_dict(self):
        b64_hash = base64.b64encode(self.hash()).decode()

        return {
            "id": b64_hash,
            "message": self.message,
            "sender": self.sender,
            "timestamp": str(self.timestamp),
        }
