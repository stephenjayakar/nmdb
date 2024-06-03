from datetime import datetime, timedelta
import re

class Message:
    def __init__(self, sender: str, message: str, timestamp: str):
        self.sender = sender
        self.message = message
        self.timestamp = timestamp

    def __repr__(self):
        return f'{self.sender}: {self.message}'


def get_senders() -> {}:
    with open('data_sources/senders.csv', 'r') as senders_file:
        senders_contents = senders_file.read()
    senders = {}
    for sender_line in senders_contents.split('\n'):
        alias, name = sender_line.split(',')
        senders[alias] = name
    return senders

def parse_txt(all_messages: str) -> list:
    # TODO: kind of clowny
    senders = get_senders()

    messages = []
    # 0 = LF DATE
    # 1 = LF SENDER
    # 2 = LF TEXT, IGNORING TABBED
    # two spaces and then a date means back to 0
    state = 0
    sender = None
    message = None
    for line in all_messages.split('\n'):
        
    return messages


with open('data_sources/2.txt', 'r') as text_file:
    text = text_file.read()
messages = parse_txt(text)
for message in messages:
    print(message)
