import sys
import plistlib
import json


def convert_plist_to_json(input_file, output_file):
    with open(input_file, 'rb') as f:
        plist_data = plistlib.load(f)

    with open(output_file, 'w') as f:
        json.dump(plist_data, f, indent=4)


input_file = sys.argv[1]
output_file = sys.argv[2]
convert_plist_to_json(input_file, output_file)
