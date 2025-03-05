import sys
import collections
from collections import defaultdict
import re
from datetime import datetime, timedelta
import emoji
import json
from pathlib import Path
from message import load_messages_from_merged
import matplotlib.pyplot as plt

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
    for day in sorted(freq)[:5]:
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
    # Group messages by day.
    msg_by_day = collections.defaultdict(list)
    for msg in messages:
        msg_by_day[msg.timestamp.date()].append(msg)

    breakdown = {}   # holds per-sender averages for each day
    total_avg = {}   # holds the combined average response time for each day

    for day, day_msgs in msg_by_day.items():
        day_msgs.sort(key=lambda m: m.timestamp)
        stephen_total = 0
        stephen_count = 0
        nadia_total = 0
        nadia_count = 0
        prev_msg = None
        for m in day_msgs:
            if prev_msg and m.sender.lower() != prev_msg.sender.lower():
                diff = (m.timestamp - prev_msg.timestamp).total_seconds()
                if diff <= 86400:  
                    if m.sender.lower() == "stephen" and prev_msg.sender.lower() == "nadia":
                        stephen_total += diff
                        stephen_count += 1
                    elif m.sender.lower() == "nadia" and prev_msg.sender.lower() == "stephen":
                        nadia_total += diff
                        nadia_count += 1
            prev_msg = m

        if stephen_count > 0 or nadia_count > 0:
            stephen_avg = stephen_total / stephen_count if stephen_count > 0 else 0
            nadia_avg = nadia_total / nadia_count if nadia_count > 0 else 0
            combined_count = stephen_count + nadia_count
            combined_total = stephen_total + nadia_total
            combined_avg = combined_total / combined_count if combined_count > 0 else 0

            breakdown[day] = {"stephen": stephen_avg, "nadia": nadia_avg}
            total_avg[day] = combined_avg

    return breakdown, total_avg


def overall_average_response_time(messages):
    messages_sorted = sorted(messages, key=lambda m: m.timestamp)
    stephen_total = 0
    stephen_count = 0
    nadia_total = 0
    nadia_count = 0
    prev_msg = None
    for m in messages_sorted:
        if prev_msg and m.sender.lower() != prev_msg.sender.lower():
            diff = (m.timestamp - prev_msg.timestamp).total_seconds()
            if diff <= 86400:
                if m.sender.lower() == "stephen" and prev_msg.sender.lower() == "nadia":
                    stephen_total += diff
                    stephen_count += 1
                elif m.sender.lower() == "nadia" and prev_msg.sender.lower() == "stephen":
                    nadia_total += diff
                    nadia_count += 1
        prev_msg = m

    overall_stats = {}
    overall_stats["stephen"] = stephen_total / stephen_count if stephen_count > 0 else 0
    overall_stats["nadia"] = nadia_total / nadia_count if nadia_count > 0 else 0
    combined_count = stephen_count + nadia_count
    combined_total = stephen_total + nadia_total
    overall_stats["combined"] = combined_total / combined_count if combined_count > 0 else 0

    print("Overall response time averages:")
    print(f"Stephen responds in {overall_stats['stephen']:.2f} seconds on average")
    print(f"Nadia responds in {overall_stats['nadia']:.2f} seconds on average")
    print(f"Combined, responses average {overall_stats['combined']:.2f} seconds")
    return overall_stats


