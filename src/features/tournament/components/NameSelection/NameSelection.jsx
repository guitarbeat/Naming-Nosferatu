/**
 * @module TournamentSetup/components/NameSelection
 * @description Name selection component with admin filtering options
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import { NameCard } from "../../../../shared/components";
import { DEFAULT_DESCRIPTION } from "../../constants";
import { filterAndSortNames, generateCategoryOptions, getRandomCatImage } from "../../utils";
import FilterControls from "./FilterControls";
import ResultsInfo from "./ResultsInfo";
import styles from "../../TournamentSetup.module.css";

function NameSelection({
  selectedNames,
  availableNames,
  onToggleName,
  isAdmin,
  // Admin-only props
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  isSwipeMode,
  showCatPictures,
  imageList,
  // Swipeable cards component passed as prop
  SwipeableCards,
}) {
  // * For non-admin users, just show all names. For admins, filter and sort
  const displayNames = isAdmin
    ? filterAndSortNames(availableNames, {
        category: selectedCategory,
        searchTerm,
        sortBy,
      })
    : availableNames;

  const categoryOptions = useMemo(
    () => generateCategoryOptions(categories, availableNames),
    [categories, availableNames]
  );

  return (
    <div className={styles.nameSelection}>
      {/* Swipe Mode Instructions */}
      {isSwipeMode && (
        <div className={styles.swipeModeInstructions}>
          <span>
            👈 Swipe left to remove • 👉 Swipe right to select for tournament
          </span>
        </div>
      )}

      {/* Admin-only filtering and sorting controls */}
      {isAdmin && (
        <FilterControls
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      )}

      {/* Admin-only results count */}
      {isAdmin && (
        <ResultsInfo
          displayCount={displayNames.length}
          totalCount={availableNames.length}
          selectedCategory={selectedCategory}
          searchTerm={searchTerm}
        />
      )}

      <div className={styles.cardsContainer}>
        {isSwipeMode ? (
          <SwipeableCards
            names={displayNames}
            selectedNames={selectedNames}
            onToggleName={onToggleName}
            isAdmin={isAdmin}
            showCatPictures={showCatPictures}
            imageList={imageList}
          />
        ) : (
          displayNames.map((nameObj) => (
            <NameCard
              key={nameObj.id}
              name={nameObj.name}
              description={nameObj.description || DEFAULT_DESCRIPTION}
              isSelected={selectedNames.some((n) => n.id === nameObj.id)}
              onClick={() => onToggleName(nameObj)}
              size="small"
              // Cat picture when enabled
              image={
                showCatPictures
                  ? getRandomCatImage(nameObj.id, imageList)
                  : undefined
              }
              // Admin-only metadata display
              metadata={
                isAdmin
                  ? {
                      rating: nameObj.avg_rating,
                      popularity: nameObj.popularity_score,
                      tournaments: nameObj.total_tournaments,
                      categories: nameObj.categories,
                    }
                  : undefined
              }
            />
          ))
        )}
      </div>

      {isAdmin && displayNames.length === 0 && (
        <div className={styles.noResults}>
          <p>😿 No names found matching your criteria</p>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}

NameSelection.propTypes = {
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  availableNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleName: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  categories: PropTypes.arrayOf(PropTypes.object),
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  sortBy: PropTypes.string,
  onSortChange: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.arrayOf(PropTypes.string),
  SwipeableCards: PropTypes.elementType,
};

export default NameSelection;

