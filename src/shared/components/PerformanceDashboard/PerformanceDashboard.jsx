/**
 * @module PerformanceDashboard
 * @description Real-time performance monitoring dashboard restricted to administrators (as enforced in App.jsx)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import Card from "../Card";
import { performanceMonitor, throttle } from "../../utils/coreUtils";
import styles from "./PerformanceDashboard.module.css";

const PerformanceDashboard = ({ userName, isVisible = false, onClose }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshRef = useRef(null);

  // Update metrics with throttling to prevent excessive updates
  const updateMetrics = useCallback(() => {
    const throttledUpdate = throttle(() => {
      const currentMetrics = performanceMonitor.getAllMetrics();
      setMetrics(currentMetrics);
    }, 1000); // Throttle to max once per second
    throttledUpdate();
  }, []);

  // Initialize metrics for all users
  useEffect(() => {
    const initializeMetrics = () => {
      if (!userName) {
        setIsLoading(false);
        return;
      }

      // Load metrics immediately for all users
      if (isVisible) {
        updateMetrics();
      }
      setIsLoading(false);
    };

    initializeMetrics();
  }, [userName, isVisible, updateMetrics]);

  // Set up refresh interval (use ref to avoid re-triggering effect)
  useEffect(() => {
    if (isVisible) {
      if (!metrics) {
        updateMetrics();
      }

      // clear any existing interval
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }

      refreshRef.current = setInterval(updateMetrics, 5000); // Update every 5 seconds
    } else {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    }

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [isVisible, updateMetrics, metrics]);

  // Cleanup on unmount (redundant but safe)
  useEffect(() => {
    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading performance data...</div>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceGrade = (loadTime) => {
    if (loadTime < 1000) return { grade: "A+", color: "#28a745" };
    if (loadTime < 2000) return { grade: "A", color: "#28a745" };
    if (loadTime < 3000) return { grade: "B", color: "#ffc107" };
    if (loadTime < 5000) return { grade: "C", color: "#fd7e14" };
    return { grade: "D", color: "#dc3545" };
  };

  const getBundleGrade = (size) => {
    if (size < 500000) return { grade: "A+", color: "#28a745" };
    if (size < 1000000) return { grade: "A", color: "#28a745" };
    if (size < 2000000) return { grade: "B", color: "#ffc107" };
    if (size < 5000000) return { grade: "C", color: "#fd7e14" };
    return { grade: "D", color: "#dc3545" };
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>📊 Performance Dashboard</h2>
        <div className={styles.controls}>
          <button
            className={styles.refreshBtn}
            onClick={updateMetrics}
            title="Refresh metrics"
          >
            🔄
          </button>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            title="Close dashboard"
          >
            ✕
          </button>
        </div>
      </div>

      {metrics && (
        <div className={styles.content}>
          {/* Bundle Size Metrics */}
          <Card
            className={styles.section}
            variant="outlined"
            padding="medium"
            shadow="medium"
            background="transparent"
          >
            <h3>📦 Bundle Size</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.label}>JavaScript:</span>
                <span className={styles.value}>
                  {formatBytes(metrics.bundleSize.javascript || 0)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>CSS:</span>
                <span className={styles.value}>
                  {formatBytes(metrics.bundleSize.css || 0)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Total:</span>
                <span className={styles.value}>
                  {formatBytes(metrics.bundleSize.total || 0)}
                </span>
                <span
                  className={styles.grade}
                  style={{
                    color: getBundleGrade(metrics.bundleSize.total || 0).color,
                  }}
                >
                  {getBundleGrade(metrics.bundleSize.total || 0).grade}
                </span>
              </div>
            </div>
          </Card>

          {/* Load Time Metrics */}
          <Card
            className={styles.section}
            variant="outlined"
            padding="medium"
            shadow="medium"
            background="transparent"
          >
            <h3>⏱️ Load Performance</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.label}>First Paint:</span>
                <span className={styles.value}>
                  {formatTime(metrics.loadTimes.firstPaint || 0)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>First Contentful Paint:</span>
                <span className={styles.value}>
                  {formatTime(metrics.loadTimes.firstContentfulPaint || 0)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Total Load Time:</span>
                <span className={styles.value}>
                  {formatTime(metrics.loadTimes.totalLoadTime || 0)}
                </span>
                <span
                  className={styles.grade}
                  style={{
                    color: getPerformanceGrade(
                      metrics.loadTimes.totalLoadTime || 0,
                    ).color,
                  }}
                >
                  {
                    getPerformanceGrade(metrics.loadTimes.totalLoadTime || 0)
                      .grade
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <Card
              className={styles.section}
              variant="outlined"
              padding="medium"
              shadow="medium"
              background="transparent"
            >
              <h3>🧠 Memory Usage</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.label}>Used Heap:</span>
                  <span className={styles.value}>
                    {formatBytes(metrics.memoryUsage.usedJSHeapSize || 0)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.label}>Total Heap:</span>
                  <span className={styles.value}>
                    {formatBytes(metrics.memoryUsage.totalJSHeapSize || 0)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.label}>Heap Limit:</span>
                  <span className={styles.value}>
                    {formatBytes(metrics.memoryUsage.jsHeapSizeLimit || 0)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Connection Info */}
          {metrics.connection && (
            <Card
              className={styles.section}
              variant="outlined"
              padding="medium"
              shadow="medium"
              background="transparent"
            >
              <h3>🌐 Connection</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>
                    {metrics.connection.effectiveType || "Unknown"}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.label}>Downlink:</span>
                  <span className={styles.value}>
                    {metrics.connection.downlink
                      ? `${metrics.connection.downlink} Mbps`
                      : "Unknown"}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.label}>RTT:</span>
                  <span className={styles.value}>
                    {metrics.connection.rtt
                      ? `${metrics.connection.rtt}ms`
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* System Info */}
          <Card
            className={styles.section}
            variant="outlined"
            padding="medium"
            shadow="medium"
            background="transparent"
          >
            <h3>💻 System Info</h3>
            <div className={styles.systemInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>User Agent:</span>
                <span className={styles.value}>{metrics.userAgent}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Last Updated:</span>
                <span className={styles.value}>
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

PerformanceDashboard.propTypes = {
  userName: PropTypes.string,
  isVisible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default PerformanceDashboard;
