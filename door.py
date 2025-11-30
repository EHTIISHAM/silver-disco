import cv2
import numpy as np

# Initialize video (replace with your live feed index, usually 0 or 1)
cap = cv2.VideoCapture('2.mp4')
out = cv2.VideoWriter('output.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 20.0, (1920,1080))
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
    threshold = 500 
    
    status = "OPEN"
    color = (0, 255, 0) # Green for open
    
    if edge_pixel_count > threshold:
        status = "CLOSED"
        color = (0, 0, 255) # Red for closed

    # --- VISUALIZATION FOR DEBUGGING ---
    # Draw the ROI box on the main frame
    cv2.rectangle(frame, (260, 210), (800, 350), color, 2)
    cv2.putText(frame, f"Status: {status}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    cv2.putText(frame, f"Edge Score: {edge_pixel_count}", (50, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # Show the Edge view to help you tune it
    cv2.imshow("Main Feed", frame)
    cv2.imshow("What Computer Sees (Edges)", edges)
    # need to save the video feed for later analysis
    out.write(frame)

    if cv2.waitKey(30) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()