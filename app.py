#pyinstaller --noconsole --onefile --icon=favicon.ico AI_ball_rank.py
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
    "camera_index": 1,
    "door_camera_index": 0,
    "threshold": 500, # Fixed typo
    "api_url": "https://admin.pinballrace.com/submit_rankings"
}

def load_config():
    if not os.path.exists(CONFIG_FILE):
        save_config(default_config)
    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)
        # Migrate old typo if it exists in the user's current JSON
        if "treshold" in config:
            config["threshold"] = config.pop("treshold")
            save_config(config)
        return config

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
    sorted_balls = sorted(ball_detections, key=lambda b: b["box"]["x1"])
    return {ball["name"]: idx + 1 for idx, ball in enumerate(sorted_balls)}

# ---------------- DOOR MONITOR THREAD ----------------
class DoorMonitorThread(threading.Thread):
    def __init__(self, config, log_callback):
        super().__init__()
        self.config = config
        self.camera_index = int(config["door_camera_index"])
        self.log = log_callback
        self.running = True
        self.paused = False
        
        self.status = "UNKNOWN"
        self.color = "#000000" 
        self.last_sent_status = None

        self._init_camera()

    def _init_camera(self):
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        except Exception as e:
            self.log(f"Door Cam Init Error: {e}")
            self.cap = None

    def run(self):
        while self.running:
            if self.paused:
                time.sleep(0.5)
                continue

            if not self.cap or not self.cap.isOpened():
                self.status = "CAM ERROR"
                self.color = "#FFA500"
                time.sleep(1)
                continue

            ret, frame = self.cap.read()
            if ret:
                try:
                    # Dynamically check resolution to avoid crashes if a different camera is used
                    h, w, _ = frame.shape
                    if h < 350 or w < 800:
                        self.log("Door Cam Warning: Resolution too low for hardcoded ROI.")
                        time.sleep(1)
                        continue

                    roi = frame[210:350, 260:800] 
                    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)
                    edges = cv2.Canny(blurred_roi, 50, 150)
                    edge_pixel_count = cv2.countNonZero(edges)
                    
                    threshold = int(self.config.get("threshold", 500))
                    
                    if edge_pixel_count > threshold:
                        new_status = "CLOSED"
                        new_color = "#FF0000"
                    else:
                        new_status = "OPEN"
                        new_color = "#008000"

                    self.status = new_status
                    self.color = new_color

                    if self.status != self.last_sent_status:
                        self.trigger_api_update(self.status)
                        self.last_sent_status = self.status

                except Exception as e:
                    print(f"Door Logic Error: {e}")
                    self.status = "ERROR"
            
            time.sleep(0.1)

    def trigger_api_update(self, status_to_send):
        def _send():
            try:
                r1 = requests.post("https://admin.pinballrace.com/api/game_ongoing", timeout=3)
                if r1.status_code == 200 and r1.json().get("status", False):
                    r2 = requests.post(
                        "https://admin.pinballrace.com/api/door/status", 
                        json={"status": status_to_send},
                        timeout=3
                    )
                    self.log(f"Door API: {status_to_send} (Code: {r2.status_code})")
            except Exception as e:
                print(f"Door API Error: {e}")
        
        threading.Thread(target=_send, daemon=True).start()

    def stop(self):
        self.running = False
        if self.cap:
            self.cap.release()
            self.cap = None
        
    def set_pause(self, val):
        self.paused = val
        if val and self.cap:
            self.cap.release()
            self.cap = None
        elif not val:
            self._init_camera()
    
    def update_camera_index(self, new_index):
        # 1. Pause the loop and release the current camera
        self.set_pause(True) 
        
        # 2. Update the index variable
        self.camera_index = int(new_index)
        
        # 3. Unpause the loop and initialize the new camera
        self.set_pause(False)

