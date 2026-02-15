import os
import re
import csv
import subprocess

def extract_text_from_pdf(pdf_path):
    """Fallback to pdftotext if no library is available or working."""
    try:
        result = subprocess.run(['pdftotext', pdf_path, '-'], capture_output=True, text=True, check=True)
        return result.stdout
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return ""

def parse_measurements(text, filename):
    data = {
        "File Name": filename,
        "Address": "N/A",
        "Total Roof Area (sq ft)": "N/A",
        "Total Ridges/Hips (ft)": "N/A",
        "Total Valleys (ft)": "N/A",
        "Total Rakes (ft)": "N/A",
        "Total Eaves (ft)": "N/A",
        "Predominant Pitch": "N/A"
    }

    # Extract Address (usually at the top or in "PREPARED FOR" section)
    # Looking for the pattern: Report: [ID] usually follows the address
    address_match = re.search(r'^(.*?)\s+Report:\s+\d+', text, re.MULTILINE)
    if address_match:
        data["Address"] = address_match.group(1).strip()

    # Extract Total Roof Area
    area_match = re.search(r'Total Roof Area =([\d,]+)\s+sq ft', text)
    if area_match:
        data["Total Roof Area (sq ft)"] = area_match.group(1).replace(',', '')

    # Extract Ridges/Hips
    ridges_match = re.search(r'Total Ridges/Hips =(\d+)\s+ft', text)
    if ridges_match:
        data["Total Ridges/Hips (ft)"] = ridges_match.group(1)

    # Extract Valleys
    valleys_match = re.search(r'Total Valleys =(\d+)\s+ft', text)
    if valleys_match:
        data["Total Valleys (ft)"] = valleys_match.group(1)

    # Extract Rakes
    rakes_match = re.search(r'Total Rakes =(\d+)\s+ft', text)
    if rakes_match:
        data["Total Rakes (ft)"] = rakes_match.group(1)

    # Extract Eaves
    eaves_match = re.search(r'Total Eaves =(\d+)\s+ft', text)
    if eaves_match:
        data["Total Eaves (ft)"] = eaves_match.group(1)

    # Extract Predominant Pitch
    pitch_match = re.search(r'Predominant Pitch =([\d/]+)', text)
    if pitch_match:
        data["Predominant Pitch"] = pitch_match.group(1)

    return data

def main():
    examples_dir = "/home/kishan/Documents/code/roof/examples"
    output_csv = "/home/kishan/Documents/code/roof/measurements.csv"
    
    pdf_files = [f for f in os.listdir(examples_dir) if f.lower().endswith('.pdf')]
    pdf_files.sort()

    all_data = []
    
    for filename in pdf_files:
        print(f"Processing {filename}...")
        path = os.path.join(examples_dir, filename)
        text = extract_text_from_pdf(path)
        if text:
            measurements = parse_measurements(text, filename)
            all_data.append(measurements)
        else:
            print(f"Skipping {filename} due to extraction error.")

    if all_data:
        keys = all_data[0].keys()
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(all_data)
        print(f"Successfully created {output_csv}")
    else:
        print("No data extracted.")

if __name__ == "__main__":
    main()
