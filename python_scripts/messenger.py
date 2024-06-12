from imessage import Message, get_senders

import json
import datetime

content_map = {
    'Ptt': '<sent voice message>',
    'Video': '<sent video>',
    'Image': '<sent image>',
    'Sticker': '<sent sticker>',
}


def unix_to_local_timestamp(unix_ts):
    dt = datetime.datetime.fromtimestamp(unix_ts)
    return str(dt)


def parse_messenger_json(messenger_dict):
    senders = get_senders()

    messages = []
    for message_dict in messenger_dict["messages"]:
        content = ''
        if message_dict['type'] != 'Text':
            content = content_map[message_dict['type']]
        else:
            content = message_dict["content"]
        sender = senders[message_dict["sender_name"]]

        timestamp = unix_to_local_timestamp(message_dict["timestamp"])
        messages.append(Message(sender, content, timestamp))

    messages.sort(key=lambda m: m.timestamp)
    return messages


def write_to_json(messages):
    with open(f'../output/messenger.json', 'w') as json_file:
        json_file.write(json.dumps([m.to_dict() for m in messages]))


if __name__ == '__main__':
    with open('../data_sources/messenger.json', 'r') as messenger_json_file:
        messenger_dict = json.loads(messenger_json_file.read())

    messages = parse_messenger_json(messenger_dict)
    write_to_json(messages)
