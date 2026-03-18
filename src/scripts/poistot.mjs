import {
  idbGetValidItems,
  idbGetRemovedItems,
  idbSetValidItems,
  idbSetRemovedItems,
  dbClearAllStores
} from '/scripts/indexedDB.mjs';
import {startProcess, stopProcess} from '/shared/scripts/progressbar.js';
import {eventHandled} from '/shared/scripts/uiUtils.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';
import {createCombobox} from '/shared/scripts/combobox.js';
import {checkFile} from '/scripts/fileHandling.mjs';
import {createItemsTable} from '/scripts/panelIdList.mjs';
import {authVerify, postRemoveIds} from "/scripts/callRest.mjs";

window.initialize = function () {
  console.log('Initializing Poistot');
  addFileDialogEventListeners();
  addFormHandlingEventListeners();
  setUserSpecificUiInfo();
  updateIdsList();
  catchLogout();
};

function addFormHandlingEventListeners() {
  const removeLowTagForm = document.getElementById('tietuetunniste-poistopyynto-form');
  removeLowTagForm.addEventListener('submit', removeLowTagEvent);
  removeLowTagForm.addEventListener('reset', event => {
    console.log('reset event');
    eventHandled(event);
    idbSetValidItems([{row: 0, raw: ''}]);
    idbSetRemovedItems([{row: 0, raw: ''}]);

    updateOnChange(new Event('change'));
  });

  const checkboxRecordReplication = document.getElementById('recordReplication');
  const checkboxRecordRemoval = document.getElementById('recordRemoval');
  checkboxRecordReplication.addEventListener('click', recordReplicationVsrecordRemoval);
  checkboxRecordRemoval.addEventListener('click', recordReplicationVsrecordRemoval);
}

function recordReplicationVsrecordRemoval(event) {
  const checkboxRecordReplication = document.getElementById('recordReplication');
  const checkboxRecordRemoval = document.getElementById('recordRemoval');

  if (event.target.id === 'recordReplication' && checkboxRecordReplication.checked) {
    checkboxRecordRemoval.checked = false;
  }

  if (event.target.id === 'recordRemoval' && checkboxRecordRemoval.checked) {
    checkboxRecordReplication.checked = false;
  }
}

async function removeLowTagEvent(event) {
  console.log('Change submit event');
  const submitButton = document.getElementById('submit-tietuetunniste-poistopyynto-form');
  eventHandled(event);

  const form = document.getElementById('tietuetunniste-poistopyynto-form');
  submitButton.setAttribute('disabled', 'true');
  startProcess();
  try {
    console.log('submit event');
    eventHandled(event);
    const formData = new FormData(form);
    const libraryTag = formData.get('libraryTag');
    if (libraryTag === null) {
      showSnackbar({style: 'error', text: 'Valitse poistettava tietue tunnus'});
      return;
    }

    const data = await idbGetValidItems();
    if (data[0].row === 0 && data[0].raw === '') {
      showSnackbar({style: 'error', text: 'Tyhjän listan lähettäminen estetty'});
      return;
    }

    const blob = {
      settings: {
        libraryTag,
        replicateToLocalDB: formData.get('recordReplication') ? true : false,
        removeEmptyRecord: formData.get('recordRemoval') ? true : false,
        handleSubRecords: formData.get('subrecordHandlind') ? true : false
      },
      data
    };

    console.log(blob);
    console.log(JSON.stringify(blob));
    const result = await postRemoveIds(blob);
    console.log(result);
    showSnackbar({style: 'info', text: `List has been sent to process. Process id: ${result.id}`});
  } catch (err) {
    console.log(err);
  } finally {
    submitButton.removeAttribute('disabled');
    stopProcess();
  };
}

async function setUserSpecificUiInfo() {
  const {authorization} = await authVerify();
  setRemovableLowTags(authorization);

  function setRemovableLowTags() {
    console.log('Set removable tags');
    const comboboxOptions = {
      comboboxId: 'lowTags',
      comboboxOptions: []
    };

    createCombobox(comboboxOptions);
    return;
  }
}

function addFileDialogEventListeners() {
  const fileInput = document.getElementById('fileUpload');
  const fileNameDiv = document.getElementById('selectedFileName');
  const clearFileSelectButton = document.getElementById('clearFileSelect');

  fileInput.addEventListener('change', event => {
    eventHandled(event);

    const file = fileInput.files[0];
    checkFile(file);

    file
      ? (fileNameDiv.innerHTML = file.name, fileNameDiv.classList.add('file-selected'), clearFileSelectButton.style.display = 'flex')
      : (fileNameDiv.innerHTML = 'Ei valittua tiedostoa', fileNameDiv.classList.remove('file-selected'), clearFileSelectButton.style.display = 'none');

  });
}

export function setDataToIndexedDB(data) {
  idbSetValidItems([{row: 0, raw: ''}]);
  idbSetRemovedItems([{row: 0, raw: ''}]);
  console.log(JSON.stringify(data));
  const {validItems, removedItems} = data;

  setIdbData(validItems, 'valid');
  setIdbData(removedItems, 'removed');

  updateOnChange(new Event('change'));

  stopProcess();

  async function setIdbData(data, type) {
    if (data.length === 0) {
      if (type === 'valid') {
        await idbSetValidItems([{row: 0, raw: ''}]);
        return;
      }

      if (type === 'removed') {
        await idbSetRemovedItems([{row: 0, raw: ''}]);
        return;
      }

      throw new Error('Unknown idb data type!');
    }

    if (type === 'valid') {
      await idbSetValidItems(data);
      return;
    }

    if (type === 'removed') {
      await idbSetRemovedItems(data);
      return;
    }

    throw new Error('Unknown idb data type!');
  }
}

window.updateOnChange = (event) => {
  eventHandled(event);
  updateIdsList();
};

function updateIdsList() {
  const idList = document.getElementById('idList');
  idList.innerHTML = "";

  idbGetValidItems()
    .then((data) => {
      if (data) {
        idList.appendChild(createItemsTable(data, 'Hyväksytyt, yksilölliset rivit'));
      }
    })
    .catch((error) => {
      console.log('Error getting valid items list from indexedDB (if undefined, probably it is not yet set): ', error);
      showSnackbar({style: 'info', text: 'Odota hetki listan päivittymistä'});
    });

  idbGetRemovedItems()
    .then((data) => {
      if (data) {
        idList.appendChild(createItemsTable(data, 'Poistetut rivit'));
      }
    })
    .catch((error) => {
      console.log('Error getting valid items list from indexedDB (if undefined, probably it is not yet set): ', error);
      showSnackbar({style: 'info', text: 'Odota hetki listan päivittymistä'});
    });
}

function catchLogout() {
  const logoutLink = document.querySelector('.logout a');
  if (logoutLink) {
    logoutLink.addEventListener('click', async function (event) {
      //actions before user is directed to /logout
      await dbClearAllStores();
    });
  }
}