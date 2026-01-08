/**
 * Compare two arrays of objects by a key and find:
 * - added_rtt: in apiList but not in dbList
 * - removed_rtt: in dbList but not in apiList
 *
 * @param {Array<Object>} apiList - data from API
 * @param {Array<Object>} dbList  - data from DB
 * @param {(item: Object) => string|number} getKey - function to return the unique key for an item
 */
function diff_by_key(apiList, dbList, getKey) {
  // Build maps for O(1) lookup
  const apiMap = new Map(apiList.map((item) => [getKey(item), item]));
  const dbMap = new Map(dbList.map((item) => [getKey(item), item]));

  // In API but not DB -> insert
  const added_rtt = apiList.filter((item) => {
    const key = getKey(item);
    return !dbMap.has(key);
  });

  // In DB but not API -> delete
  const removed_rtt = dbList.filter((item) => {
    const key = getKey(item);
    return !apiMap.has(key);
  });

  return { added_rtt, removed_rtt };
}

module.exports = diff_by_key;
