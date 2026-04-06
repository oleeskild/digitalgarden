// Natural sort comparison - handles numbers anywhere in the string
const naturalCompare = (a, b) => {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Split into chunks of text and numbers
  const aChunks = aLower.match(/(\d+|\D+)/g) || [];
  const bChunks = bLower.match(/(\d+|\D+)/g) || [];

  const maxLen = Math.max(aChunks.length, bChunks.length);

  for (let i = 0; i < maxLen; i++) {
    const aChunk = aChunks[i] || '';
    const bChunk = bChunks[i] || '';

    const aIsNum = /^\d+$/.test(aChunk);
    const bIsNum = /^\d+$/.test(bChunk);

    if (aIsNum && bIsNum) {
      // Compare as numbers
      const diff = parseInt(aChunk, 10) - parseInt(bChunk, 10);
      if (diff !== 0) return diff;
    } else {
      // Compare as strings
      if (aChunk < bChunk) return -1;
      if (aChunk > bChunk) return 1;
    }
  }

  return 0;
};

const sortTree = (unsorted, navigationOrder, currentPath) => {
  const orderList = navigationOrder && navigationOrder[currentPath];

  let orderedKeys;

  if (orderList && Array.isArray(orderList)) {
    const existingKeys = new Set(Object.keys(unsorted));
    const orderedExisting = orderList.filter((k) => existingKeys.has(k));
    const orderedSet = new Set(orderedExisting);
    const unorderedKeys = Object.keys(unsorted)
      .filter((k) => !orderedSet.has(k))
      .sort((a, b) => {
        let a_pinned = unsorted[a].pinned || false;
        let b_pinned = unsorted[b].pinned || false;
        if (a_pinned != b_pinned) {
          return a_pinned ? -1 : 1;
        }
        const a_is_note = a.indexOf(".md") > -1;
        const b_is_note = b.indexOf(".md") > -1;
        if (a_is_note && !b_is_note) return 1;
        if (!a_is_note && b_is_note) return -1;
        return naturalCompare(a, b);
      });

    orderedKeys = [...orderedExisting, ...unorderedKeys];
  } else {
    orderedKeys = Object.keys(unsorted).sort((a, b) => {
      let a_pinned = unsorted[a].pinned || false;
      let b_pinned = unsorted[b].pinned || false;
      if (a_pinned != b_pinned) {
        return a_pinned ? -1 : 1;
      }
      const a_is_note = a.indexOf(".md") > -1;
      const b_is_note = b.indexOf(".md") > -1;
      if (a_is_note && !b_is_note) return 1;
      if (!a_is_note && b_is_note) return -1;
      return naturalCompare(a, b);
    });
  }

  const orderedTree = orderedKeys.reduce((obj, key) => {
    obj[key] = unsorted[key];
    return obj;
  }, {});

  for (const key of Object.keys(orderedTree)) {
    if (orderedTree[key].isFolder) {
      const childPath = currentPath === "/" ? `/${key}` : `${currentPath}/${key}`;
      orderedTree[key] = sortTree(orderedTree[key], navigationOrder, childPath);
    }
  }

  return orderedTree;
};

function getPermalinkMeta(note, key) {
  let permalink = "/";
  let parts = note.filePathStem.split("/");
  let name = parts[parts.length - 1];
  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  let hide = false;
  let pinned = false;
  let folders = null;
  try {
    if (note.data.permalink) {
      permalink = note.data.permalink;
    }
    if (note.data.tags && note.data.tags.indexOf("gardenEntry") != -1) {
      permalink = "/";
    }    
    if (note.data.title) {
      name = note.data.title;
    }
    if (note.data.noteIcon) {
      noteIcon = note.data.noteIcon;
    }
    // Reason for adding the hide flag instead of removing completely from file tree is to
    // allow users to use the filetree data elsewhere without the fear of losing any data.
    if (note.data.hide) {
      hide = note.data.hide;
    }
    if (note.data.pinned) {
      pinned = note.data.pinned;
    }
    if (note.data["dg-path"]) {
      folders = note.data["dg-path"].split("/");
    } else {
      // Ensure we extract everything after the LAST "notes/" occurrence
      const parts = note.filePathStem.split("/notes/");
      if (parts.length > 1) {
        folders = parts.slice(-1)[0].split("/"); // Take the last part after "notes/"
      } else {
        folders = []; // Handle unexpected cases gracefully
      }
    }
    folders[folders.length - 1]+= ".md";
  } catch {
    //ignore
  }

  return [{ permalink, name, noteIcon, hide, pinned }, folders];
}

function assignNested(obj, keyPath, value) {
  lastKeyIndex = keyPath.length - 1;
  for (var i = 0; i < lastKeyIndex; ++i) {
    key = keyPath[i];
    if (!(key in obj)) {
      obj[key] = { isFolder: true };
    }
    obj = obj[key];
  }
  obj[keyPath[lastKeyIndex]] = value;
}

function getFileTree(data) {
  const tree = {};
  (data.collections.note || []).forEach((note) => {
    const [meta, folders] = getPermalinkMeta(note);
    assignNested(tree, folders, { isNote: true, ...meta });
  });
  const navigationOrder = data.navigationOrder || null;
  const fileTree = sortTree(tree, navigationOrder, "/");
  return fileTree;
}

exports.getFileTree = getFileTree;
