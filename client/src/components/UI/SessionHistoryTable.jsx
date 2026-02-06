import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px var(--shadow-color);
`;

const TableHeader = styled.thead`
  background: linear-gradient(to right, #63b3ed, #4299e1);
  color: white;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: var(--bg-tertiary);
  }

  &:hover {
    background-color: var(--bg-hover);
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  text-align: left;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
`;

function SessionHistoryTable({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>История сессий пуста</p>;
  }

  return (
    <TableContainer>
      <StyledTable>
        <TableHeader>
          <tr>
            <TableHeaderCell>Дата</TableHeaderCell>
            <TableHeaderCell>Режим</TableHeaderCell>
            <TableHeaderCell>Карточек изучено</TableHeaderCell>
            <TableHeaderCell>Точность</TableHeaderCell>
            <TableHeaderCell>Время (мин)</TableHeaderCell>
          </tr>
        </TableHeader>
        <tbody>
          {sessions.map((session, index) => (
            <TableRow key={index}>
              <TableCell>
                {new Date(session.date).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </TableCell>
              <TableCell style={{ textTransform: 'capitalize' }}>
                {session.mode.replace(/-/g, ' ')}
              </TableCell>
              <TableCell>{session.cardsAttempted}</TableCell>
              <TableCell>
                {Math.round((session.correctAnswers / session.cardsAttempted) * 100)}%
              </TableCell>
              <TableCell>{Math.round(session.timeSpent / 60)}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
}

export default SessionHistoryTable;
