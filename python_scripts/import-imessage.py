import os
import shutil
import imessage_json
import merge
import imessage

senders_map = imessage.load_senders_map("../data_sources/senders.csv")

not_me_senders = [k.strip('+') for k in senders_map.keys() if k not in ('Me', '@me')]

EXPORT_COMMAND = f'''imessage-exporter -f json -t "{','.join(not_me_senders)}"'''

def imessage_export():
    receivers = []
    for k, v in senders_map.items():
        if v != 'Nadia':
            continue
        receivers.append(k)
    # Kind of arbitrary
    receivers.sort()

    if not receivers:
        raise ValueError("No receivers found for 'Nadia'.")

    source_prefix = 'imessage_export/'
    home_directory = os.path.expanduser('~')

    directory_to_remove = os.path.join(home_directory, 'imessage_export')

    # Remove the directory and all its contents
    if os.path.exists(directory_to_remove):
        shutil.rmtree(directory_to_remove)
        print(f"Removed directory: {directory_to_remove}")
    else:
        print(f"Directory does not exist: {directory_to_remove}")

    print(EXPORT_COMMAND)
    os.system(EXPORT_COMMAND)
    return


    for i in range(1, 3):
        if i > len(receivers):
            print(f"Insufficient number of receivers. Needed index: {i-1}")
            break

        receiver = receivers[i - 1]
        receiver = receiver.replace('.com', '')

        source = os.path.join(home_directory, source_prefix, receiver + '.txt')
        destination = os.path.join('../data_sources/', f'{i}.txt')

        if not os.path.exists(source):
            print(f"Source file not found: {source}")
            continue

        os.makedirs(os.path.dirname(destination), exist_ok=True)
        shutil.copy(source, destination)
        print(f'Copied {source} to {destination}')


imessage_export()
imessage_json.main()
merge.main()
command = (
    'cd ../frontend && '
    '. ~/.nvm/nvm.sh && '
    'nvm use 18 && '
    'npx convex import --replace ../output/merged.jsonl --table messages'
)
os.system(command)
