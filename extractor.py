import zipfile
import os
import sys

def extract_ipa(ipa_file, processing_dir):
    with zipfile.ZipFile(ipa_file, "r") as zip_file:
        zip_file.extractall(path=processing_dir)

def extract_plist(processing_dir):
    payload_dir = os.path.join(processing_dir, "Payload")
    app_dirs = [entry for entry in os.listdir(payload_dir) if entry.endswith(".app")]
    if not app_dirs:
        sys.exit(1)
    app_dir = os.path.join(payload_dir, app_dirs[0])

    info_plist_path = os.path.join(app_dir, "Info.plist")
    if not os.path.isfile(info_plist_path):
        sys.exit(1)
    os.rename(info_plist_path, os.path.join(processing_dir, "Info.plist"))


processing_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join("storage", "copyPath")
ipa_file = os.path.join(processing_dir, sys.argv[1])

extract_ipa(ipa_file, processing_dir)
extract_plist(processing_dir)