def detect_new_word_bursts(messages, save_to_png=False):
    """
    Detect words whose usage bursts after their first appearance.
    
    Only words with total usage > 25 and that appear only after the first two months are considered.
    Then, words are merged by “normalizing” them—collapsing consecutive duplicate letters.
    For example, if words like 'mrr' and 'mrrrr' occur, they will be grouped and reported as 'mrr*'.
    
    For each (grouped) word, usage counts are bucketed by month.
    A burst is detected when, for any month after the first month of appearance,
    the bucket reaches at least 5× the count in its first month.
    
    If save_to_png is True, the timeline for each bursting word group is saved as a PNG
    in the "../output" directory; otherwise, the plot is shown interactively.
    
    Returns:
       A dictionary of bursting series. Keys are the (possibly normalized) labels
       (e.g., "mrr" or "mrr*"), and values are dicts mapping month (datetime) to count.
    """

    # helper: collapse repeated letters.
    def normalize_word(word):
        # For example, 'mrrr' becomes 'mr' – note this simple method will collapse all runs.
        return re.sub(r'(.)\1+', r'\1', word)

    ascii_pattern = re.compile(r"\b[a-zA-Z]+\b")
    global_start = min(msg.timestamp for msg in messages)
    boundary_date = global_start + timedelta(days=60)

    # First pass: build counts per word per month (for each original word)
    word_month_counts = defaultdict(lambda: defaultdict(int))
    for msg in messages:
        if any(skip in msg.message for skip in skip_word_list):
            continue
        month_key = datetime(msg.timestamp.year, msg.timestamp.month, 1)
        words = ascii_pattern.findall(msg.message.lower())
        for word in words:
            word_month_counts[word][month_key] += 1

    # Detect bursting words in the original dictionary.
    bursting_words = {}
    for word, month_counts in word_month_counts.items():
        total_usage = sum(month_counts.values())
        if total_usage <= 25:
            continue
        months_sorted = sorted(month_counts.keys())
        if not months_sorted:
            continue
        # Consider only words that did NOT appear until after the first two months.
        first_month = months_sorted[0]
        if first_month < boundary_date:
            continue
        base_count = month_counts[first_month]
        burst_found = False
        for m in months_sorted[1:]:
            if month_counts[m] >= 5 * base_count:
                burst_found = True
                break
        if burst_found:
            bursting_words[word] = month_counts

    # Now, group similar bursting words using normalization.
    # For each original bursting word, compute its normalized form.
    # Then merge counts for words with the same normalized outcome.
    grouped_bursts = {}  # key: normalized word, value: tuple(set(original_words), merged_counts dict)
    for word, month_counts in bursting_words.items():
        norm = normalize_word(word)
        if norm not in grouped_bursts:
            # Create a copy of month_counts so later merging will work fine.
            grouped_bursts[norm] = (set([word]), dict(month_counts))
        else:
            orig_set, merged = grouped_bursts[norm]
            orig_set.add(word)
            for m, count in month_counts.items():
                merged[m] = merged.get(m, 0) + count

    # Create the final dictionary to return and plot.
    # For each group, if more than one word was merged or the original word doesn't equal the normalized version,
    # add an asterisk to indicate merging.
    final_bursts = {}
    for norm, (orig_set, merged_counts) in grouped_bursts.items():
        if len(orig_set) > 1 or any(word != norm for word in orig_set):
            label = norm + "*"
        else:
            label = norm
        final_bursts[label] = merged_counts

    # Plot timeline for each grouped bursting word.
    for label, month_counts in final_bursts.items():
        months_sorted = sorted(month_counts.keys())
        counts = [month_counts[m] for m in months_sorted]

        plt.figure()
        plt.plot(months_sorted, counts, marker='o', linestyle='-')
        plt.title(f"Usage Timeline for '{label}'")
        plt.xlabel("Month")
        plt.ylabel("Count")
        plt.xticks(rotation=45)
        plt.tight_layout()

        # if save_to_png:
        #     output_path = Path("../output")
        #     output_path.mkdir(parents=True, exist_ok=True)
        #     graph_file = output_path / f"{label}_burst.png"
        #     plt.savefig(graph_file)
        #     plt.close()
        #     print(f"Graph for bursting group '{label}' saved to {graph_file}")
        # else:
        #     plt.show()
        #     plt.close()

    if final_bursts:
        print("Bursting words (grouped) detected:")
        for label in final_bursts:
            print(f"  {label}")
    else:
        print("No bursting words were detected.")

    return final_bursts



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
elif argument == "hour":
    message_count_by_hour(messages)
elif argument == "burst":
    detect_new_word_bursts(messages)
elif argument == "all":
    # Run all analytics functions.
    tw = total_word_count(messages)
    msg_counts = message_counts(messages)
    nd = num_days(messages)
    mpd = messages_per_day(messages)
    ef = emoji_frequency(messages)
    wf = calculate_word_frequencies(messages)
    mfpdp = message_frequency_per_day_per_person(messages)
    mcbh = message_count_by_hour(messages)
    
    art_breakdown, art_total = average_response_time_per_day(messages)
    overall_rt = overall_average_response_time(messages)
    
    # Detect bursting words (plots are saved as PNG) and capture the series.
    bursting_words = detect_new_word_bursts(messages, save_to_png=False)
    # Convert bursting words month_counts to JSON serializable form.
    bursting_word_series = {}
    for word, month_counts in bursting_words.items():
        # Sort month_counts by date and convert datetime to string.
        series = [[m.strftime("%Y-%m-%d"), count] for m, count in sorted(month_counts.items())]
        bursting_word_series[word] = series

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
            str(day): art_breakdown[day] for day in sorted(art_breakdown)
        },
        "average_total_response_time_per_day": {
            str(day): art_total[day] for day in sorted(art_total)
        },
        "average_response_time_overall": overall_rt,
        "bursting_word_series": bursting_word_series,  # New data series added
    }

    output_path = Path("../output/analytics.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump([json_results], f, ensure_ascii=False, indent=2)

    print(f"Analytics JSON written to {output_path}")
else:
    print(
        "Please specify one of the valid arguments: totals, emoji, words, person-day, hour, all, burst"
    )
