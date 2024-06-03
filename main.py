class Message:
    def __init__(self, sender: str, message: str, timestamp: str):
        # TODO: actually do more stuff
        self.sender = sender
        self.message = message
        self.timestamp = timestamp

    def __repr__(self):
        # TODO: ignoring timestamp
        return f'{self.sender}: {self.message}'


def parse_txt() -> list:
