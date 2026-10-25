import { ChoiceField } from '@/ui/components/Forms/Fields/ChoiceField';
import { TextareaField } from '@/ui/components/Forms/Fields/TextareaField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import { CODE_LANGUAGES } from './blockDefaults';

export interface CodeBlockData {
  language: string;
  code: string;
  filename?: string;
}

export interface CodeBlockProps extends BaseComponentProps {
  data: CodeBlockData;
  onChange: (updated: CodeBlockData) => void;
}

export const CodeBlock = ({ data, onChange, ...rest }: CodeBlockProps) => {
  const lineCount = (data.code || '').split('\n').length;

  return (
    <Flex direction="column" gap="0" {...rest}>
      <Flex gap="1rem" wrap="wrap">
        <div style={{ flex: '1 1 200px' }}>
          <ChoiceField
            label="Langage"
            value={data.language || 'plaintext'}
            onChange={(e) => onChange({ ...data, language: e.target.value })}
          >
            {CODE_LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </ChoiceField>
        </div>
        <div style={{ flex: '2 1 260px' }}>
          <TextField
            label="Nom du fichier (optionnel)"
            placeholder="Ex : src/Controller/PostController.php"
            value={data.filename || ''}
            onChange={(e) => onChange({ ...data, filename: e.target.value })}
          />
        </div>
      </Flex>

      <TextareaField
        label="Extrait de code"
        rows={Math.min(Math.max(lineCount + 1, 6), 30)}
        placeholder="Collez votre code ici…"
        spellCheck={false}
        style={{ fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '0.8125rem', tabSize: 2 }}
        value={data.code || ''}
        onChange={(e) => onChange({ ...data, code: e.target.value })}
        onKeyDown={(e) => {
          // Tabulation insérée dans le code plutôt que de quitter le champ
          if (e.key !== 'Tab' || e.shiftKey) return;
          e.preventDefault();
          const target = e.currentTarget;
          const { selectionStart, selectionEnd, value } = target;
          const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
          onChange({ ...data, code: next });
          requestAnimationFrame(() => target.setSelectionRange(selectionStart + 2, selectionStart + 2));
        }}
      />
    </Flex>
  );
};
