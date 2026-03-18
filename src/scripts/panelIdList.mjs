export function createItemsTable(array, headerText = false) {
  const div = document.createElement('div');
  createHeader(headerText, div);
  const listHeader = document.createElement('div');
  listHeader.classList.add('id-list-header');
  listHeader.appendChild(createRowNumber({row: 'header'}, 0));
  listHeader.appendChild(makeSpan('text', 'DATA', ['raw']));

  div.appendChild(listHeader);

  array.map((data, index) => {
    const row = document.createElement('div');
    row.classList.add('row');
    row.appendChild(createRowNumber(data, index));
    row.appendChild(makeSpan('text', data.raw, ['raw']));

    if (data.info) {
      row.appendChild(makeSpan('text', '', ['flex-fill']));
      row.appendChild(makeSpan('text', 'report', ['material-symbols-outlined', 'info'], data.info));
    }

    return row;
  }).forEach(row => {
    div.appendChild(row);
  });;

  const listFooter = document.createElement('div');
  listFooter.classList.add('id-list-footer');
  div.appendChild(listFooter);

  return div;
}

function createHeader(headerText, parentElement) {
  if (headerText) {
    parentElement.appendChild(makeDiv('id-list-title', headerText));
    return;
  }

  return;
}

function createRowNumber(data, index) {
  if (data.row && data.row === 'header') {
    return makeSpan('text', 'RIVI', ['row-number']);
  }

  if (data.row) {
    return makeSpan('text', data.row, ['row-number']);
  }

  return makeSpan('text', index, ['row-number']);
}

function makeDiv(className, value) {
  const div = document.createElement('div');
  div.setAttribute('class', className);
  if (value) {
    div.innerHTML = value;
  }
  return div;
}

function makeSpan(type, data, classNames, tooltipText = false) {
  const span = document.createElement('span');
  for (let className of classNames) {
    span.classList.add(className);
  }

  if (type === 'text') {
    span.textContent = data;
  }

  if (type === 'html') {
    span.innerHTML = data;
  }

  if (tooltipText) {
    span.classList.add('tooltip');
    span.setAttribute('tooltip-text', tooltipText);
  }

  return span;
}