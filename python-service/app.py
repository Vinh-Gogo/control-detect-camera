import os
from flask import Flask, request, jsonify
from PIL import Image
import io
# from ultralytics import YOLO

app = Flask(__name__)

# Load your YOLO model
# model = YOLO('path/to/your/model.pt') 

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
            img = Image.open(io.BytesIO(image_bytes))

            # --- YOLO DETECTION LOGIC ---
            # Uncomment the following lines to use your YOLO model
            # results = model(img)
            # detections = []
            # for result in results:
            #     for box in result.boxes:
            #         detections.append({
            #             'box': [int(c) for c in box.xyxy[0]],
            #             'label': model.names[int(box.cls)],
            #             'confidence': float(box.conf)
            #         })
            # return jsonify(detections)
            # -----------------------------

            # Dummy response for demonstration purposes
            dummy_detections = [
                {'box': [10, 10, 50, 50], 'label': 'trayWithFood', 'confidence': 0.95},
                {'box': [60, 60, 100, 100], 'label': 'food', 'confidence': 0.89},
            ]
            
            return jsonify(dummy_detections)

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
