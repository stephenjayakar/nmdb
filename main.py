from datetime import datetime, timedelta
import re

class Message:
    def __init__(self, sender: str, message: str, timestamp: datetime):
        self.sender = sender
        self.message = message
        self.timestamp = timestamp

    def __repr__(self):
        return f'{self.timestamp} {self.sender}: {self.message}'

    def is_complete(self):
        return self.sender != None and self.message != None and self.timestamp != None


def get_senders() -> {}:
    with open('data_sources/senders.csv', 'r') as senders_file:
        senders_contents = senders_file.read()
    senders = {}
    for sender_line in senders_contents.split('\n'):
        alias, name = sender_line.split(',')
        senders[alias] = name
    return senders


timestamp_regex = r'\w+ \d+, \d+  \d+:\d\d:\d\d (AM|PM)'


def try_parse_timestamp(line) -> datetime:
    match = re.match(timestamp_regex, line)
    if match:
        ts = match.group(0)
        # TODO: no timezone, keeping it in PST
        dt = datetime.strptime(ts, '%b %d, %Y  %I:%M:%S %p')
        return dt
    else:
        return None


def parse_txt(all_messages: str) -> list:
    # TODO: kind of clowny
    senders = get_senders()

    messages = []
    # 0 = LF DATE
    # 1 = LF SENDER
    # 2 = LF TEXT, IGNORING TABBED
    # two spaces and then a date means back to 0
    state = 0
    # TODO: maybe abstract as `message_to_append`
    message_to_append = None
    # TODO: im not sure the best way to implement this state
    # machine. Think about it a bit.
    for line in all_messages.split('\n'):
        print(state, line)
        # State 2 can transition to 0, but we want to stay on the
        # line. Maybe abstract if there are multiple cases
        dt = try_parse_timestamp(line)
        if dt:
            if state == 1:
                raise Exception("should not have a dt here")

            if state == 2:
                # finish the previous message
                if not message_to_append.is_complete():
                    raise Exception(f"message is missing fields: {message_to_append}")
                messages.append(message_to_append)
                message_to_append = None
                state = 0
            # TODO: this is so sus control flow........
            if state == 0:
                message_to_append = Message(None, '', dt)
                state = 1
                continue
        if state == 0:
            raise Exception(f"was expecting a dt. line printed:\n{line}")
        elif state == 1:
            sender = senders[line]
            message_to_append.sender = sender
            state = 2
        elif state == 2:
            if len(line) == 0 or line[0] == ' ':
                continue
            to_add = line
            if len(message_to_append.message) != 0:
                to_add = '\n' + line
            message_to_append.message += to_add
        else:
            raise Exception(f"state value {state} is not between 0 and 2")
    if state == 2 and message_to_append:
        print('last message')
        if not message_to_append.is_complete():
            raise Exception(f'last message not complete\n{message_to_append}')
        messages.append(message_to_append)
    return messages


with open('data_sources/2.txt', 'r') as text_file:
    text = text_file.read()
messages = parse_txt(text)
for message in messages:
    print(message)
