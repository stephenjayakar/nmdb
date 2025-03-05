from message import load_messages_from_merged
import sys
import collections
import re


def find_time_gaps(messages, min_gap_days=1):
    """Find gaps in conversation that are longer than min_gap_days.
    Returns list of tuples (last_message, next_message, gap_in_days)"""
    if not messages:
        return []

    # Sort messages by timestamp
    sorted_msgs = sorted(messages, key=lambda x: x.timestamp)
    gaps = []

    for i in range(len(sorted_msgs) - 1):
        current_msg = sorted_msgs[i]
        next_msg = sorted_msgs[i + 1]

        time_diff = next_msg.timestamp - current_msg.timestamp
        gap_days = time_diff.total_seconds() / (24 * 3600)

        if gap_days > min_gap_days:
            gaps.append((current_msg, next_msg, gap_days))

    gaps.sort(key=lambda x: x[2])
    for g in gaps:
        print(g[0].timestamp, g[2])
    return gaps


def find_large_messages(messages, min_length=500):
    """Find messages that are longer than min_length characters"""
    large_messages = [msg for msg in messages if len(msg.message) > min_length]
    large_messages.sort(key=lambda x: -len(x.message))
    for m in large_messages:
        print(m)
        print()
    return large_messages

def calculate_word_frequencies(messages, top_n=10):
    """Calculate word frequencies from messages, using only ASCII words, and return the top N most frequent words."""
    word_counter = collections.Counter()
    ascii_pattern = re.compile(r'\b[a-zA-Z]+\b')  # Matches words with only ASCII letters

    for msg in messages:
        if '[' in msg.message and ']' in msg.message:
            continue
        if 'http' in msg.message:
            continue
        # Normalize text to lower case
        text = msg.message.lower()
        # Find all ASCII words
        words = ascii_pattern.findall(text)
        word_counter.update(words)

    return word_counter


def most_common(word_counter, top_n=10):
    # Get the most common words
    most_common_words = word_counter.most_common(top_n)
    for word, count in most_common_words:
        print(f"{word}: {count}")

    return most_common_words

argument = sys.argv[1]
messages = load_messages_from_merged()
frequencies = calculate_word_frequencies(messages)
if argument == "gap":
    gaps = find_time_gaps(messages)
elif argument == "large":
    find_large_messages(messages)
elif argument == 'top':
    most_common(frequencies, 100)
elif argument == 'write-freq':
    sorted_frequencies = list(sorted(frequencies.items(), key=lambda x: -x[1]))
    with open('frequencies.csv', 'w') as f:
        for word, count in sorted_frequencies:
            f.write(f'{word},{count}\n')
