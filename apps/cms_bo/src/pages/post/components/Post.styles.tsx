import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const NarrowWrapper = styled(PageWrapper)`
  max-width: 760px;
`;

export const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};

  & > :last-child {
    flex: 1 1 260px;
    max-width: 420px;
  }
`;

export const ActionsGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const TitleCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`;

export const Thumb = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.surfaceHover};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.text.muted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

/** Mise en page de l'éditeur : contenu principal + panneau latéral */
export const EditorLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[5]};
  align-items: start;

  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
`;

export const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  ${({ theme }) => theme.media.up('xl')} {
    position: sticky;
    top: ${({ theme }) => theme.spacing[4]};
  }
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const CenteredState = styled.div`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[7]} 0;
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;
