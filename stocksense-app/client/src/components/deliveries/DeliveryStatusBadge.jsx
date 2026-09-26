import React from 'react';
import Badge from '../ui/Badge';

export default function DeliveryStatusBadge({ status, className = '' }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="neutral" className={className}>Draft</Badge>;
    case 'READY':
      return <Badge variant="warning" className={className}>Ready</Badge>;
    case 'DONE':
      return <Badge variant="success" className={className}>Done</Badge>;
    case 'CANCELED':
      return <Badge variant="error" className={className}>Canceled</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status || 'Unknown'}</Badge>;
  }
}
