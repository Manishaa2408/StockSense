import React from 'react';
import Badge from '../ui/Badge';

export default function TransferStatusBadge({ status, className = '' }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="neutral" className={className}>Draft</Badge>;
    case 'READY':
      return <Badge variant="warning" className={className}>Ready</Badge>;
    case 'IN_TRANSIT':
      return <Badge variant="info" className={className}>In Transit</Badge>;
    case 'COMPLETED':
      return <Badge variant="success" className={className}>Completed</Badge>;
    case 'CANCELED':
      return <Badge variant="error" className={className}>Canceled</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status || 'Unknown'}</Badge>;
  }
}
