import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const FormWrapper = styled(PageWrapper)`
  max-width: 820px;
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
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`;

export const IdentityText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const ActionsGroup = styled.div`
  display: inline-flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
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
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const CenteredState = styled.div`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[7]} 0;
`;
