import json
from message import Message
from imessage import load_senders_map, write_to_json
import datetime

def apple_to_local_timestamp(apple_ts_ns):
    # Convert the timestamp to seconds
    seconds_since_apple_epoch = apple_ts_ns / 1e9
    # Apple's reference date: January 1, 2001
    apple_reference_date = datetime.datetime(2001, 1, 1)
    # Convert to local datetime
    dt = apple_reference_date + datetime.timedelta(seconds=seconds_since_apple_epoch)
    return str(dt)

def main():
    senders_map = load_senders_map("../data_sources/senders.csv")

    with open('../data_sources/imessage.json') as f:
        input_message_json = json.loads(f.read())

    messages_to_process = []

    for block in input_message_json:
        participants = block.get('participants')
        if participants is not None and len(participants) == 2:
            add_messages = True
            for participant in participants:
                if participant not in senders_map:
                    add_messages = False
            if add_messages:
                messages_to_process.extend(block.get('messages'))

    messages_to_process.sort(key=lambda x: x['timestamp'])

    messages = []

    id_set = set()
    for message in messages_to_process:
        message_type = message['type']
        if message_type != 'message':
            continue
        txt = message['text']
        if txt is None:
            continue
        txt = txt.replace('\ufffc', '')
        if not txt:
            continue

        message_id = message['id']
        if message_id in id_set:
            print(f'dupe id: {message_id}')
        else:
            id_set.add(message_id)
            ts = message['timestamp']
            sender = message['sender']
            messages.append(Message(
                senders_map.get(sender, sender),
                txt,
                apple_to_local_timestamp(ts),
                'imessage-' + message_id,
            ))


    # TODO: Count check
    print(f'total # of messages: {len(messages)}')

    write_to_json(messages, '../output/imessage.json')

