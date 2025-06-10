import { useContext } from 'react';
import { DocumentContext } from '../contexts/DocumentContext';

export default function useDocuments() {
  return useContext(DocumentContext);
}