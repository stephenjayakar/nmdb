import json
import re
import base64
import hashlib
import csv
from typing import List, Dict


def hash_message(message_data: Dict) -> str:
    """Generate a hash for the message data."""
    message_str = (
        f"{message_data['message']}{message_data['sender']}{message_data['timestamp']}"
    )
    hash_obj = hashlib.md5(message_str.encode())
    return hash_obj.digest()


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
            f"<sent file: {filename}>",
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


def parse_messages(text_file: str, senders_map: Dict[str, str]) -> List[Dict]:
    """Parse messages from text file into structured format."""
    with open(text_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern to match timestamp, sender, and content
    pattern = r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4} \d{1,2}:\d{2}:\d{2} (?:AM|PM))(?: \(.*?\))?\n([^\n]+)\n([\s\S]*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}|$)"

    matches = re.findall(pattern, content)

    messages = []
    for timestamp, sender, content in matches:
        # Skip indented/nested messages
        if re.match(
            r"^[ \t]",
            content.strip().split("\n")[0] if content.strip() else "",
            re.MULTILINE,
        ):
            continue

        # Clean up the content
        clean_content = clean_message_content(content.strip())

        # Skip if content is empty after cleaning
        if not clean_content:
            continue

        # Map sender to the actual handle
        actual_sender = senders_map.get(sender, sender)

        message_data = {
            "message": clean_content,
            "sender": actual_sender,
            "timestamp": timestamp,
        }

        # Create the hash and encode it in base64
        message_hash = hash_message(message_data)
        b64_hash = base64.b64encode(message_hash).decode()

        message_data["id"] = b64_hash
        messages.append(message_data)

    return messages


def main():
    # Load sender mappings
    senders_map = load_senders_map("../data_sources/senders.csv")

    # Parse messages from text file
    messages = parse_messages("../data_sources/1.txt", senders_map)

    # Write to JSON file
    with open("../output/1.json", "w", encoding="utf-8") as f:
        json.dump(messages, f, indent=2)

    print(f"Converted {len(messages)} messages to JSON format.")


if __name__ == "__main__":
    main()
