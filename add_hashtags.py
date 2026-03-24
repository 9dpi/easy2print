import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will use a simple regex to find product cards and inject tags
cards = re.split(r'(<div class=\"product-card\")', html)
new_html = [cards[0]]

for i in range(1, len(cards), 2):
    card_open = cards[i]
    card_body = cards[i+1]
    
    title_match = re.search(r'<h3>(.*?)</h3>', card_body)
    if title_match:
        title = title_match.group(1).lower()
        tags = []
        if 'svg' in title or 'cut' in title or 'shirt' in title or 'pattern' in title: tags.append('svg')
        if 'laser' in title or 'hanger' in title or 'frame' in title: tags.append('laser')
        if 'art' in title or 'canvas' in title or 'decor' in title or 'print' in title or 'sunset' in title: tags.append('art')
        if 'planner' in title or 'badge' in title or 'icons' in title: tags.append('planner')
        if 'bundle' in title or 'set' in title or 'pack' in title or 'collection' in title or 'kit' in title: tags.append('bundle')
        if 'mockup' in title or 'logo' in title: tags.append('mockup')
        if '3d' in title or 'stl' in title or 'pins' in title: tags.append('3d')
        if 'mug' in title or 'label' in title: tags.append('art')
        if not tags: tags = ['svg']
        
        data_tags = ' '.join(tags)
        hashtag_html = '<div class=\"hashtags\">' + ''.join([f'<span class=\"hashtag\">#{t}</span>' for t in tags]) + '</div>'
        
        # Insert data-tags into the div tag
        closing_bracket = card_body.find('>')
        card_body_with_tags = f' data-tags=\"{data_tags}\"' + card_body[:closing_bracket] + card_body[closing_bracket:]
        
        # Insert hashtag_html after the product-price
        price_match = re.search(r'(<div class=\"product-price\">.*?</div>)', card_body_with_tags)
        if price_match:
            card_body_with_tags = card_body_with_tags[:price_match.end()] + hashtag_html + card_body_with_tags[price_match.end():]
        
        new_html.append(card_open + card_body_with_tags)
    else:
        new_html.append(card_open + card_body)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(''.join(new_html))
