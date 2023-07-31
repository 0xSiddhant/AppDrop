import zipfile
import os
import sys

def extract_ipa(ipa_file, processing_dir):
    with zipfile.ZipFile(ipa_file, "r") as zip_file:
        zip_file.extractall(path=processing_dir)

def extract_plist(processing_dir):
    payload_dir = os.path.join(processing_dir, "Payload")
    app_dir = os.path.join(payload_dir, os.listdir(payload_dir)[0])

    entries = os.listdir(app_dir)
    for entry in entries:
        if entry == "Info.plist":
            info_plist_path = os.path.join(app_dir, entry)
            os.rename(info_plist_path, os.path.join(processing_dir, "Info.plist"))
            

processing_dir = os.path.join("storage", "copyPath")
ipa_file = os.path.join(processing_dir, sys.argv[1])

extract_ipa(ipa_file, processing_dir)
extract_plist(processing_dir)