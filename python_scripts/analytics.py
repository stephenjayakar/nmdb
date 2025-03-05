from message import load_messages_from_merged
import sys
import collections
import re
from datetime import datetime, timedelta
import emoji
import json
from pathlib import Path

skip_word_list = [
    "[",
    "]",
    "http",
]


def total_word_count(messages):
    ascii_pattern = re.compile(r"\b[a-zA-Z]+\b")
    total = 0
    for msg in messages:
        if any(skip in msg.message for skip in skip_word_list):
            continue
        words = ascii_pattern.findall(msg.message)
        total += len(words)
    print(f"Total words: {total}")
    return total


def message_counts(messages):
    total = len(messages)
    nadia = sum(1 for msg in messages if msg.sender.lower() == "nadia")
    stephen = sum(1 for msg in messages if msg.sender.lower() == "stephen")
    print(f"Total messages: {total}")
    print(f"Nadia messages: {nadia}")
    print(f"Stephen messages: {stephen}")
    return total, nadia, stephen


def num_days(messages):
    if not messages:
        return 0
    dates = {msg.timestamp.date() for msg in messages}
    num = len(dates)
    print(f"Distinct days chatted: {num}")
    return num


def messages_per_day(messages):
    days = num_days(messages)
    total_msgs = len(messages)
    rate = total_msgs / days if days else 0
    print(f"Avg. messages per day: {rate:.2f}")
    return rate


def emoji_frequency(messages):
    emoji_counter = collections.Counter()

    for msg in messages:
        emojis_found = emoji.emoji_list(msg.message)
        emoji_counter.update([e["emoji"] for e in emojis_found])

    common_emojis = emoji_counter.most_common(100)
    print("Most common emojis:")
    for e, count in common_emojis:
        print(f"{e}: {count}")
    return common_emojis


def calculate_word_frequencies(messages, top_n=100):
    word_counter = collections.Counter()
    ascii_pattern = re.compile(r"\b[a-zA-Z]+\b")

    for msg in messages:
        if any(skip in msg.message for skip in skip_word_list):
            continue
        text = msg.message.lower()
        words = ascii_pattern.findall(text)
        word_counter.update(words)

    most_common_words = word_counter.most_common(top_n)
    print("Most common words:")
    for word, count in most_common_words:
        print(f"{word}: {count}")

    return most_common_words


def message_frequency_per_day_per_person(messages):
    freq = collections.defaultdict(lambda: collections.Counter())
    for msg in messages:
        day = msg.timestamp.date()
        person = msg.sender.lower()
        freq[day][person] += 1

    print("Message frequency per day per person (sample):")
    for day in sorted(freq)[:5]:  # only show first 5 days as sample
        print(f"{day}: {dict(freq[day])}")
    return freq


def message_count_by_hour(messages):
    hour_freq = collections.Counter()
    for msg in messages:
        hour = msg.timestamp.hour
        hour_freq[hour] += 1

    print("Messages per hour:")
    for hour, count in sorted(hour_freq.items()):
        print(f"{hour:02d}:00 - {count} messages")
    return hour_freq


def average_response_time_per_day(messages):
    # Group messages by day
    msg_by_day = collections.defaultdict(list)
    for msg in messages:
        msg_by_day[msg.timestamp.date()].append(msg)

    if not messages:
        return {}

    # Prepare result dictionary
    result = {}
    # Determine the full range of days from first to last message
    min_day = min(msg_by_day.keys())
    max_day = max(msg_by_day.keys())
    current_day = min_day

    while current_day <= max_day:
        if current_day in msg_by_day:
            # Sort messages for the day by timestamp
            day_msgs = sorted(msg_by_day[current_day], key=lambda m: m.timestamp)
            # Initialize separate accumulators for stephen and nadia
            stephen_total = 0
            stephen_count = 0
            nadia_total = 0
            nadia_count = 0
            prev_msg = None
            # Loop through messages for the day
            for m in day_msgs:
                if prev_msg is not None and m.sender.lower() != prev_msg.sender.lower():
                    diff = (m.timestamp - prev_msg.timestamp).total_seconds()
                    # If Stephen is replying to Nadia, attribute to Stephen
                    if m.sender.lower() == "stephen" and prev_msg.sender.lower() == "nadia":
                        stephen_total += diff
                        stephen_count += 1
                    # If Nadia is replying to Stephen, attribute to Nadia
                    elif m.sender.lower() == "nadia" and prev_msg.sender.lower() == "stephen":
                        nadia_total += diff
                        nadia_count += 1
                prev_msg = m

            stephen_avg = stephen_total / stephen_count if stephen_count > 0 else 0
            nadia_avg = nadia_total / nadia_count if nadia_count > 0 else 0
            result[current_day] = {"stephen": stephen_avg, "nadia": nadia_avg}
        else:
            result[current_day] = {"stephen": 0, "nadia": 0}
        current_day += timedelta(days=1)
    return result


argument = sys.argv[1]
messages = load_messages_from_merged()

if argument == "totals":
    total_word_count(messages)
    message_counts(messages)
    num_days(messages)
    messages_per_day(messages)
elif argument == "emoji":
    emoji_frequency(messages)
elif argument == "words":
    calculate_word_frequencies(messages, top_n=20)
elif argument == "person-day":
    message_frequency_per_day_per_person(messages)
elif argument == "all":
    # Call all analytics functions (prints output as before)
    tw = total_word_count(messages)
    msg_counts = message_counts(messages)
    nd = num_days(messages)
    mpd = messages_per_day(messages)
    ef = emoji_frequency(messages)
    wf = calculate_word_frequencies(messages)
    mfpdp = message_frequency_per_day_per_person(messages)
    mcbh = message_count_by_hour(messages)
    art = average_response_time_per_day(messages)  # our new calculation

    # Prepare JSON output. Note we convert some keys to strings for JSON compatibility.
    json_results = {
        "num_words_total": tw,
        "num_messages": {
            "total": msg_counts[0],
            "nadia": msg_counts[1],
            "stephen": msg_counts[2],
        },
        "num_days": nd,
        "messages_per_day": mpd,
        "emoji_frequency": [[e, count] for e, count in ef],
        "word_frequency": [[word, count] for word, count in wf],
        "message_frequency_per_day_per_person": {
            str(day): dict(counts) for day, counts in mfpdp.items()
        },
        "message_count_by_hour": {
            str(hour).zfill(2): count for hour, count in mcbh.items()
        },
        "average_response_time_per_day": {
            str(day): art[day] for day in sorted(art)
        },
    }

    # Write JSON output to ../output/analytics.json
    output_path = Path("../output/analytics.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump([json_results], f, ensure_ascii=False, indent=2)

    print(f"Analytics JSON written to {output_path}")

else:
    print(
        "Please specify one of the valid arguments: totals, emoji, words, person-day, hour, all"
    )
