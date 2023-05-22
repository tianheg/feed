import os

cwd = os.getcwd()

root_feed_csv = os.path.join(cwd, 'feed-list.csv')
root_feed_opml = os.path.join(cwd, 'feed.opml')

from xml.sax.saxutils import quoteattr

with open(root_feed_csv, 'r') as f:
    file_content = f.read()

lines = file_content.split('\n')

HEAD = '<?xml version="1.0" encoding="UTF-8"?><opml version="1.0"><head><title>订阅站</title></head><body>'
END = '</body></opml>'
ITEM = '<outline text={title} title={title} type="rss" xmlUrl={rss_link} htmlUrl={link}/>'

content = HEAD

for line in lines[1:]:
    line = line.strip()
    if not line:
        continue

    parts = line.split(',')
    if len(parts) != 4:
        continue
    parts = [part.strip() for part in parts]
    
    if parts[2]:
        content += ITEM.format(title=quoteattr(parts[0]), link=quoteattr(parts[1]), rss_link=quoteattr(parts[2]))

content += END

with open(root_feed_opml, 'w') as f:
    f.write(content)
