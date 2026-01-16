export function solveZip(R, C, nums, dWalls, rWalls) {
  const size = R * C, path = [], visited = new Uint8Array(size);
  const head = nums[0], foot = nums[nums.length - 1];
  const numMap = new Int8Array(size).fill(0);
  nums.forEach((idx, i) => numMap[idx] = i + 1);
  const isWall = (i, dir) => { // 0:R, 1:L, 2:D, 3:U
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

export function compressSequence(seq) {
  if (!seq.length) return [];
  const res = [seq[0]];
  for (let i = 1; i < seq.length; i++) {
    const d = seq[i] - seq[i - 1];
    while (i + 1 < seq.length && seq[i + 1] - seq[i] === d) i++;
    res.push(seq[i]);
  }
  return res;
}