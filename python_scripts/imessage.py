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
    """Clean message content by removing reactions, link previews, and formatting file attachments."""
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

    # Remove link previews (anything after a URL that describes the link)
    content = re.sub(
        r"(https?://\S+)\n[^h].*?(?=\n\n|\n$|$)", r"\1", content, flags=re.DOTALL
    )

    # Clean up any extra whitespace
    content = re.sub(r"\n{3,}", "\n\n", content)
    content = content.strip()

    return content


def parse_messages(content: str, senders_map: Dict[str, str]) -> List[Message]:
    # Pattern to match timestamp, sender, and content
    pattern = r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4} \d{1,2}:\d{2}:\d{2} (?:AM|PM))(?: \(.*?\))?\n([^\n]+)\n([\s\S]*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}|$)"

    matches = re.findall(pattern, content)

    messages = []
    for raw_timestamp, sender, content in matches:
        # Skip indented/nested messages
        if not content or content[0] == ' ':
            continue

        # Clean up the content
        clean_content = clean_message_content(content.strip())

        # Skip if content is empty after cleaning
        if not clean_content:
            continue

        # Convert timestamp to ISO 8601 format
        timestamp = datetime.strptime(raw_timestamp, "%b %d, %Y %I:%M:%S %p")

        # Map sender to the actual handle
        actual_sender = senders_map.get(sender, sender)

        message_data = Message(clean_content, actual_sender, timestamp)

        messages.append(message_data)

    return messages


def write_to_json(messages: List[Message], json_filename: str):
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump([m.to_dict() for m in messages], f, indent=2)

def main():
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
