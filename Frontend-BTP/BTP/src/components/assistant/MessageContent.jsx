function parseInline(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    const token = match[0];
    if (token.startsWith('**')) parts.push({ type: 'strong', value: token.slice(2, -2) });
    else if (token.startsWith('*')) parts.push({ type: 'em', value: token.slice(1, -1) });
    else parts.push({ type: 'code', value: token.slice(1, -1) });
    last = match.index + token.length;
  }

  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts.length ? parts : [{ type: 'text', value: text }];
}

function InlineContent({ text }) {
  return parseInline(text).map((part, i) => {
    if (part.type === 'strong') return <strong key={i}>{part.value}</strong>;
    if (part.type === 'em') return <em key={i}>{part.value}</em>;
    if (part.type === 'code') return <code key={i}>{part.value}</code>;
    return <span key={i}>{part.value}</span>;
  });
}

function parseBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n') });
      i++;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push({ type: 'heading', level, content: line.replace(/^#+\s*/, '') });
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,3}\s/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !lines[i].trim().startsWith('```')) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', content: paraLines.join(' ') });
  }

  return blocks;
}

export default function MessageContent({ content }) {
  const blocks = parseBlocks(content || '');

  return (
    <div className="md-content">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
          return (
            <Tag key={index} className={`md-h${block.level}`}>
              <InlineContent text={block.content} />
            </Tag>
          );
        }

        if (block.type === 'p') {
          return (
            <p key={index} className="md-p">
              <InlineContent text={block.content} />
            </p>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={index} className="md-ul">
              {block.items.map((item, j) => (
                <li key={j}><InlineContent text={item} /></li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={index} className="md-ol">
              {block.items.map((item, j) => (
                <li key={j}><InlineContent text={item} /></li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={index} className="md-pre">
              <code>{block.content}</code>
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
}
