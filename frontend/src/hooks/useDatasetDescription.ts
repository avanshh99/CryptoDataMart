import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useGeminiDescription from './useGeminiDescription';
import { RootState } from '../redux/store';
import { setDescription } from '../redux/description/descriptionSlice';


export const useDatasetDescription = (datasetId: number, promptTemplate: string, csvData: any[]) => {
  const dispatch = useDispatch();
  const savedDescription = useSelector((state: RootState) => state.descriptions[datasetId]);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(savedDescription || null);

  const { generatedDescription: apiDescription, loading: descriptionLoading, generateDescription } = useGeminiDescription();

  const generateDescriptionText = useCallback(() => {
    if (!csvData || !csvData.length || !promptTemplate) return;

    const numRows = csvData.length;
    const numCols = csvData[0] ? Object.keys(csvData[0]).length : 0;
    const columnNames = Object.keys(csvData[0]).join(', ');
    const sampleRows = csvData
      .slice(0, 3)
      .map((row, index) => `Row ${index + 1}: ${JSON.stringify(row)}`)
      .join('\n');

    const descriptionText = promptTemplate
      .replace("{{numRows}}", numRows.toString())
      .replace("{{numCols}}", numCols.toString())
      .replace("{{columnNames}}", columnNames)
      .replace("{{sampleRows}}", sampleRows);

    generateDescription(descriptionText);
  }, [csvData, promptTemplate, generateDescription]);

  useEffect(() => {
    if (savedDescription) {
      setGeneratedDescription(savedDescription);
    } else if (!descriptionLoading && !generatedDescription) {
      generateDescriptionText();
    }
  }, [savedDescription, descriptionLoading, generatedDescription, generateDescriptionText]);

  useEffect(() => {
    if (apiDescription && datasetId) {
      const cleanedDescription = apiDescription.replace(/<<NEWLINE>>/g, '\n');
      dispatch(setDescription({ id: datasetId, description: cleanedDescription }));
      setGeneratedDescription(cleanedDescription);
    }
  }, [apiDescription, datasetId, dispatch]);

  return { generatedDescription, descriptionLoading };
};
