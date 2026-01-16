document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const $ = id => document.getElementById(id);
  const status = $('status'), btn = $('autoSolveBtn'), delay = $('solveDelay');
  
  if (!tab) return status.textContent = "No tab";
  
  try {
    await chrome.scripting.executeScript({ target: {tabId: tab.id}, files: ['solver_bundle.js'] });
    const [{result}] = await chrome.scripting.executeScript({ 
      target: {tabId: tab.id}, 
      func: () => window.getPuzzleState ? window.getPuzzleState() : null 
    });
    
    if (!result) { status.textContent = "No puzzle"; btn.disabled = true; return; }
    
    status.textContent = "Found!";
    renderPuzzle($('gridCanvas').getContext('2d'), 300, 300, result);
    
    btn.onclick = () => {
      btn.disabled = delay.disabled = true;
      let s = +delay.value || 0;
      const tick = () => {
        if (s-- <= 0) {
          $('timerStatus').textContent = "Solving...";
          chrome.scripting.executeScript({ target: {tabId: tab.id}, func: () => window.autoSolve && window.autoSolve() })
            .then(() => $('timerStatus').textContent = "Done!")
            .finally(() => btn.disabled = delay.disabled = false);
        } else {
          $('timerStatus').textContent = `In ${s+1}s...`;
          setTimeout(tick, 1000);
        }
      };
      tick();
    };
  } catch(e) { status.textContent = "Err: " + e.message; }
});

function renderPuzzle(ctx, w, h, {rows:R, cols:C, numberedCells:N, downWalls:DW, rightWalls:RW, solution:S}) {
  const cw = w/C, ch = h/R, line = (x1,y1,x2,y2) => { ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); };
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#ddd'; ctx.lineWidth=1; ctx.beginPath();
  for(let i=0;i<=C;i++) line(i*cw,0, i*cw,h);
  for(let i=0;i<=R;i++) line(0,i*ch, w,i*ch);
  ctx.stroke();

  const c = i => ({x: (i%C)*cw + cw/2, y: Math.floor(i/C)*ch + ch/2});
  
  ctx.fillStyle='#444'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='bold 14px Arial';
  N.forEach((idx, i) => {
    if(idx==null) return;
    const p = c(idx);
    ctx.beginPath(); ctx.arc(p.x,p.y,Math.min(cw,ch)*.3,0,7); ctx.fillStyle='#e0e0e0'; ctx.fill();
    ctx.fillStyle='#000'; ctx.fillText(i+1,p.x,p.y);
  });

  ctx.strokeStyle='#555'; ctx.lineWidth=3; ctx.beginPath();
  DW.forEach(i => { const p=c(i); line(p.x-cw/2, p.y+ch/2, p.x+cw/2, p.y+ch/2); });
  RW.forEach(i => { const p=c(i); line(p.x+cw/2, p.y-ch/2, p.x+cw/2, p.y+ch/2); });
  ctx.stroke();

  if(S && S.length) {
    ctx.strokeStyle='rgba(0,200,0,.7)'; ctx.lineWidth=4; ctx.beginPath();
    const start = c(S[0]); ctx.moveTo(start.x, start.y);
    S.slice(1).forEach(i => { const p=c(i); ctx.lineTo(p.x, p.y); });
    ctx.stroke();
  }
}
