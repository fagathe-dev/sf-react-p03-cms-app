import { Button } from '@/ui/components/Base/Button';
import { Icon } from '@/ui/components/Base/Icon';
import { IconButton } from '@/ui/components/Base/IconButton';
import { ToggleField } from '@/ui/components/Forms/Fields/ToggleField';
import { TextField } from '@/ui/components/Forms/Fields/TextField';
import { Input } from '@/ui/components/Forms/Input';
import { Flex } from '@/ui/components/Grid/Flex';
import { BaseComponentProps } from '@/ui/types';
import styled from 'styled-components';
import { DEFAULT_TABLE_BLOCK_DATA } from './blockDefaults';

/**
 * Tableau : `rows[0]` est la ligne d'en-tête quand `hasHeader` est vrai
 */
export interface TableBlockData {
  rows: string[][];
  hasHeader: boolean;
  caption?: string;
}

export interface TableBlockProps extends BaseComponentProps {
  data: TableBlockData;
  onChange: (updated: TableBlockData) => void;
}

const Grid = styled.div`
  overflow-x: auto;
`;

const EditTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  td {
    padding: ${({ theme }) => theme.spacing[1]};
    vertical-align: middle;
  }
`;

const HeaderCell = styled.td`
  input {
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

const MAX_COLUMNS = 8;

export const TableBlock = ({ data, onChange, ...rest }: TableBlockProps) => {
  const rows = data.rows?.length ? data.rows : DEFAULT_TABLE_BLOCK_DATA.rows;
  const columnCount = Math.max(...rows.map((row) => row.length), 1);

  const update = (nextRows: string[][]) => onChange({ ...data, rows: nextRows });

  const setCell = (rowIndex: number, colIndex: number, value: string) =>
    update(rows.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row)));

  const addRow = () => update([...rows, Array.from({ length: columnCount }, () => '')]);
  const removeRow = (rowIndex: number) => update(rows.filter((_, r) => r !== rowIndex));
  const addColumn = () => update(rows.map((row, r) => [...row, r === 0 && data.hasHeader ? `Colonne ${columnCount + 1}` : '']));
  const removeColumn = (colIndex: number) => update(rows.map((row) => row.filter((_, c) => c !== colIndex)));

  return (
    <Flex direction="column" gap="0.75rem" {...rest}>
      <Grid>
        <EditTable>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isHeader = data.hasHeader && rowIndex === 0;
              const Cell = isHeader ? HeaderCell : 'td';

              return (
                <tr key={rowIndex}>
                  {Array.from({ length: columnCount }, (_, colIndex) => (
                    <Cell key={colIndex}>
                      <Input
                        aria-label={`Ligne ${rowIndex + 1}, colonne ${colIndex + 1}`}
                        placeholder={isHeader ? 'En-tête' : ''}
                        value={row[colIndex] ?? ''}
                        onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                      />
                    </Cell>
                  ))}
                  <td style={{ width: 36 }}>
                    <IconButton
                      name="close"
                      size="sm"
                      variant="ghost"
                      aria-label={`Supprimer la ligne ${rowIndex + 1}`}
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(rowIndex)}
                    />
                  </td>
                </tr>
              );
            })}
            <tr>
              {Array.from({ length: columnCount }, (_, colIndex) => (
                <td key={colIndex} style={{ textAlign: 'center' }}>
                  <IconButton
                    name="close"
                    size="sm"
                    variant="ghost"
                    aria-label={`Supprimer la colonne ${colIndex + 1}`}
                    disabled={columnCount <= 1}
                    onClick={() => removeColumn(colIndex)}
                  />
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </EditTable>
      </Grid>

      <Flex gap="0.5rem" wrap="wrap" align="center">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Icon name="table-row-plus-after" size={16} />
          Ligne
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn} disabled={columnCount >= MAX_COLUMNS}>
          <Icon name="table-column-plus-after" size={16} />
          Colonne
        </Button>
        <ToggleField
          label="Première ligne en en-tête"
          checked={data.hasHeader}
          onChange={(e) => onChange({ ...data, hasHeader: e.target.checked })}
        />
      </Flex>

      <TextField
        label="Légende (optionnelle)"
        placeholder="Ex : Comparatif des frameworks"
        value={data.caption || ''}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
      />
    </Flex>
  );
};
