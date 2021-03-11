const DO_NOT_SWAP = 0;
const FIRST_BEFORE_SECOND = -1;
const FIRST_AFTER_SECOND = 1;

function isEmpty(variable) {
    if (typeof variable === 'string') variable = variable.trim();
    return variable == null || variable === '';
}
/**
 * @param {string} sortOrder 排序 (`asc` for 正序, `desc` for 倒序).
 * @param {object} columnPluginSettings 配置.
 * @returns {Function} 排序比较
 */
export default function compareFunctionFactory(sortOrder, key) {
    return function(value, nextValue) {
        let sortEmptyCells = false;
        if (key) {
            value = value[key];
            nextValue = nextValue[key];
        }
        if (typeof value === 'string') {
            value = value.toLowerCase();
        }

        if (typeof nextValue === 'string') {
            nextValue = nextValue.toLowerCase();
        }

        if (value === nextValue) {
            return DO_NOT_SWAP;
        }

        if (isEmpty(value)) {
            if (isEmpty(nextValue)) {
                return DO_NOT_SWAP;
            }

            // Just fist value is empty and `sortEmptyCells` option was set
            if (sortEmptyCells) {
                return sortOrder === 'asc'
                    ? FIRST_BEFORE_SECOND
                    : FIRST_AFTER_SECOND;
            }

            return FIRST_AFTER_SECOND;
        }

        if (isEmpty(nextValue)) {
            // Just second value is empty and `sortEmptyCells` option was set
            if (sortEmptyCells) {
                return sortOrder === 'asc'
                    ? FIRST_AFTER_SECOND
                    : FIRST_BEFORE_SECOND;
            }

            return FIRST_BEFORE_SECOND;
        }

        if (isNaN(value) && !isNaN(nextValue)) {
            return sortOrder === 'asc'
                ? FIRST_AFTER_SECOND
                : FIRST_BEFORE_SECOND;
        } else if (!isNaN(value) && isNaN(nextValue)) {
            return sortOrder === 'asc'
                ? FIRST_BEFORE_SECOND
                : FIRST_AFTER_SECOND;
        } else if (!(isNaN(value) || isNaN(nextValue))) {
            value = parseFloat(value);
            nextValue = parseFloat(nextValue);
        }

        if (value < nextValue) {
            return sortOrder === 'asc'
                ? FIRST_BEFORE_SECOND
                : FIRST_AFTER_SECOND;
        }

        if (value > nextValue) {
            return sortOrder === 'asc'
                ? FIRST_AFTER_SECOND
                : FIRST_BEFORE_SECOND;
        }

        return DO_NOT_SWAP;
    };
}
