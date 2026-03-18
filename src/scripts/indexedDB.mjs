 
 


//-----------------------------------------------------------------------------
// indexedDB utilises the idb library by Jake Archibald:
// https://github.com/jakearchibald/idb
//-----------------------------------------------------------------------------


/* External module imports */
import {openDB, deleteDB} from '/external/modules/idb';

/* Shared imports */
import {showSnackbar} from '/shared/scripts/snackbar.js';


//-----------------------------------------------------------------------------
// idb variables for Viewer
//-----------------------------------------------------------------------------
const dbName = 'melinda-poistot';
const dbVersion = 1;
const dbStores = ['validItems', 'removedItems'];


//-----------------------------------------------------------------------------
// open + upgrade idb
//-----------------------------------------------------------------------------
const dbPromise = openDB(dbName, dbVersion, {
  upgrade(db) {
    dbStores.forEach(store => {
      db.createObjectStore(store);
    });
  }
});


//-----------------------------------------------------------------------------
// delete idb
//-----------------------------------------------------------------------------
export async function deleteIdb() {
  return await deleteDB(dbName, {});
}

/*****************************************************************************/
/* Clear all database stores */

export async function dbClearAllStores() {
  await idbClearValidItems();
  await idbClearRemovedItems();
}

//-----------------------------------------------------------------------------
// idb functions for one set of logs
//-----------------------------------------------------------------------------
export async function idbGetValidItems() {
  return (await dbPromise).get('validItems', 'validItems');
}

export async function idbSetValidItems(val) {
  return (await dbPromise).put('validItems', val, 'validItems');
}

export async function idbClearValidItems() {
  return (await dbPromise).clear('validItems');
}

//-----------------------------------------------------------------------------
// idb functions for the correlation id list
//-----------------------------------------------------------------------------
export async function idbGetRemovedItems() {
  return (await dbPromise).get('removedItems', 'removedItems');
}

export async function idbSetRemovedItems(val) {
  return (await dbPromise).put('removedItems', val, 'removedItems');
}

export async function idbClearRemovedItems() {
  return (await dbPromise).clear('removedItems');
}

//-----------------------------------------------------------------------------
// function to check the status of user's indexedDB storage in browser
//-----------------------------------------------------------------------------
export function doIndexedDbCheck() {
  console.log('Checking idb storage...');

  // Try opening a specific indexedDB in the browser storage with the name given as parameter
  // Note: no version checking at this point, just name check
  const request = indexedDB.open(dbName);

  // The indexedDB could not be opened.
  // The error is logged in console.
  request.onerror = (event) => {
    console.error(`Error in opening indexedDB '${dbName}' version '${dbVersion}':`, event.target.error);
    console.log(`Note: IndexedDB can not be used in private browsing mode in Firefox or Edge`);
    showSnackbar({style: 'info', text: 'Note for Firefox and Edge users: Viewer features are not available in private browsing mode'});
  };

  // The indexedDB was succesfully opened.
  // Start checking for deviations (caching only basic differences)
  request.onsuccess = (event) => {
    let idbCheckPass = true;
    const idbFromBrowserStorage = event.target.result;
    const {version} = idbFromBrowserStorage;
    const storeNames = [...idbFromBrowserStorage.objectStoreNames];


    if (version !== dbVersion) {
      console.log('The idb version number does not match!');
      idbCheckPass = false;
    }

    if (storeNames.length !== dbStores.length) {
      console.log('The number of idb stores does not match!');
      idbCheckPass = false;
    }

    dbStores.sort();
    storeNames.sort();

    for (let i = 0; i < storeNames.length; i++) {
      if (storeNames[i] !== dbStores[i]) {
        console.log('The idb store names do not match!');
        idbCheckPass = false;
      }
    }

    if (idbCheckPass === false) {
      console.log('IndexedDB check failed!');
      deleteIdb();
      console.log('IndexedDB deleted => reloading page!');
      window.location.reload();
      return;
    }

    console.log(`IndexedDB OK! Using version '${version}' with stores '${storeNames}'`);
  };
}