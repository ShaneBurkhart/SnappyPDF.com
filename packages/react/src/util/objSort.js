export const alphabeticalObjSort = (objKey, ascending=true) => {
  return (a, b) => {
    // equal items sort equally
    if (a[objKey] === b[objKey]) {
        return 0;
    }
    // nulls sort after anything else
    else if (a[objKey] === null) {
        return 1;
    }
    else if (b[objKey] === null) {
        return -1;
    }
    // otherwise, if we're ascending, lowest sorts first
    else if (ascending) {
        return a[objKey] < b[objKey] ? -1 : 1;
    }
    // if descending, highest sorts first
    else { 
        return a[objKey] < b[objKey] ? 1 : -1;
    }
  };
};

export const numericObjSort = (objKey, ascending) => {
  if (ascending) return (a,b) => a[objKey] - b[objKey];
  return (a,b) => b[objKey] - a[objKey];
}

export const objSort = (objKey, ascending) => {
  if (typeof objKey === 'number') return (numericObjSort(objKey, ascending));
  return alphabeticalObjSort(objKey, ascending);
}
