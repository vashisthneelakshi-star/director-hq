// Detects http(s):// and www. URLs inside a plain text string and renders
// them as clickable <a> links, leaving the rest of the text untouched.
// Used anywhere a director might paste a Zoom/Meet link, a doc link, etc.
// (meeting location, task description, credential URL).

const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

export function Linkify({ text, className = "" }) {
  if (!text) return null;

  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  // reset regex state since it's a shared `g` regex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    let url = match[0];
    // don't swallow trailing punctuation like ) . , that isn't part of the link
    let trailing = "";
    const trailMatch = url.match(/[.,;:!?)\]]+$/);
    if (trailMatch) {
      trailing = trailMatch[0];
      url = url.slice(0, url.length - trailing.length);
    }

    const href = url.startsWith("http") ? url : `https://${url}`;

    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-brand-600 underline decoration-brand-200 hover:text-brand-700"
      >
        {url}
      </a>
    );

    if (trailing) nodes.push(trailing);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}
