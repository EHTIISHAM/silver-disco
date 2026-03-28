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
    "api_url": "https://admin.pinballrace.com/submit_rankings"
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


class DoorMonitorThread(threading.Thread):
    def __init__(self, config, log_callback):
        super().__init__()
        self.config = config
        self.camera_index = int(config["door_camera_index"])
        self.log = log_callback
        self.running = True
        self.paused = False
        
        # State variables
        self.status = "UNKNOWN"
        self.color = "#000000" 
        self.last_sent_status = None

        # OPEN CAMERA ONCE HERE
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
                    # 1. Process Image
                    roi = frame[210:350, 260:800] 
                    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                    blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)
                    edges = cv2.Canny(blurred_roi, 50, 150)
                    edge_pixel_count = cv2.countNonZero(edges)
                    
                    # 2. Determine Status
                    threshold = int(self.config.get("threshold", 500))
                    
                    if edge_pixel_count > threshold:
                        new_status = "CLOSED"
                        new_color = "#FF0000"
                    else:
                        new_status = "OPEN"
                        new_color = "#008000"

                    # 3. Update Shared Variables
                    self.status = new_status
                    self.color = new_color

                    # 4. Handle API (Only if status CHANGED)
                    if self.status != self.last_sent_status:
                        self.trigger_api_update(self.status)
                        self.last_sent_status = self.status

                except Exception as e:
                    print(f"Door Logic Error: {e}")
                    self.status = "ERROR"
            
            # Small sleep to save CPU, but fast enough for UI
            time.sleep(0.1)
    def trigger_api_update(self, status_to_send):
        """Fire and forget API call in a separate thread"""
        def _send():
            try:
                # Check game status first
                r1 = requests.post("https://admin.pinballrace.com/api/game_ongoing", timeout=3)
                if r1.status_code == 200 and r1.json().get("status", False):
                    # Send door status
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
        
    def set_pause(self, val):
        self.paused = val
        # If pausing (for preview), release cap. If unpausing, reopen.
        if val and self.cap:
            self.cap.release()
        elif not val:
            self.cap = cv2.VideoCapture(self.camera_index)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    def update_camera_index(self, new_index):
        self.camera_index = int(new_index)
        # Re-init camera next loop
        self.stop()
        self.running = True
        self.set_pause(False)
# ---------------- MAIN DETECTION LOGIC ----------------
class DetectorThread(threading.Thread):
    def __init__(self, config, log_callback, stop_event):
        super().__init__()
        self.config = config
        self.log = log_callback
        self.stop_event = stop_event

    def sort_my_balls(self,detections):
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
            boxes = results[0].boxes.xywh.cpu().numpy() if results[0].boxes is not None else []
            names = results[0].names
            cls = results[0].boxes.cls.cpu().numpy().astype(int) if results[0].boxes is not None else []
            confs = results[0].boxes.conf.cpu().numpy() if results[0].boxes is not None else []

            annotated_frame = frame.copy()
            labels = []
            for (x_c, y_c, bw, bh), c, conf in zip(boxes, cls, confs):
                x1 = int(x_c - bw / 2)
                y1 = int(y_c - bh / 2)
                x2 = int(x_c + bw / 2)
                y2 = int(y_c + bh / 2)
                label = f"{names[c]} {conf:.2f}"
                labels.append({x1:label})
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
                self.log(f"label_data: {sorted(labels, key=lambda x: list(x.keys())[0])}")
                print(ball_rankings)
                ball_rankings = self.sort_my_balls(detections=ball_detections)
                cv2.imwrite("detected frame.jpg", annotated_frame)
                try:
                    response = requests.get("https://admin.pinballrace.com/api/games/status")
                    if response.status_code == 200:
                        current_game = response.json().get("currentGame", "N/A")
                        if current_game != "N/A" and current_game["status"] == "Ongoing":
                            self.log(f"Current Game: {current_game['gameNumber']} - {current_game['status']}")
                            ball_rankings  = {name: rank+1 for rank, name in enumerate(ball_rankings)}
                            print("game fetched", current_game, ball_rankings)
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
    
    def door_status_detector(self):
        # FIX: NOT WORKING
        try:
            cap = cv2.VideoCapture(self.config["door_camera_index"])
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # 1. DEFINE REGION OF INTEREST (ROI)
                # You need to tweak these numbers based on your actual camera position
                # Format: [y1:y2, x1:x2]
                # Focusing on the area where "CHOOSE" is written
                roi = frame[210:350, 260:800] 

                # 2. PRE-PROCESSING
                gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                
                # Optional: Gaussian Blur to remove camera noise (as you suggested)
                blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)

                # 3. EDGE DETECTION
                # Thresholds 50 and 150 usually work well for black text on white
                edges = cv2.Canny(blurred_roi, 50, 150)

                # 4. DECISION LOGIC
                # Count how many pixels are "edges"
                edge_pixel_count = cv2.countNonZero(edges)

                # Determine state based on a threshold you find by testing
                # If text is there, count will be high (e.g., > 1000)
                # If wall is there, count will be low (e.g., < 100)
                threshold = int(self.config["threshold"])
                
                status = "opened"
                color = "#008000" # Green for open
                
                if edge_pixel_count > threshold:
                    status = "closed"
                    color = "#FF0000" # Red for closed

                if cv2.waitKey(30) & 0xFF == ord('q'):
                    break

            cap.release()
            cv2.destroyAllWindows()
        except :
            self.log(f"Door detection error")
            status = "UNKNOWN"
            color = "#FFFF00" # Yellow for unknown
        return status, color
