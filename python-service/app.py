import os
from flask import Flask, request, jsonify, send_file
from PIL import Image, ImageDraw, ImageFont
import io
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)

# --- Load the YOLO model ---
# The model is mounted into the container at /app/models/last.pt via docker-compose.yml
model_path = '/app/models/last.pt'

try:
    # Check if the model file actually exists at the specified path
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Make sure the volume is mounted correctly in docker-compose.yml.")
    model = YOLO(model_path)
    print(f"Successfully loaded YOLO model from {model_path}")
except Exception as e:
    # If the model fails to load, we create a placeholder so the app can still run.
    # This prevents crashing if the model file is missing.
    print(f"FATAL: Could not load YOLO model. Error: {e}")
    print("FATAL: AI detection will not work. Using a dummy model.")
    class DummyModel:
        def __init__(self):
            self.names = {0: 'error', 1: 'model not found'}
        def __call__(self, img):
            return []
    model = DummyModel()

def get_font(size):
    try:
        # Use a common system font, or a default if not found
        return ImageFont.truetype("arial.ttf", size)
    except IOError:
        print("Arial font not found. Using default font.")
        return ImageFont.load_default()

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        try:
            image_bytes = file.read()
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # --- YOLO DETECTION LOGIC ---
            results = model(img)
            
            draw = ImageDraw.Draw(img)
            font = get_font(15)
            
            # Initialize counts
            detection_counts = {
                'trayWithFood': 0,
                'trayWithoutFood': 0,
                'food': 0
            }

            for result in results:
                for box in result.boxes:
                    label = model.names[int(box.cls)]
                    confidence = float(box.conf)
                    
                    # Update counts
                    if label in detection_counts:
                        detection_counts[label] += 1
                    
                    # Draw bounding box
                    box_coords = [int(c) for c in box.xyxy[0]]
                    draw.rectangle(box_coords, outline="red", width=2)
                    
                    # Draw label
                    label_text = f"{label} {confidence:.2f}"
                    text_bbox = draw.textbbox((0, 0), label_text, font=font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                    
                    text_bg_coords = [box_coords[0], box_coords[1] - text_height - 4, box_coords[0] + text_width + 4, box_coords[1]]
                    draw.rectangle(text_bg_coords, fill="red")
                    draw.text((box_coords[0] + 2, box_coords[1] - text_height - 2), label_text, fill="white", font=font)

            # --- Prepare annotated image for response ---
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            img_byte_arr.seek(0)
            
            response = send_file(
                img_byte_arr,
                mimetype='image/jpeg',
                as_attachment=False
            )
            # Add detection counts to response headers
            response.headers['X-Detection-Counts'] = ','.join(f"{k}:{v}" for k, v in detection_counts.items())

            return response

        except Exception as e:
            return jsonify({'error': f'Error processing image: {str(e)}'}), 500

    return jsonify({'error': 'Unknown error'}), 500

# Health check endpoint
@app.route('/', methods=['GET'])
def health_check():
    return "Python API is running!"

if __name__ == '__main__':
    # The port is set to 5000, which matches the Dockerfile and docker-compose.yml
    app.run(host='0.0.0.0', port=5000)
