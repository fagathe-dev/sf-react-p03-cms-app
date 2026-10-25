// src/layouts/AppLayout/Layout.styles.tsx
import styled from 'styled-components';

export const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.body};
`;

export const MainColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const TopHeader = styled.header`
  height: 64px;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.background.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  position: sticky;
  top: 0;
  z-index: 20;
`;

export const SearchForm = styled.form`
  flex: 1;
  max-width: 420px;
  position: relative;
  display: flex;
  align-items: center;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]} ${theme.spacing[2]} 2.25rem`};
  border-radius: ${({ theme }) => theme.radii.base};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  background-color: ${({ theme }) => theme.colors.background.body};
  color: inherit;
  font-size: 0.875rem;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary.base};
  }
`;

export const SearchIconWrapper = styled.span`
  position: absolute;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
  opacity: 0.55;
`;

export const MainViewport = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[4]} 0;
  overflow-y: auto;
`;
