 

//-----------------------------------------------------------------------------------------
// Functions for file dialog: file upload and file download for merge records
//-----------------------------------------------------------------------------------------

/* Local imports */
import {parseFile} from '/scripts/fileParsing.mjs';
import {setDataToIndexedDB} from '/scripts/poistot.mjs';
import {startProcess} from '/shared/scripts/progressbar.js';
/* Shared imports */
import {disableElement, enableElement, highlightElement} from '/shared/scripts/elements.js';
import {showSnackbar} from '/shared/scripts/snackbar.js';
import {eventHandled} from '/shared/scripts/uiUtils.js';

window.uploadFile = function (event) {
  const dialog = document.getElementById('dialogForUpload');
  dialog.showModal();
};

window.showInstructions = function (event) {
  eventHandled(event);
  const instructions = document.getElementById('instructions');
  const hideButton = document.getElementById('hideInstructionsButton');
  const showButton = document.getElementById('showInstructionsButton');

  instructions.style.display = 'block';
  showButton.style.display = 'none';
  hideButton.style.display = 'flex';
};

window.hideInstructions = function (event) {
  eventHandled(event);
  const instructions = document.getElementById('instructions');
  const hideButton = document.getElementById('hideInstructionsButton');
  const showButton = document.getElementById('showInstructionsButton');

  instructions.style.display = 'none';
  showButton.style.display = 'flex';
  hideButton.style.display = 'none';
};

window.openFileBrowse = function (event) {
  eventHandled(event);
  const fileInput = document.getElementById('fileUpload');
  fileInput.click();
};

window.clearSelectedFile = function (event) {
  eventHandled(event);
  const fileInput = document.getElementById('fileUpload');
  fileInput.value = '';
  return fileInput.dispatchEvent(new Event('change'));
};

window.cancelUpload = function (event) {
  console.log('File upload cancelled');
  showSnackbar({style: 'status', text: 'Tiedoston avaaminen peruttu'});
};

window.confirmUpload = function (event) {
  startProcess();
  const file = document.getElementById('fileUpload').files[0];
  const reader = new FileReader();

  if (file) {
    console.log(`Trying to read file ${file.name}...`);
    reader.readAsText(file, 'UTF-8');

    reader.onload = function (event) {
      const fileContent = event.target.result;
      // handle file
      const parsedFileData = parseFile(fileContent);
      setDataToIndexedDB(parsedFileData);
    };

    reader.onerror = function (error) {
      console.log('Error reading file ', error);
      showSnackbar({style: 'error', text: 'Valitettavasti tiedoston avaus ei onnistunut!'});
    };
  }
};

export function checkFile(file) {
  console.log('Checking uploaded file...');
  const confirmUploadButton = document.getElementById('confirmUploadButton');
  const fileNameDiv = document.getElementById('selectedFileName');

  if (!file) {
    console.log('No file to check!');
    disableElement(confirmUploadButton);
    return;
  }

  if (file.size === 0) {
    console.log('File is empty!');
    disableElement(confirmUploadButton);
    highlightElement(fileNameDiv, 'var(--color-functional-red)');
    showSnackbar({style: 'alert', text: 'Tyhjää tiedostoa ei voi avata, tarkista tiedoston sisältö!'});
    return;
  }

  if (file.type !== 'text/plain') {
    console.log(`File type '${file.type}' is not accepted for upload!`);
    confirmUploadButton.title = 'Valitse ensin tiedosto, jonka tyyppi on pelkkä teksti (.txt)';
    disableElement(confirmUploadButton);
    highlightElement(fileNameDiv, 'var(--color-functional-red)');
    showSnackbar({style: 'alert', text: 'Vain pelkkää tekstiä sisältävä tiedosto hyväksytään, tarkista tiedoston tyyppi!'});
    return;
  }

  confirmUploadButton.removeAttribute('title');
  enableElement(confirmUploadButton);
  highlightElement(fileNameDiv, 'var(--color-functional-green)');
}