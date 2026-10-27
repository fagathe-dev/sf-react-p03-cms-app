import styled from 'styled-components';

// Styles partagés par les pages Super Admin (aperçu des e-mails, logs)

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/** Colonne latérale de largeur fixe + zone principale ; empilées sous le breakpoint md */
export const SplitLayout = styled.div<{ $asideWidth: string }>`
  display: grid;
  grid-template-columns: ${({ $asideWidth }) => $asideWidth} minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  min-width: 0;
`;

export const CenteredBox = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
`;