# ---------------- MAIN DETECTION LOGIC ----------------
class DetectorThread(threading.Thread):
    def __init__(self, config, log_callback, stop_event):
        super().__init__()
        self.config = config
        self.log = log_callback
        self.stop_event = stop_event

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
            self.log(f"GPU detected ({torch.cuda.get_device_name(0)}). Using CUDA.")
        else:
            device = "cpu"
            self.log("No GPU detected. Running on CPU.")

        model.to(device)

        try:
            cam_idx = int(self.config["camera_index"])
            cap = cv2.VideoCapture(cam_idx)
        except ValueError:
            cap = cv2.VideoCapture(self.config["camera_index"])

        if not cap.isOpened():
            self.log("Failed to open main camera.")
            return

        self.log("Detection started.")
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
            
            results = model(frame, conf=0.5, verbose=False)
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

            cv2.imshow("Ball Detection", annotated_frame)

            json_results = json.loads(results[0].to_json())
            ball_detections = [obj for obj in json_results if obj.get("name", "").startswith("ball_")]

            ball_rankings = rank_balls_left_to_right(ball_detections)
            current_count = len(ball_rankings)

            # --- Inside your processing loop ---

            # 1. Handle the 10-second "stale" timer (existing logic)
            if current_count > 0:
                if current_count > initial_ball_count or start_time is None:
                    initial_ball_count = current_count
                    start_time = time.time()
                    time_tag = False 
                elif current_count == initial_ball_count:
                    elapsed = time.time() - start_time
                    if elapsed > 10:
                        time_tag = True
            else:
                start_time = None
                initial_ball_count = 0
                time_tag = False

            # 2. NEW: 2-Second Verification Logic for "10 Balls Detected"
            # If 10 balls found and we haven't started the 2s timer yet, start it.
            if (current_count >= 10 or time_tag) and verification_start_time is None:
                self.log("Target reached. Waiting 2 seconds to stabilize data...")
                verification_start_time = time.time()

            # 3. Check if the 2-second wait is over
            if verification_start_time is not None:
                if time.time() - verification_start_time >= 2:
                    # This is the "New Data" capture point
                    self.log(f"🏁 2s elapsed. Sending stabilized rankings: {ball_rankings}")
                    
                    cv2.imwrite("detected_frame.jpg", annotated_frame)
                    
                    # Fire the API with the rankings detected *after* the 2s wait
                    self.trigger_ranking_api(ball_rankings)
                    
                    # Reset everything
                    start_time = None
                    initial_ball_count = 0
                    time_tag = False
                    verification_start_time = None # Reset our 2s timer
                    
                    self.log("Cooling down for 3 seconds while funnel clears...")
                    time.sleep(3)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
        self.log("Detection stopped.")

    def trigger_ranking_api(self, ball_rankings):
        """ Handles the heavy API calls without freezing the OpenCV frame loop """
        def _send():
            try:
                response = requests.get("https://admin.pinballrace.com/api/games/status", timeout=5)
                if response.status_code == 200:
                    current_game = response.json().get("currentGame", "N/A")
                    if current_game != "N/A" and current_game["status"] == "Ongoing":
                        self.log(f"Current Game: {current_game['gameNumber']} - {current_game['status']}")
                        
                        response2 = requests.post(
                            self.config["api_url"], 
                            json=ball_rankings,
                            timeout=5
                        )
                        self.log(f"Sent to API Game {current_game['gameNumber']}: {response2.status_code}")
                else:
                    self.log(f"Failed to fetch game status: {response.status_code}")
            except Exception as e:
                self.log(f"Ranking API Error: {e}")
                
        threading.Thread(target=_send, daemon=True).start()

