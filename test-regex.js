const title = "perf: ⚡ Bolt: optimize array transformation";
const headerPattern = /^([a-z]+)(?:\(([^)]+)\))?!?: (.+)$/;
const match = title.match(headerPattern);
console.log("Match:", match);
if (match) {
  const subject = match[3];
  console.log("Subject:", subject);
  const subjectPattern = /^[a-z].+/;
  console.log("Subject matches ^[a-z].+ ?", subjectPattern.test(subject));
}
