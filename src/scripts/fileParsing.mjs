const MELINDA_ID_PATTERN = /^\(FI-MELINDA\)(\d+)$/;
const LOCAL_ID_PATTERN = /^\d+(\s+FCC\d+)*$/;
const MULTI_ID_PATTERN = /^((\(FI-MELINDA\)\d+|FCC\d+)\s*)*$/;
const MULTI_WITH_LOCAL_ID_PATTERN = /^\d+\s+((\(FI-MELINDA\)\d+|FCC\d+)\s*)*$/;


export function parseFile(input) {
  const items = input.split('\n').map(trimmer);
  const removedItems = [];
  const validItems = items.map((item, index) => {
    if (item.length === 0) {
      removedItems.push({row: index + 1, raw: item, info: 'Tyhjä rivi'});  
      return false;
    }

    if (item.length > 100) {
      removedItems.push({row: index + 1, raw: item, info: 'Rivi liian pitkä'});  
      return false;
    }

    if ((/^\(FI-MELINDA\)/u).test(item) || (/FCC/u).test(item)) {
      const [head] = item.split(/\s+/);
      const parsedItem = head.replace(/\(FI-MELINDA\)/g, '').replace(/FCC/g, '');
      if (parsedItem.length !== 9) {
        removedItems.push({row: index + 1, raw: item, info: '(FI-MELINDA) tai FCC arvo ei ole 9 merkin mittainen'});  
        return false;
      }
      return matcher(item, index);
    }

    if (items.indexOf(item) === index) {
      return matcher(item, index);
    }

    console.log(`Rejecting item: ${item}`);
    removedItems.push({row: index + 1, raw: item, info: `Tupla riville ${items.indexOf(item)}`});  
    return false;
  }).filter(item => item);

  return {validItems, removedItems};

  function trimmer(str) {
    return str.trim();
  }

  function matcher(inputLine, index) {
    if (MELINDA_ID_PATTERN.test(inputLine)) {
      const [, melindaId] = inputLine.match(MELINDA_ID_PATTERN);
      return {
        recordIds: [melindaId.replace(/\(FI-MELINDA\)/g, '').replace(/FCC/g, '')],
        raw: inputLine,
        row: index + 1
      };
    }

    if (MULTI_ID_PATTERN.test(inputLine)) {
      const cols = inputLine.replace(/\(FI-MELINDA\)/g, '').replace(/FCC/g, '');
      if (cols.includes(' ')) {
        return {
          localId: '',
          recordIds: cols.split(/\s+/),
          raw: inputLine,
          row: index + 1
        };
      }

      return {
        localId: '',
        recordIds: [cols],
        raw: inputLine,
        row: index + 1
      };
    }

    if (MULTI_WITH_LOCAL_ID_PATTERN.test(inputLine)) {
      const cols = inputLine.replace(/\(FI-MELINDA\)/g, '').replace(/FCC/g, '');
      const [head, ...tail] = cols.split(/\s+/);

      return {
        localId: head,
        recordIds: tail,
        raw: inputLine,
        row: index + 1
      };
    }

    if (LOCAL_ID_PATTERN.test(inputLine)) {
      const cols = inputLine.replace(/\(FI-MELINDA\)/g, '').replace(/FCC/g, '');
      const [head, ...tail] = cols.split(/\s+/);
      removedItems.push({
        localId: head,
        recordIds: tail,
        raw: inputLine,
        row: index + 1,
        info: `Pelkkä paikalliskannan id tunnistettu`
      });  
      return;
    }

    console.log('Rivi ei ole sallitussa muodossa');
    removedItems.push({row: index + 1, raw: inputLine, info: 'Rivi ei ole sallitussa muodossa'});  
    return false;
  }
}
