import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const FormWrapper = styled(PageWrapper)`
  max-width: 720px;
`;

export const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ActionsGroup = styled.div`
  display: inline-flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const Slug = styled.code`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const CenteredState = styled.div`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing[7]} 0;
`;
