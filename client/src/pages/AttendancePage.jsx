import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../constants/api';

// ===== CONSTANTS =====
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const STATUS_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  rescheduled: '#eab308'
};

const STATUS_LABELS = {
  present: 'Посетил',
  absent: 'Не посетил',
  rescheduled: 'Перенёс'
};

// ===== STYLES =====
const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 40px;
`;

const Header = styled.div`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 20px 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;

  &:hover { color: #63b3ed; }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;

  @media (max-width: 768px) { font-size: 20px; }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-secondary);
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);

  @media (max-width: 768px) {
    gap: 8px;
    padding: 6px 10px;
  }
`;

const MonthLabel = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 180px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 15px;
    min-width: 140px;
  }
`;

const NavBtn = styled.button`
  background: var(--bg-tertiary);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;

  &:hover { background: #63b3ed; color: white; }
`;

const AddStudentRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 15px;
  background: var(--bg-secondary);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const Btn = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;

  &.primary {
    background: linear-gradient(135deg, #63b3ed, #4299e1);
    color: white;
    box-shadow: 0 4px 12px rgba(99,179,237,0.3);
    &:hover { transform: translateY(-1px); }
  }

  &.danger {
    background: #fee2e2;
    color: #dc2626;
    &:hover { background: #fecaca; }
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
`;

const LegendDot = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.$color};
`;

const TableWrapper = styled.div`
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--shadow-color);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;

  th, td {
    border: 1px solid var(--border-color);
    text-align: center;
    vertical-align: middle;
  }

  th {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    padding: 10px 4px;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  td {
    padding: 0;
    height: 40px;
  }
`;

const NameCell = styled.td`
  padding: 8px 10px !important;
  text-align: left !important;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  min-width: 140px;
  position: sticky;
  left: 0;
  background: var(--bg-secondary);
  z-index: 1;
  border-right: 2px solid var(--border-color) !important;

  .student-actions {
    display: inline-flex;
    gap: 4px;
    margin-left: 6px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &:hover .student-actions {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .student-actions { opacity: 1; }
  }
`;

const NameCorner = styled.th`
  text-align: left !important;
  padding: 10px !important;
  min-width: 140px;
  position: sticky;
  left: 0;
  z-index: 3;
  background: var(--bg-tertiary);
  border-right: 2px solid var(--border-color) !important;
`;

const SmallBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  opacity: 0.7;

  &:hover { opacity: 1; }
`;

const DayCell = styled.td`
  cursor: pointer;
  transition: background 0.15s;
  position: relative;

  &:hover {
    background: var(--bg-hover);
  }
`;

const StatusDot = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  margin: auto;
  background: ${props => STATUS_COLORS[props.$status] || 'transparent'};
  transition: all 0.15s;

  @media (max-width: 768px) {
    width: 22px;
    height: 22px;
  }
`;

const StatusPicker = styled.div`
  position: fixed;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  gap: 6px;
`;

const StatusOption = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid ${props => props.$active ? 'var(--text-primary)' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;

  &:hover { transform: scale(1.1); }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);

  .icon { font-size: 56px; margin-bottom: 16px; }
  h3 { color: var(--text-primary); margin: 0 0 8px; }
  p { margin: 0 0 24px; }

  @media (max-width: 768px) {
    padding: 32px 16px;
    .icon { font-size: 42px; }
  }
`;

const StatusModeToggle = styled.div`
  display: flex;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 2px 8px var(--shadow-color);
`;

const ModeBtn = styled.button`
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  background: ${props => props.$active ? STATUS_COLORS[props.$status] : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};

  &:hover {
    background: ${props => props.$active ? STATUS_COLORS[props.$status] : 'var(--bg-tertiary)'};
  }
`;

// ===== COMPONENT =====
function AttendancePage() {
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStudentName, setNewStudentName] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [paintMode, setPaintMode] = useState('present'); // present | absent | rescheduled
  const [picker, setPicker] = useState(null); // {x, y, studentId, date, currentStatus}

  const loadSheet = useCallback(async () => {
    try {
      const res = await authFetch('/api/attendance');
      if (res.ok) {
        const data = await res.json();
        setSheet(data);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSheet(); }, [loadSheet]);

  // Close picker on click outside
  useEffect(() => {
    if (!picker) return;
    const handler = () => setPicker(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [picker]);

  const addStudent = async () => {
    if (!newStudentName.trim()) return;
    const res = await authFetch('/api/attendance/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newStudentName.trim() })
    });
    if (res.ok) {
      const data = await res.json();
      setSheet(data);
      setNewStudentName('');
    }
  };

  const removeStudent = async (studentId) => {
    if (!window.confirm('Удалить ученика?')) return;
    const res = await authFetch(`/api/attendance/students/${studentId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      setSheet(data);
    }
  };

  const setRecord = async (studentId, date, status) => {
    const res = await authFetch(`/api/attendance/students/${studentId}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, status })
    });
    if (res.ok) {
      const data = await res.json();
      setSheet(data);
    }
    setPicker(null);
  };

  const handleCellClick = (e, studentId, dateStr, currentStatus) => {
    e.stopPropagation();
    // Quick paint mode: just set/toggle with selected paint mode
    setRecord(studentId, dateStr, paintMode);
  };

  const handleCellRightClick = (e, studentId, dateStr, currentStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setPicker({
      x: Math.min(e.clientX, window.innerWidth - 170),
      y: Math.min(e.clientY, window.innerHeight - 60),
      studentId,
      date: dateStr,
      currentStatus
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getRecord = (student, day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return student.records?.find(r => r.date === dateStr);
  };

  const makeDateStr = (day) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <PageContainer>
        <Content>Загрузка...</Content>
      </PageContainer>
    );
  }

  const students = sheet?.students || [];

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <div>
            <BackButton onClick={() => navigate('/dashboard')}>← Назад</BackButton>
            <Title>📋 Посещаемость</Title>
          </div>
        </HeaderContent>
      </Header>

      <Content>
        {/* Add student */}
        <AddStudentRow>
          <Input
            type="text"
            placeholder="Имя ученика..."
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          />
          <Btn className="primary" onClick={addStudent}>➕ Добавить</Btn>
        </AddStudentRow>

        {/* Controls */}
        <Controls>
          <MonthNav>
            <NavBtn onClick={prevMonth}>◀</NavBtn>
            <MonthLabel>{MONTHS_RU[currentMonth]} {currentYear}</MonthLabel>
            <NavBtn onClick={nextMonth}>▶</NavBtn>
          </MonthNav>

          <StatusModeToggle>
            <ModeBtn
              $active={paintMode === 'present'}
              $status="present"
              onClick={() => setPaintMode('present')}
            >
              ✅ Посетил
            </ModeBtn>
            <ModeBtn
              $active={paintMode === 'absent'}
              $status="absent"
              onClick={() => setPaintMode('absent')}
            >
              ❌ Не посетил
            </ModeBtn>
            <ModeBtn
              $active={paintMode === 'rescheduled'}
              $status="rescheduled"
              onClick={() => setPaintMode('rescheduled')}
            >
              🔄 Перенёс
            </ModeBtn>
          </StatusModeToggle>
        </Controls>

        {/* Legend */}
        <Legend>
          <LegendItem><LegendDot $color={STATUS_COLORS.present} /> Посетил</LegendItem>
          <LegendItem><LegendDot $color={STATUS_COLORS.absent} /> Не посетил</LegendItem>
          <LegendItem><LegendDot $color={STATUS_COLORS.rescheduled} /> Перенёс</LegendItem>
          <LegendItem style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
            ЛКМ — отметить • ПКМ — выбрать статус
          </LegendItem>
        </Legend>

        {students.length === 0 ? (
          <EmptyState>
            <div className="icon">👨‍🏫</div>
            <h3>Нет учеников</h3>
            <p>Добавьте учеников, чтобы начать отслеживать посещаемость</p>
          </EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <NameCorner>Ученик</NameCorner>
                  {days.map(d => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id}>
                    <NameCell>
                      {student.name}
                      <span className="student-actions">
                        <SmallBtn
                          title="Удалить"
                          onClick={() => removeStudent(student._id)}
                        >
                          🗑️
                        </SmallBtn>
                      </span>
                    </NameCell>
                    {days.map(day => {
                      const record = getRecord(student, day);
                      const dateStr = makeDateStr(day);
                      return (
                        <DayCell
                          key={day}
                          onClick={(e) => handleCellClick(e, student._id, dateStr, record?.status)}
                          onContextMenu={(e) => handleCellRightClick(e, student._id, dateStr, record?.status)}
                          title={record ? STATUS_LABELS[record.status] : 'Кликните для отметки'}
                        >
                          {record && <StatusDot $status={record.status} />}
                        </DayCell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Content>

      {/* Context menu picker */}
      {picker && (
        <StatusPicker
          style={{ left: picker.x, top: picker.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <StatusOption
            $color={STATUS_COLORS.present}
            $active={picker.currentStatus === 'present'}
            onClick={() => setRecord(picker.studentId, picker.date, 'present')}
            title="Посетил"
          >
            ✅
          </StatusOption>
          <StatusOption
            $color={STATUS_COLORS.absent}
            $active={picker.currentStatus === 'absent'}
            onClick={() => setRecord(picker.studentId, picker.date, 'absent')}
            title="Не посетил"
          >
            ❌
          </StatusOption>
          <StatusOption
            $color={STATUS_COLORS.rescheduled}
            $active={picker.currentStatus === 'rescheduled'}
            onClick={() => setRecord(picker.studentId, picker.date, 'rescheduled')}
            title="Перенёс"
          >
            🔄
          </StatusOption>
        </StatusPicker>
      )}
    </PageContainer>
  );
}

export default AttendancePage;
