(() => {
  // Solver
  function solveZip(R, C, nums, dWalls, rWalls) {
    const size = R * C, path = [], visited = new Uint8Array(size);
    const head = nums[0], foot = nums[nums.length - 1];
    const numMap = new Int8Array(size).fill(0);
    nums.forEach((idx, i) => numMap[idx] = i + 1);
    const isWall = (i, dir) => {
      if (dir === 0) return (i % C === C - 1) || rWalls.includes(i);
      if (dir === 1) return (i % C === 0) || rWalls.includes(i - 1);
      if (dir === 2) return (i >= size - C) || dWalls.includes(i);
      if (dir === 3) return (i < C) || dWalls.includes(i - C);
    };
    function dfs(curr, lastNum) {
      path.push(curr); visited[curr] = 1;
      if (numMap[curr] > 0) lastNum = numMap[curr];
      if (path.length === size) return curr === foot;
      const neighbors = [curr + 1, curr - 1, curr + C, curr - C];
      for (let i = 0; i < 4; i++) {
        const next = neighbors[i];
        if (!isWall(curr, i) && !visited[next]) {
          if (numMap[next] > 0 && numMap[next] !== lastNum + 1) continue;
          if (dfs(next, lastNum)) return true;
        }
      }
      path.pop(); visited[curr] = 0; return false;
    }
    dfs(head, 1);
    return compressSequence(path);
  }

  function compressSequence(seq) {
    if (!seq.length) return [];
    const res = [seq[0]];
    for (let i = 1; i < seq.length; i++) {
      const d = seq[i] - seq[i - 1];
      while (i + 1 < seq.length && seq[i + 1] - seq[i] === d) i++;
      res.push(seq[i]);
    }
    return res;
  }

  // DOM
  const apiV1 = {
    getGrid: () => document.getElementById('rehydrate-data') ? document : null,
    parse: (doc) => {
      const txt = doc.getElementById('rehydrate-data').textContent;
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

  window.autoSolve = async () => {
    try { await trySolve(apiV1) || await trySolve(apiV0); } 
    catch (e) { console.error('AutoSolve failed', e); }
  };
  
  // For other access patterns if needed
  window.zipPopupButtonOnClick = window.autoSolve;
  window.getPuzzleState = () => {
     try {
       const grid1 = apiV1.getGrid();
       if(grid1) {
          const {sol} = apiV1.parse(grid1);
          // Try to get dimensions for V1 if possible, otherwise rely on V0 if V1 is minimal
          // For now, let's assume we can fallback or simple return what we have.
          // If we only have sol, we can't render grid. Let's try to get dim from V0 logic even if V1 data is used.
          // Actually, simply relying on V0 for visualization structure is safer if V1 is just data.
       }
       const grid0 = apiV0.getGrid();
       if(grid0) {
          const {args} = apiV0.parse(grid0);
          // SOLVE IT to get the path
          const solution = solveZip(...args);
          return { 
            rows: args[0], cols: args[1], numberedCells: args[2], 
            downWalls: args[3], rightWalls: args[4], 
            solution: solution 
          };
       }
     } catch(e) { console.error(e); }
     return null;
  };

})();
