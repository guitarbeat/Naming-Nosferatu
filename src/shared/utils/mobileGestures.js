/**
 * @module mobileGestures
 * @description Advanced mobile gesture utilities for enhanced touch interactions
 */

class MobileGestures {
  constructor() {
    this.gestures = new Map();
    this.activeTouches = new Map();
    this.gestureCallbacks = new Map();
    this.isEnabled = true;
    this.thresholds = {
      swipe: 50,
      longPress: 500,
      doubleTap: 300,
      pinch: 0.1,
    };
  }

  /**
   * Register a gesture handler
   * @param {string} gestureType - Type of gesture (swipe, pinch, longPress, etc.)
   * @param {Function} callback - Callback function to execute
   * @param {Object} options - Gesture options
   */
  register(gestureType, callback, options = {}) {
    const gestureId = `${gestureType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.gestureCallbacks.set(gestureId, {
      type: gestureType,
      callback,
      options: {
        threshold: this.thresholds[gestureType] || 50,
        preventDefault: true,
        ...options,
      },
    });

    return gestureId;
  }

  /**
   * Unregister a gesture handler
   * @param {string} gestureId - ID returned from register
   */
  unregister(gestureId) {
    this.gestureCallbacks.delete(gestureId);
  }

  /**
   * Enable gesture detection
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable gesture detection
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    if (!this.isEnabled) return;

    const touches = Array.from(event.touches);

    touches.forEach((touch, index) => {
      const touchId = `${touch.identifier}_${index}`;
      this.activeTouches.set(touchId, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastTime: Date.now(),
        velocity: { x: 0, y: 0 },
        distance: 0,
      });
    });

    // Handle single touch gestures
    if (touches.length === 1) {
      this.handleSingleTouchStart(touches[0], event);
    }
    // Handle multi-touch gestures
    else if (touches.length > 1) {
      this.handleMultiTouchStart(touches, event);
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    if (!this.isEnabled) return;

    const touches = Array.from(event.touches);

    touches.forEach((touch, index) => {
      const touchId = `${touch.identifier}_${index}`;
      const activeTouch = this.activeTouches.get(touchId);

      if (activeTouch) {
        const deltaTime = Date.now() - activeTouch.lastTime;
        const deltaX = touch.clientX - activeTouch.lastX;
        const deltaY = touch.clientY - activeTouch.lastY;

        // Update velocity
        activeTouch.velocity.x = deltaTime > 0 ? deltaX / deltaTime : 0;
        activeTouch.velocity.y = deltaTime > 0 ? deltaY / deltaTime : 0;

        // Update position
        activeTouch.lastX = touch.clientX;
        activeTouch.lastY = touch.clientY;
        activeTouch.lastTime = Date.now();

        // Calculate total distance
        activeTouch.distance = Math.sqrt(
          Math.pow(touch.clientX - activeTouch.startX, 2) +
            Math.pow(touch.clientY - activeTouch.startY, 2),
        );
      }
    });

    // Handle single touch gestures
    if (touches.length === 1) {
      this.handleSingleTouchMove(touches[0], event);
    }
    // Handle multi-touch gestures
    else if (touches.length > 1) {
      this.handleMultiTouchMove(touches, event);
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    if (!this.isEnabled) return;

    const touches = Array.from(event.touches);
    const endedTouches = Array.from(event.changedTouches);

    endedTouches.forEach((touch, index) => {
      const touchId = `${touch.identifier}_${index}`;
      const activeTouch = this.activeTouches.get(touchId);

      if (activeTouch) {
        this.handleTouchEndForTouch(activeTouch, touch, event);
        this.activeTouches.delete(touchId);
      }
    });

    // Handle single touch gestures
    if (touches.length === 0) {
      this.handleAllTouchesEnded(event);
    }
  }

  /**
   * Handle single touch start
   * @param {Touch} touch - Touch object
   * @param {TouchEvent} event - Touch event
   */
  handleSingleTouchStart(touch, event) {
    // Start long press timer
    const longPressTimer = setTimeout(() => {
      this.triggerGesture("longPress", {
        touch,
        event,
        duration: Date.now() - touch.startTime,
      });
    }, this.thresholds.longPress);

    // Store timer for cleanup
    this.activeTouches.get(`${touch.identifier}_0`).longPressTimer =
      longPressTimer;
  }

  /**
   * Handle single touch move
   * @param {Touch} touch - Touch object
   * @param {TouchEvent} event - Touch event
   */
  handleSingleTouchMove(touch, event) {
    const activeTouch = this.activeTouches.get(`${touch.identifier}_0`);
    if (!activeTouch) return;

    // Clear long press timer if moved too much
    if (activeTouch.distance > 10) {
      if (activeTouch.longPressTimer) {
        clearTimeout(activeTouch.longPressTimer);
        activeTouch.longPressTimer = null;
      }
    }

    // Handle swipe detection
    const deltaX = touch.clientX - activeTouch.startX;
    const deltaY = touch.clientY - activeTouch.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.thresholds.swipe) {
      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
      const direction = this.getSwipeDirection(angle);

      this.triggerGesture("swipe", {
        touch,
        event,
        direction,
        distance,
        velocity: activeTouch.velocity,
        angle,
      });
    }
  }

  /**
   * Handle multi-touch start
   * @param {Touch[]} touches - Array of touch objects
   * @param {TouchEvent} _event - Touch event
   */
  handleMultiTouchStart(touches, _event) {
    if (touches.length === 2) {
      const [touch1, touch2] = touches;

      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );

      // Store initial pinch distance
      this.activeTouches.get(`${touch1.identifier}_0`).initialPinchDistance =
        initialDistance;
      this.activeTouches.get(`${touch2.identifier}_1`).initialPinchDistance =
        initialDistance;
    }
  }

  /**
   * Handle multi-touch move
   * @param {Touch[]} touches - Array of touch objects
   * @param {TouchEvent} event - Touch event
   */
  handleMultiTouchMove(touches, event) {
    if (touches.length === 2) {
      const [touch1, touch2] = touches;

      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );

      const activeTouch1 = this.activeTouches.get(`${touch1.identifier}_0`);
      const activeTouch2 = this.activeTouches.get(`${touch2.identifier}_1`);

      if (activeTouch1 && activeTouch2) {
        const initialDistance =
          activeTouch1.initialPinchDistance || currentDistance;
        const scale = currentDistance / initialDistance;
        const scaleChange = scale - 1;

        if (Math.abs(scaleChange) > this.thresholds.pinch) {
          this.triggerGesture("pinch", {
            touches: [touch1, touch2],
            event,
            scale,
            scaleChange,
            distance: currentDistance,
          });
        }
      }
    }
  }

  /**
   * Handle touch end for specific touch
   * @param {Object} activeTouch - Active touch data
   * @param {Touch} touch - Touch object
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEndForTouch(activeTouch, touch, event) {
    const duration = Date.now() - activeTouch.startTime;

    // Clear long press timer
    if (activeTouch.longPressTimer) {
      clearTimeout(activeTouch.longPressTimer);
    }

    // Handle tap gestures
    if (activeTouch.distance < 10 && duration < 300) {
      this.handleTap(activeTouch, touch, event);
    }
  }

  /**
   * Handle tap gesture
   * @param {Object} activeTouch - Active touch data
   * @param {Touch} touch - Touch object
   * @param {TouchEvent} event - Touch event
   */
  handleTap(activeTouch, touch, event) {
    const now = Date.now();
    const lastTap = activeTouch.lastTapTime || 0;

    if (now - lastTap < this.thresholds.doubleTap) {
      // Double tap
      this.triggerGesture("doubleTap", {
        touch,
        event,
        timeBetweenTaps: now - lastTap,
      });
    } else {
      // Single tap
      this.triggerGesture("tap", {
        touch,
        event,
      });
    }

    activeTouch.lastTapTime = now;
  }

  /**
   * Handle all touches ended
   * @param {TouchEvent} _event - Touch event
   */
  handleAllTouchesEnded(_event) {
    this.triggerGesture("allTouchesEnded", {
      event: _event,
      touchCount: this.activeTouches.size,
    });
  }

  /**
   * Get swipe direction from angle
   * @param {number} angle - Angle in degrees
   * @returns {string} Direction (left, right, up, down)
   */
  getSwipeDirection(angle) {
    if (angle >= -45 && angle < 45) return "right";
    if (angle >= 45 && angle < 135) return "down";
    if (angle >= 135 || angle < -135) return "left";
    return "up";
  }

  /**
   * Trigger a gesture callback
   * @param {string} gestureType - Type of gesture
   * @param {Object} data - Gesture data
   */
  triggerGesture(gestureType, data) {
    this.gestureCallbacks.forEach((gesture, _gestureId) => {
      if (gesture.type === gestureType) {
        try {
          if (gesture.options.preventDefault) {
            data.event.preventDefault();
          }
          gesture.callback(data);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Error in gesture callback for ${gestureType}:`, error);
          }
        }
      }
    });
  }

  /**
   * Add haptic feedback
   * @param {string} type - Type of haptic feedback (light, medium, heavy)
   */
  addHapticFeedback(type = "light") {
    if ("vibrate" in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
        success: [10, 10, 10],
        error: [100],
        warning: [50, 50],
      };

      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  /**
   * Get touch device info
   * @returns {Object} Touch device information
   */
  getTouchDeviceInfo() {
    return {
      isTouchDevice: "ontouchstart" in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hasHapticFeedback: "vibrate" in navigator,
      userAgent: navigator.userAgent,
    };
  }
}

// Create singleton instance
const mobileGestures = new MobileGestures();

export default mobileGestures;
