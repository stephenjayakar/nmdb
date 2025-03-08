import json
import re
import csv
from datetime import datetime
from typing import List, Dict
import sys

from message import Message


def load_senders_map(csv_path: str) -> Dict[str, str]:
    """Load the sender mapping from CSV file."""
    senders_map = {}
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                senders_map[row[0]] = row[1]
    return senders_map


def clean_message_content(content: str) -> str:
    """Clean message content by removing reactions, link previews, file attachments, and handling edited text."""
    # Remove reactions section
    content = re.sub(r"Reactions:.*?(?=\n\n|\n$|$)", "", content, flags=re.DOTALL)

    # Remove "This message responded to an earlier message."
    content = re.sub(r"This message responded to an earlier message\.", "", content)

    # Handle file attachments
    file_pattern = r"/Users/.*?/([^/]+\.\w+)$"
    file_matches = re.search(file_pattern, content, re.MULTILINE)
    if file_matches:
        filename = file_matches.group(1)
        content = re.sub(
            r"/Users/.*?\.\w+[\s\S]*?(?=\n\n|\n$|$)",
            f"[sent file: {filename}]",
            content,
        )

    # Remove link previews
    content = re.sub(
        r"(https?://\S+)\n[^h].*?(?=\n\n|\n$|$)", r"\1", content, flags=re.DOTALL
    )

    # Clean up extra whitespace
    content = re.sub(r"\n{3,}", "\n\n", content)
    content = content.strip()

    # If there's an edited section, use only the text after "Edited ...:"
    edited_match = re.search(r"Edited\s.*?:\s*(.+)", content, flags=re.DOTALL)
    if edited_match:
        content = edited_match.group(1).strip()

    return content


def parse_messages(content: str, senders_map: Dict[str, str]) -> List[Message]:
    messages = []
    current_message = []
    timestamp = None
    sender = None
    had_nested = False  # Flag to mark if a nested block was encountered

    # Updated regex to enforce that nothing extra is on the line.
    timestamp_pattern = r"^(\w+ \d{1,2}, \d{4}\s+\d{1,2}:\d{2}:\d{2}(?: [APM]{2})?)(?: \(.*?\))?\s*$"

    lines = content.split("\n")

    for line in lines:
        if not line.strip():
            continue

        timestamp_match = re.match(timestamp_pattern, line)
        if timestamp_match:
            # Save the previous message if it exists.
            if timestamp and sender and current_message:
                message_content = "\n".join(current_message)
                clean_content = clean_message_content(message_content.strip())
                if clean_content:
                    dt = datetime.strptime(timestamp, "%b %d, %Y %I:%M:%S %p")
                    actual_sender = senders_map.get(sender, sender)
                    messages.append(Message(actual_sender, clean_content, dt))
            # Reset for the new message.
            timestamp = timestamp_match.group(1)
            current_message = []
            sender = None
            had_nested = False
        elif timestamp and not sender:
            # First non-timestamp line is the sender.
            sender = line.strip()
        elif timestamp and sender:
            # If the line is indented, mark that we had nested content and skip it.
            if line.startswith("    "):
                had_nested = True
                continue
            else:
                # If we've already seen nested lines, ignore any later non-indented lines.
                if had_nested:
                    continue
                current_message.append(line)
    # Save the final message.
    if timestamp and sender and current_message:
        message_content = "\n".join(current_message)
        clean_content = clean_message_content(message_content.strip())
        if clean_content:
            dt = datetime.strptime(timestamp, "%b %d, %Y %I:%M:%S %p")
            actual_sender = senders_map.get(sender, sender)
            messages.append(Message(actual_sender, clean_content, dt))
    return messages


def write_to_json(messages: List[Message], json_filename: str):
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump([m.to_dict() for m in messages], f, indent=2)


def main(filename=None):
    if filename is None:
        filename = sys.argv[1]
    filepath = f"../data_sources/{filename}.txt"
    json_filename = f"../output/{filename}.json"

    # Load sender mappings
    senders_map = load_senders_map("../data_sources/senders.csv")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    messages = parse_messages(content, senders_map)

    write_to_json(messages, json_filename)

    print(f"Converted {len(messages)} messages to JSON format.")


if __name__ == "__main__":
    main()
