import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ScrollToTopButton({ isLoggedIn }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowScrollTop(false);
      return undefined;
    }

    let scrollTimeout = null;

    const checkScroll = () => {
      const threshold =
        window.innerHeight <= 768
          ? window.innerHeight * 1.5
          : window.innerHeight;
      setShowScrollTop(window.scrollY > threshold);
    };

    const throttledCheckScroll = () => {
      if (scrollTimeout) return;

      scrollTimeout = requestAnimationFrame(() => {
        checkScroll();
        scrollTimeout = null;
      });
    };

    checkScroll();

    window.addEventListener('scroll', throttledCheckScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledCheckScroll);
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <button
      type="button"
      className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      aria-hidden={!showScrollTop}
      tabIndex={showScrollTop ? 0 : -1}
    >
      ↑
    </button>
  );
}

ScrollToTopButton.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired
};

export default ScrollToTopButton;
