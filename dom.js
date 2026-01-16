import { solveZip, compressSequence } from './solver.js';

export async function autoSolve() {
  try { await trySolve(apiV1) || await trySolve(apiV0); } 
  catch (e) { console.error('AutoSolve failed', e); }
}

async function trySolve(api) {
  try {
    const grid = api.getGrid(), data = api.parse(grid);
    if (!data) return false;
    const seq = data.sol ? compressSequence(data.sol) : solveZip(...data.args);
    console.log('Solution:', seq);
    for (const idx of seq) await click(data.cells[idx], idx);
    return true;
  } catch (e) { return false; }
}

const apiV1 = {
  getGrid: () => document.getElementById('rehydrate-data') ? document : null,
  parse: (doc) => {
    const txt = doc.getElementById('rehydrate-data').textContent;
    const json = JSON.parse(txt.substring(txt.indexOf('['), txt.indexOf(']') + 1));
    const raw = JSON.parse(txt.match(/\"solution\"\]?,(\[.*?\])/)[1]);
    const cells = document.querySelectorAll('[data-test-id="interactive-grid"] [data-cell-idx]');
    return { sol: raw, cells: Array.from(cells).sort((a,b)=>a.dataset.cellIdx - b.dataset.cellIdx) };
  }
};

const apiV0 = {
  getGrid: () => document.querySelector('.grid-game-board') || document.querySelector('iframe')?.contentDocument?.querySelector('.grid-game-board'),
  parse: (grid) => {
    const S = grid.style, R = +S.getPropertyValue('--rows'), C = +S.getPropertyValue('--cols');
    const cells = Array.from(grid.children).filter(c => c.hasAttribute('data-cell-idx'));
    const args = [R, C, [], [], []], divs = new Array(R*C);
    cells.forEach(d => {
      const i = +d.dataset.cellIdx, txt = d.querySelector('.trail-cell-content')?.textContent;
      divs[i] = d;
      if (txt) args[2][+txt - 1] = i;
      if (d.querySelector('.trail-cell-wall--down')) args[3].push(i);
      if (d.querySelector('.trail-cell-wall--right')) args[4].push(i);
    });
    return { args, cells: divs };
  }
};

async function click(el, i) {
  return new Promise(r => {
    const obs = new MutationObserver(() => { obs.disconnect(); r(); });
    obs.observe(el, { attributes: true, childList: true, subtree: true });
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    setTimeout(() => { obs.disconnect(); r(); }, 500); 
  });
}