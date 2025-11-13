/**
 * @module CatNameBanner
 * @description "Hello my name is" name tag banner for displaying cat's chosen name
 */
import React from 'react';
import PropTypes from 'prop-types';
import { formatFullName } from '../../shared/utils/nameFormatter';
import styles from './CatNameBanner.module.css';

function CatNameBanner({ catName, isAdmin }) {
  if (!catName || !catName.is_set || !catName.show_banner) {
    return null;
  }

  const fullName = formatFullName(catName);
  const greetingText = catName.greeting_text || 'Hello! My name is';

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.nameTag}>
        <div className={styles.helloSection}>
          HELLO
        </div>
        <div className={styles.greetingSection}>
          {greetingText}
        </div>
        <div className={styles.nameSection}>
          {fullName}
        </div>
      </div>
      {isAdmin && (
        <p className={styles.adminNote}>
          ✏️ You can edit this in your Profile
        </p>
      )}
    </div>
  );
}

CatNameBanner.propTypes = {
  catName: PropTypes.shape({
    first_name: PropTypes.string,
    middle_names: PropTypes.arrayOf(PropTypes.string),
    last_name: PropTypes.string,
    greeting_text: PropTypes.string,
    display_name: PropTypes.string,
    is_set: PropTypes.bool,
    show_banner: PropTypes.bool
  }),
  isAdmin: PropTypes.bool
};

CatNameBanner.defaultProps = {
  catName: null,
  isAdmin: false
};

export default CatNameBanner;
