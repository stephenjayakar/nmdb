# Process

### Getting the `jsonl` to upload

Automatic
* Run `import-imessage.py`
  * It also imports messenger stuff, though doesn't convert it.

Manual:
1. Get messenger export (json) & imessage export (txt)
2. You have to run `imessage_json.py` and `messenger.py`
3. Then run `merge.py`

### Getting analytics

You have to have `merged.jsonl`; then you run `analytics.py`, and then upload `analytics.json`

# Other stuff

You can just run `import-imessage.py`

* So you first run `imessage-exporter -f txt`
* Then you copy in the txt files that are appropriate as well as a sender.csv (this is already set up)
* Then you run the script
* and then import the json

You import by doing something like

```
npx convex import --append --table messages ../output/1.json
```

It doesn't support overwriting properly... Have to also probably do with messenger data.

# Scripts

Entry points
* `imessage.py`
* `messenger.py`
* `analytics.py`
* `merge.py`