# ---------------- TKINTER UI ----------------
class DetectionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Ball Funnel Detection")
        self.config = load_config()

        self.stop_event = threading.Event()
        self.detector_thread = None

        self.door_thread = DoorMonitorThread(self.config, self.log)
        self.door_thread.start()

        self.build_ui()
        # Start polling the DoorMonitorThread for status updates (door monitor already started)
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
        # add live text for door status
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

        ttk.Label(self.tab_settings, text="threshold").pack(pady=5)
        self.threshold = ttk.Entry(self.tab_settings, width=10)
        self.threshold.insert(0, str(self.config["threshold"]))
        self.threshold.pack(pady=5)
        # PREVIEW BUTTON
        ttk.Button(self.tab_settings, text="Preview Door Camera (5s)", command=self.preview_door_camera).pack(pady=10)

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
        self.config["threshold"] = self.threshold.get()

        # Update door thread camera index
        self.door_thread.update_camera_index(self.config["door_camera_index"])
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
    
    def update_door_status(self):
        status, color_hex = self.detector_thread.door_status_detector()
        # send to api
        try:

            response = requests.post("https://admin.pinballrace.com/api/door/status", json={"status": status})
            if response.status_code == 200:
                self.log(f"Door status '{status}' sent to API successfully.")
            else:
                self.log(f"Failed to send door status to API: {response.status_code}")

        except Exception as e:
            self.log(f"Error sending door status to API: {e}")

        self.door_status_label.config(text=f"Door Status: {status}", foreground=color_hex)
        # this need updating
        self.root.after(5, self.update_door_status)  # Update every 0.005 seconds

    def update_door_ui(self):
        """ Polls the door thread for status updates (API is handled inside the thread now) """
        if self.door_thread:
            current_status = self.door_thread.status
            color = self.door_thread.color
            
            # Update UI Label
            self.door_status_label.config(text=f"Door Status: {current_status}", fg=color)
        else:
            self.door_status_label.config(text="Door Status: UNKNOWN", fg="#FFFF00")

        # Re-run this function after 200ms (Fast UI updates)
        self.root.after(200, self.update_door_ui)

    def send_door_api(self, status):
        """ Helper function to handle the API calls without blocking the UI """
        try:
            # Check if game is ongoing
            response1 = requests.post("https://admin.pinballrace.com/api/game_ongoing")
            
            if response1.status_code == 200:
                if response1.json().get("status", False):
                    # Game is ongoing, send door status
                    response = requests.post(
                        "https://admin.pinballrace.com/api/door/status", 
                        json={"status": status}
                    )
                    if response.status_code != 200:
                        print(f"Failed to send door status: {response.status_code}") 
                        # Use print here instead of self.log to avoid threading issues with Tkinter
                else:
                    pass # No game ongoing, do nothing
            else:
                print(f"Failed to check game status: {response1.status_code}")
                
        except Exception as e:
            print(f"API Error: {e}")

    def preview_door_camera(self):
        """ Temporarily pauses monitoring to show a live feed for setup """
        # 1. Pause the background monitor so it releases the camera
        self.door_thread.set_pause(True)
        self.log("Opening Door Preview...")
        
        # 2. Run Preview in a separate thread so GUI doesn't freeze
        threading.Thread(target=self._run_preview_loop).start()

    def _run_preview_loop(self):
        try:
            cam_idx = int(self.door_camera_entry.get())
            cap = cv2.VideoCapture(cam_idx)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            start_time = time.time()
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Draw the ROI Box so user knows where detection happens
                # ROI matches the one in DoorMonitorThread: [210:350, 260:800]
                cv2.rectangle(frame, (260, 210), (800, 350), (0, 255, 255), 2)
                cv2.putText(frame, "DETECTION AREA", (260, 205), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
                
                # Calc countdown
                elapsed = time.time() - start_time
                remaining = 5 - int(elapsed)
                cv2.putText(frame, f"Closing in {remaining}s... (Press Q to close)", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)

                cv2.imshow("Door Camera Preview", frame)
                
                # Exit conditions: 'q' pressed or 5 seconds passed
                if cv2.waitKey(1) & 0xFF == ord('q') or elapsed > 5:
                    break
            
            cap.release()
            cv2.destroyAllWindows()
            
        except Exception as e:
            print(f"Preview Error: {e}")
        finally:
            # 3. Resume background monitoring
            self.door_thread.set_pause(False)
    def on_close(self):
        self.stop_event.set()
        self.door_thread.stop()
        self.root.destroy()
# ---------------- RUN APP ----------------
if __name__ == "__main__":
    root = tk.Tk()
    app = DetectionApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_close)
    root.mainloop()