# ---------------- TKINTER UI ----------------
class DetectionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Ball Funnel Detection")
        self.config = load_config()

        self.stop_event = threading.Event()
        self.detector_thread = None

        self.door_thread = DoorMonitorThread(self.config, self.safe_log)
        self.door_thread.start()

        self.build_ui()
        self.update_door_ui()

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
        
        self.door_status_label = tk.Label(self.tab_main, text="Door Status: INITIALIZING", font=("Helvetica", 16, "bold"))
        self.door_status_label.pack(pady=10)
        
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

        ttk.Label(self.tab_settings, text="Door Camera Index:").pack(pady=5)
        self.door_camera_entry = ttk.Entry(self.tab_settings, width=10)
        self.door_camera_entry.insert(0, str(self.config["door_camera_index"]))
        self.door_camera_entry.pack(pady=5)

        ttk.Label(self.tab_settings, text="Threshold:").pack(pady=5)
        self.threshold_entry = ttk.Entry(self.tab_settings, width=10)
        self.threshold_entry.insert(0, str(self.config["threshold"]))
        self.threshold_entry.pack(pady=5)

        ttk.Button(self.tab_settings, text="Preview Door Camera", command=self.preview_door_camera).pack(pady=10)

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
        self.config["door_camera_index"] = self.door_camera_entry.get()
        self.config["threshold"] = int(self.threshold_entry.get())

        self.door_thread.update_camera_index(self.config["door_camera_index"])
        save_config(self.config)
        messagebox.showinfo("Settings", "Settings saved successfully!")

    def start_detection(self):
        if self.detector_thread and self.detector_thread.is_alive():
            self.safe_log("⚠️ Detection already running.")
            return
        self.stop_event.clear()
        self.detector_thread = DetectorThread(self.config, self.safe_log, self.stop_event)
        self.detector_thread.start()

    def stop_detection(self):
        self.stop_event.set()
        self.safe_log("Stopping detection...")

    def safe_log(self, message):
        """ Thread-safe way to update Tkinter UI from background threads """
        self.root.after(0, self._insert_log, message)

    def _insert_log(self, message):
        self.log_box.configure(state="normal")
        self.log_box.insert(tk.END, f"{time.strftime('%H:%M:%S')} | {message}\n")
        self.log_box.configure(state="disabled")
        self.log_box.yview(tk.END)

    def update_door_ui(self):
        if self.door_thread:
            current_status = self.door_thread.status
            color = self.door_thread.color
            self.door_status_label.config(text=f"Door Status: {current_status}", fg=color)
        else:
            self.door_status_label.config(text="Door Status: UNKNOWN", fg="#FFFF00")

        self.root.after(200, self.update_door_ui)

    def preview_door_camera(self):
        self.door_thread.set_pause(True)
        self.safe_log("Opening Door Preview...")
        threading.Thread(target=self._run_preview_loop).start()

    def _door_status(self, frame):
        roi = frame[210:350, 260:800] 
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)
        edges = cv2.Canny(blurred_roi, 50, 150)
        edge_pixel_count = cv2.countNonZero(edges)
        
        # Read threshold directly from config so it matches your saved settings
        threshold = int(self.config.get("threshold", 500))
        
        if edge_pixel_count > threshold:
            new_status = "CLOSED"
            new_color = (0, 0, 255) # Red
        else:
            new_status = "OPEN"
            new_color = (0, 255, 0) # Green
            
        # We now return 'edges' at the end so the preview loop can display it
        return new_status, new_color, edge_pixel_count, edges


    def _run_preview_loop(self):
        try:
            cam_idx = int(self.door_camera_entry.get())
            cap = cv2.VideoCapture(cam_idx)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            
            # Create named windows up front so we can detect if they get closed
            cv2.namedWindow("Door Camera Preview")
            cv2.namedWindow("Canny Edges (ROI)")
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # 1. ANALYZE FRAME & GET EDGES
                status, color, edge_count, edges = self._door_status(frame)

                # 2. DRAW UI ON MAIN FRAME
                cv2.rectangle(frame, (260, 210), (800, 350), (0, 255, 255), 2)
                cv2.putText(frame, "DETECTION AREA", (260, 205), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                thresh_val = self.config.get("threshold", 500)
                
                cv2.putText(frame, "Press 'Q' or close window to exit", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(frame, f"Status: {status} (Edges: {edge_count} / Thresh: {thresh_val})", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
                # 3. SHOW BOTH WINDOWS
                cv2.imshow("Door Camera Preview", frame)
                cv2.imshow("Canny Edges (ROI)", edges)
                
                # 4. EXIT CONDITIONS
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                    
                # If the user clicks the 'X' on either window, it returns -1. Break the loop.
                if cv2.getWindowProperty("Door Camera Preview", cv2.WND_PROP_VISIBLE) < 1 or \
                   cv2.getWindowProperty("Canny Edges (ROI)", cv2.WND_PROP_VISIBLE) < 1:
                    break
            
            cap.release()
            cv2.destroyAllWindows()
            
        except Exception as e:
            print(f"Preview Error: {e}")
        finally:
            # Unpause the background monitor once the preview finishes
            self.door_thread.set_pause(False)

    def on_close(self):
        self.stop_event.set()
        self.door_thread.stop()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = DetectionApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_close)
    root.mainloop()