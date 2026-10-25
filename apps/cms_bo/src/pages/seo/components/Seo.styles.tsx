import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[5]};
  align-items: start;

  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  ${({ theme }) => theme.media.up('md')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const Code = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing[3]};
  max-height: 420px;
  overflow: auto;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.base};
  color: ${({ theme }) => theme.colors.text.body};
`;

export const CenteredState = styled.div`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[6]} 0;
`;
