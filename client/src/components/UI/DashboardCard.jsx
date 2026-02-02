import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: center;
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;

const Icon = styled.span`
  font-size: 24px;
  margin-bottom: 12px;
  display: inline-block;
  color: #4257b2;
`;

const Title = styled.h3`
  color: #5f6368;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: #3d3d3d;
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
