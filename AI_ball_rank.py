import threading
import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext, messagebox
import cv2
import json
import requests
import torch
import ultralytics
import numpy as np
import time
import os

CONFIG_FILE = "config.json"

# ---------------- CONFIG HANDLING ----------------
default_config = {
    "model_path": "ball_model.pt",
    "camera_index": 0,
    "api_url": "http://localhost:5000/submit_rankings"
}

def load_config():
    if not os.path.exists(CONFIG_FILE):
        save_config(default_config)
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def rank_balls_left_to_right(ball_detections):
    """
    Takes a list of ball detections and returns a dictionary
    ranking them from left (1st) to right (last) based on the x-coordinate.
    """
    if not ball_detections:
        return {}

    # Sort detections by leftmost x1 (ascending)
    sorted_balls = sorted(ball_detections, key=lambda b: b["box"]["x1"])

    # Create ranking dictionary
    ball_rankings = {ball["name"]: idx + 1 for idx, ball in enumerate(sorted_balls)}

    return ball_rankings
# ---------------- MAIN DETECTION LOGIC ----------------
class DetectorThread(threading.Thread):
    def __init__(self, config, log_callback, stop_event):
        super().__init__()
        self.config = config
        self.log = log_callback
        self.stop_event = stop_event

    def sort_my_balls(detections):
        """
        Sort ball detections from left to right using x1 (left boundary of the box).
        Returns a list of ball names in order.
        """
        if not detections:
            return []

        # Sort by x1 (leftmost coordinate)
        sorted_dets = sorted(detections, key=lambda d: d["box"]["x1"])

        # Return names only
        return [d["name"] for d in sorted_dets]
    def run(self):
        new_w, new_h = 1280, 720

        try:
            self.log("Loading YOLO model...")
            model = ultralytics.YOLO(self.config["model_path"])
        except Exception as e:
            self.log(f"Failed to load model: {e}")
            return
        if torch.cuda.is_available():
            device = "cuda"
            self.log(f"GPU detected ({torch.cuda.get_device_name(0)}). Using CUDA for inference.")
        else:
            device = "cpu"
            self.log("No GPU detected. Running on CPU.")

        model.to(device)
        try:
            cap = cv2.VideoCapture(int(self.config["camera_index"]))
            if not cap.isOpened():
                self.log("Failed to open camera.")
                return
        except:
            cap = cv2.VideoCapture(self.config["camera_index"])
            if not cap.isOpened():
                self.log("Failed to open video.")
                return
        self.log("Detection started.")
        ball_rankings = {}
        initial_ball_count = 0
        time_tag = False
        start_time = None
        while not self.stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                self.log("Camera frame not received.")
                break
            h, w, _ = frame.shape
            start_x = max((w - new_w) // 2, 0)
            start_y = max((h - new_h) // 2, 0)
            frame = frame[start_y:start_y + new_h, start_x:start_x + new_w]
            results = model(frame, conf=0.5)
            self.log(frame.shape)
            boxes = results[0].boxes.xywh.cpu().numpy() if results[0].boxes is not None else []
            names = results[0].names
            cls = results[0].boxes.cls.cpu().numpy().astype(int) if results[0].boxes is not None else []
            confs = results[0].boxes.conf.cpu().numpy() if results[0].boxes is not None else []

            annotated_frame = frame.copy()
            for (x_c, y_c, bw, bh), c, conf in zip(boxes, cls, confs):
                x1 = int(x_c - bw / 2)
                y1 = int(y_c - bh / 2)
                x2 = int(x_c + bw / 2)
                y2 = int(y_c + bh / 2)
                label = f"{names[c]} {conf:.2f}"
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(annotated_frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            # Show frame
            cv2.imshow("ball Detection", annotated_frame)

            # Convert results to JSON and parse
            json_results = json.loads(results[0].to_json())
            if isinstance(json_results, list):
                ball_detections = [
                    obj for obj in json_results if obj.get("name", "").startswith("ball_")
                ]
            else:
                ball_detections = []

            if ball_detections:
                print(ball_detections)
                first_ball = ball_detections[0]
                x_center = (first_ball["box"]["x2"] + first_ball["box"]["x1"]) / 2
                frame_center = frame.shape[1] / 2
                position = "Left Side" if x_center < frame_center else "Right Side"
                self.log(f"Detected {first_ball['name']} on {position}")
            else:
                self.log("No balls detected")

            ball_rankings = rank_balls_left_to_right(ball_detections)
            current_count = len(ball_rankings)

            # Timer logic
            if current_count > 0:
                # Case 1: First detection OR new ball(s) detected — reset timer
                if current_count > initial_ball_count or start_time is None:
                    initial_ball_count = current_count
                    start_time = time.time()
                    time_tag = False  # reset timeout flag
                    print("Ball(s) detected — timer started/reset.")
                
                # Case 2: Same count — check for timeout
                elif current_count == initial_ball_count:
                    elapsed = time.time() - start_time
                    if elapsed > 10:
                        print("Timeout reached for current detections.")
                        time_tag = True
            else:
                # No balls detected — reset everything
                start_time = None
                initial_ball_count = 0
                time_tag = False
            if len(ball_rankings) >= 10 or time_tag == True:
                self.log(f"🏁 Ball Rankings ready: {ball_rankings}")
                print(ball_rankings)
                ball_rankings = self.sort_my_balls(ball_detections)
                cv2.imwrite("detected frame.jpg", annotated_frame)
                try:
                    response = requests.post("admin.pinballrace.com/api/games/status")
                    if response.status_code == 200:
                        current_game = response.json().get("currentGame", "N/A")
                        if current_game != "N/A" and current_game["status"] == "Ongoing":
                            self.log(f"Current Game: {current_game['gameNumber']} - {current_game['status']}")
                            ball_rankings  = {name: rank+1 for rank, name in enumerate(ball_rankings)}

                            response2 = requests.post(self.config["api_url"], json=ball_rankings)
                            self.log(f"Sent to API Game {current_game['gameNumber']}: {response2.status_code} ")
                    else:
                        self.log(f"Failed to fetch game status: {response.status_code}")
                except Exception as e:
                    self.log(f"API Error: {e}")
                

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break


        cap.release()
        cv2.destroyAllWindows()
        self.log("Detection stopped.")

# ---------------- TKINTER UI ----------------
class DetectionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Ball Funnel Detection")
        self.config = load_config()

        self.stop_event = threading.Event()
        self.detector_thread = None

        self.build_ui()

    def build_ui(self):
        tab_control = ttk.Notebook(self.root)
        self.tab_main = ttk.Frame(tab_control)
        self.tab_settings = ttk.Frame(tab_control)

        tab_control.add(self.tab_main, text="Detection")
        tab_control.add(self.tab_settings, text="Settings")
        tab_control.pack(expand=1, fill="both")

        # Main Tab
        ttk.Button(self.tab_main, text="Start Detection", command=self.start_detection).pack(pady=10)
        ttk.Button(self.tab_main, text="Stop Detection", command=self.stop_detection).pack(pady=5)
        self.log_box = scrolledtext.ScrolledText(self.tab_main, width=80, height=20, state="disabled")
        self.log_box.pack(padx=10, pady=10)

        # Settings Tab
        ttk.Label(self.tab_settings, text="Model Path:").pack(pady=5)
        self.model_entry = ttk.Entry(self.tab_settings, width=60)
        self.model_entry.insert(0, self.config["model_path"])
        self.model_entry.pack(pady=5)

        ttk.Button(self.tab_settings, text="Browse", command=self.browse_model).pack(pady=5)

        ttk.Label(self.tab_settings, text="Camera Index:").pack(pady=5)
        self.camera_entry = ttk.Entry(self.tab_settings, width=10)
        self.camera_entry.insert(0, str(self.config["camera_index"]))
        self.camera_entry.pack(pady=5)

        ttk.Label(self.tab_settings, text="API URL:").pack(pady=5)
        self.api_entry = ttk.Entry(self.tab_settings, width=60)
        self.api_entry.insert(0, self.config["api_url"])
        self.api_entry.pack(pady=5)

        ttk.Button(self.tab_settings, text="💾 Save Settings", command=self.save_settings).pack(pady=10)

    def browse_model(self):
        file_path = filedialog.askopenfilename(filetypes=[("PyTorch Model", "*.pt")])
        if file_path:
            self.model_entry.delete(0, tk.END)
            self.model_entry.insert(0, file_path)

    def save_settings(self):
        self.config["model_path"] = self.model_entry.get()
        self.config["camera_index"] = self.camera_entry.get()
        self.config["api_url"] = self.api_entry.get()
        save_config(self.config)
        messagebox.showinfo("Settings", "Settings saved successfully!")

    def start_detection(self):
        if self.detector_thread and self.detector_thread.is_alive():
            self.log("⚠️ Detection already running.")
            return
        self.stop_event.clear()
        self.detector_thread = DetectorThread(self.config, self.log, self.stop_event)
        self.detector_thread.start()

    def stop_detection(self):
        self.stop_event.set()
        self.log("Stopping detection...")

    def log(self, message):
        self.log_box.configure(state="normal")
        self.log_box.insert(tk.END, f"{time.strftime('%H:%M:%S')} | {message}\n")
        self.log_box.configure(state="disabled")
        self.log_box.yview(tk.END)

# ---------------- RUN APP ----------------
if __name__ == "__main__":
    root = tk.Tk()
    app = DetectionApp(root)
    root.mainloop()
