import uuid
import json


with open('full_name_country_records2.json') as f:
    records = json.load(f)

    for record in records:
        id = str(uuid.uuid4())[:8]
        record['id'] = id
        record['avatar'] = 'https://robohash.org/' + id + '.png'

    print json.dumps(records)
