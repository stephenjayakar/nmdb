import json
from datetime import datetime, timedelta

def parse_date(date_str):
    return datetime.fromisoformat(date_str)

def get_messages_around_date(messages, target_date_str, days_range=1):
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d')
    start_date = target_date - timedelta(days=days_range)
    end_date = target_date + timedelta(days=days_range + 1)
    
    filtered_messages = [m for m in messages if start_date <= parse_date(m['timestamp']) < end_date]
    return filtered_messages

def print_messages_grouped_by_day(messages):
    messages_by_day = {}
    
    for message in messages:
        date_str = parse_date(message['timestamp']).strftime('%Y-%m-%d')
        if date_str not in messages_by_day:
            messages_by_day[date_str] = []
        messages_by_day[date_str].append(message)
        
    for day, msgs in sorted(messages_by_day.items()):
        print(f"Date: {day}, Number of messages: {len(msgs)}")
        for msg in msgs:
            print(f"  [{msg['timestamp']}] {msg['sender']}: {msg['message']}")
        print()

import sys
def main():
    with open('../output/merged.json', 'r') as f:
        messages = json.load(f)

    target_date = sys.argv[1]
    days_range = int(sys.argv[2])
    
    around_messages = get_messages_around_date(messages, target_date, days_range)
    print_messages_grouped_by_day(around_messages)

if __name__ == "__main__":
    main()
