import { Fragment, ReactNode } from 'react';
import styled from 'styled-components';

const Content = styled.div`
  color: ${({ theme }) => theme.colors.text.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};

  p {
    margin: 0 0 ${({ theme }) => theme.spacing[3]};
  }

  h2,
  h3,
  h4 {
    margin: ${({ theme }) => `${theme.spacing[5]} 0 ${theme.spacing[2]}`};
    color: ${({ theme }) => theme.colors.text.heading};
  }

  ul,
  ol {
    margin: 0 0 ${({ theme }) => theme.spacing[3]};
    padding-left: ${({ theme }) => theme.spacing[5]};
  }

  code {
    padding: 0.1em 0.35em;
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 0.9em;
    background-color: ${({ theme }) => theme.colors.background.surfaceHover};
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  a {
    color: ${({ theme }) => theme.colors.primary.base};
  }
`;

// Ordre de priorité : code, lien, gras, italique
const INLINE_PATTERN = /(`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;

const isSafeUrl = (url: string) => /^(https?:\/\/|\/|#|mailto:)/i.test(url);

const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE_PATTERN).map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={idx}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, url] = link;
      return url && isSafeUrl(url) ? (
        <a key={idx} href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {label}
        </a>
      ) : (
        <Fragment key={idx}>{label}</Fragment>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });

/**
 * Rendu Markdown minimal et sûr (aucun HTML injecté) pour l'aperçu des blocs texte :
 * titres (##, ###, ####), listes (- / 1.), paragraphes, **gras**, *italique*, `code`, [liens](url)
 */
export const Markdown = ({ content }: { content: string }) => {
  const groups = content.replace(/\r\n/g, '\n').split(/\n{2,}/);

  return (
    <Content>
      {groups.map((group, idx) => {
        const lines = group.split('\n').filter((line) => line.trim() !== '');
        if (lines.length === 0) return null;

        const heading = /^(#{2,4})\s+(.*)$/.exec(lines[0]!);
        if (heading && lines.length === 1) {
          const level = heading[1]!.length;
          const Tag = (`h${level}` as 'h2' | 'h3' | 'h4');
          return <Tag key={idx}>{renderInline(heading[2]!)}</Tag>;
        }

        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={idx}>
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
          return (
            <ol key={idx}>
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx}>
            {lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </Content>
  );
};
