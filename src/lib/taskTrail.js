// Builds a readable hand-off trail for a task, e.g. "Nihar → You → Abhishek".
// givenByName = who assigned the task to the current director (blank if self-started).
// givenToName = who the current director forwarded the task to (blank if not forwarded).
export function taskTrail(task, ownerName = "You") {
  const parts = [];
  if (task.givenByName) parts.push(task.givenByName);
  parts.push(ownerName);
  if (task.givenToName) parts.push(task.givenToName);
  return parts.join(" → ");
}

// Whether a task has any assignment info at all (used to decide whether to show the trail badge).
export function hasTrail(task) {
  return Boolean(task.givenByName || task.givenToName);
}
