from datetime import datetime, timedelta
import hashlib
import re
import base64
import json
import sys

file_prefix = '2'
if len(sys.argv) > 1:
    file_prefix = sys.argv[1]


class Message:
    def __init__(self, sender: str, message: str, timestamp: datetime):
        self.sender = sender
        self.message = message
        self.timestamp = timestamp

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


def get_senders() -> {}:
    with open('../data_sources/senders.csv', 'r') as senders_file:
        senders_contents = senders_file.read()
    senders = {}
    for sender_line in senders_contents.split('\n'):
        alias, name = sender_line.split(',')
        senders[alias] = name
    return senders


timestamp_regex = r'\w+ \d+, \d+\s+\d+:\d\d:\d\d (AM|PM)'


def try_parse_timestamp(line) -> datetime:
    match = re.match(timestamp_regex, line)
    if match:
        ts = match.group(0)
        # TODO: no timezone, keeping it in PST
        dt = datetime.strptime(ts, '%b %d, %Y  %I:%M:%S %p')
        return dt
    else:
        return None


url_regex = r'https?://(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)'


def try_parse_url(message):
    m = re.search(url_regex, message)
    if m:
        return m.group(0)


def parse_txt(all_messages: str) -> list:
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
        if not message_to_append.is_complete():
            raise Exception(f'last message not complete\n{message_to_append}')
        messages.append(message_to_append)

    ret_messages = []
    # message post-processing
    for message in messages:
        did_something = False
        old_message = message.message
        # remove reactions
        if 'Reactions:' in message.message:
            message.message = message.message.split('Reactions:')[0]
            did_something = True

        # remove link expansion
        possible_url = try_parse_url(message.message)
        if possible_url:
            message.message = possible_url
            did_something = True

        # remove files?
        if message.message.startswith('/Users/'):
            message.message = "<sent file>"
            did_something = True
        message.message = message.message.strip()

        if '\nThis message responded to an earlier message.' in message.message:
            did_something = True
            message.message = message.message.replace('\nThis message responded to an earlier message.', '')

        if not message.message == 'This message responded to an earlier message.':
            # remove message case (inverse)
            ret_messages.append(message)
        if did_something:
            # TODO: make it so this is dumped into a file
            print(f'post_processing did something!\nold message: {old_message}\nnew message: {message.message}\n')

    ret_messages.sort(key=lambda m: m.timestamp)
    return ret_messages


def find_message(messages, query):
    for message in messages:
        if query in message.message:
            print(message)


def write_to_json(messages):
    # json_dict = {
    #     "messages": [m.to_dict() for m in messages],
    # }
    with open(f'../output/{file_prefix}.json', 'w') as json_file:
        json_file.write(json.dumps([m.to_dict() for m in messages]))


if __name__ == '__main__':
    with open(f'../data_sources/{file_prefix}.txt', 'r') as text_file:
        text = text_file.read()
    messages = parse_txt(text)
    write_to_json(messages)
