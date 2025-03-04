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

Figure it out from there
