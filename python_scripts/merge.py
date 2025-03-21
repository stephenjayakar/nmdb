import json

def main():
    with open('../output/imessage.json', 'r') as f:
        c1 = f.read()
    with open('../output/messenger.json', 'r') as f:
        c3 = f.read()

    j1 = json.loads(c1)
    j3 = json.loads(c3)
    m = j1 + j3

    with open('../output/merged.jsonl', 'w') as f:
        for message in m:
            f.write(json.dumps(message) + '\n')


if __name__ == '__main__':
    main()
