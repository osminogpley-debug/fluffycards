import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px var(--shadow-color);
  text-align: center;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;

const Icon = styled.span`
  font-size: 24px;
  margin-bottom: 12px;
  display: inline-block;
  color: var(--primary-color);
`;

const Title = styled.h3`
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
`;

function DashboardCard({ title, value, icon }) {
  return (
    <Card>
      <Icon>{icon}</Icon>
      <Title>{title}</Title>
      <Value>{value}</Value>
    </Card>
  );
}

export default DashboardCard;
