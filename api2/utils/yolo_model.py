import cv2
import numpy as np
import onnxruntime as ort

class YoloONNX:
    def __init__(self, model_path, confidence_thres=0.5, iou_thres=0.5):
        # Load the lightweight ONNX session (CPU)
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [x.name for x in self.session.get_outputs()]
        self.conf_thres = confidence_thres
        self.iou_thres = iou_thres
        
        # Hardcoded class names (Update these to match your 15 classes!)
        self.classes = ['ball_1', 'ball_10', 'ball_11', 'ball_12', 'ball_13', 'ball_14', 'ball_15', 'ball_2', 'ball_3', 'ball_4', 'ball_5', 'ball_6', 'ball_7', 'ball_8', 'ball_9']

    def preprocess(self, img_path):
        """
        Reads image, resizes to 640x640 while maintaining aspect ratio (letterbox),
        and normalizes it.
        """
        img = cv2.imread(img_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.img_h, self.img_w = img.shape[:2]

        # Resize (Letterbox)
        scale = min(640 / self.img_h, 640 / self.img_w)
        new_h, new_w = int(self.img_h * scale), int(self.img_w * scale)
        img_resized = cv2.resize(img, (new_w, new_h))

        # Pad to square (640x640)
        top = (640 - new_h) // 2
        bottom = 640 - new_h - top
        left = (640 - new_w) // 2
        right = 640 - new_w - left
        img_padded = cv2.copyMakeBorder(img_resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))

        # Normalize and reshape to (1, 3, 640, 640)
        img_blob = img_padded.astype(np.float32) / 255.0
        img_blob = img_blob.transpose(2, 0, 1) # HWC to CHW
        img_blob = np.expand_dims(img_blob, axis=0) # Add batch dimension

        return img_blob, scale, top, left

    def infer(self, img_path):
        # 1. Preprocess
        input_tensor, scale, top, left = self.preprocess(img_path)

        # 2. Run Inference (No PyTorch needed!)
        outputs = self.session.run(self.output_names, {self.input_name: input_tensor})
        
        # Output shape is (1, 19, 8400) -> Transpose to (8400, 19)
        predictions = np.transpose(outputs[0][0]) 

        boxes = []
        confidences = []
        class_ids = []

        # 3. Filter predictions
        # Rows: 8400 predictions
        # Cols: 0-3 (x,y,w,h), 4-18 (class probabilities)
        for row in predictions:
            classes_scores = row[4:]
            _, max_score, _, max_class_loc = cv2.minMaxLoc(classes_scores)
            class_id = max_class_loc[1]
            
            if max_score > self.conf_thres:
                # Extract Box (cx, cy, w, h)
                cx, cy, w, h = row[0], row[1], row[2], row[3]
                
                # Convert to top-left (x, y)
                x = (cx - w / 2) - left # Adjust for padding
                y = (cy - h / 2) - top
                
                # Scale back to original image size
                x /= scale
                y /= scale
                w /= scale
                h /= scale

                boxes.append([int(x), int(y), int(w), int(h)])
                confidences.append(float(max_score))
                class_ids.append(class_id)

        # 4. NMS (Non-Maximum Suppression) to remove duplicates
        indices = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_thres, self.iou_thres)

        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                results.append({
                    "name": self.classes[class_ids[i]], # Map ID to Name
                    "score": round(confidences[i] * 100, 2), # Confidence as score
                    "box": boxes[i]
                })
        
        return results

# Initialize once to save load time (Global variable)
# Make sure 'ball_model2.onnx' is in your project root
yolo_model = YoloONNX("ball_model2.onnx")
