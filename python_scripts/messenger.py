from message import Message
from imessage_old import get_senders

import json
import datetime


def unix_to_local_timestamp(unix_ts):
    seconds = unix_ts // 1000.0
    dt = datetime.datetime.fromtimestamp(seconds)
    return str(dt)


def parse_messenger_json(messenger_dict):
    senders = get_senders()

    messages = []
    for message_dict in messenger_dict["messages"]:
        content = ''
        # We're only parsing text & links
        if message_dict['type'] in ('placeholder', 'media'):
            continue
        else:
            content = message_dict["text"]

        # We don't need the CSV here as it's denormalized
        sender = message_dict["senderName"]
        sender = sender.split(' ')[0]

        # This is pretty arbitrary
        message_id = 'messenger-' + str(message_dict["timestamp"])
        timestamp = unix_to_local_timestamp(message_dict["timestamp"])
        messages.append(Message(
            sender,
            content,
            timestamp,
            message_id,
        ))

    messages.sort(key=lambda m: m.timestamp)
    return messages


def write_to_json(messages):
    with open(f'../output/messenger.json', 'w') as json_file:
        json_file.write(json.dumps([m.to_dict() for m in messages]))


def print_types(messenger_dict):
    types = set()
    for message_dict in messenger_dict['messages']:
        types.add(message_dict['type'])
    print(types)

if __name__ == '__main__':
    with open('../data_sources/messenger.json', 'r') as messenger_json_file:
        messenger_dict = json.loads(messenger_json_file.read())

    messages = parse_messenger_json(messenger_dict)
    write_to_json(messages)
