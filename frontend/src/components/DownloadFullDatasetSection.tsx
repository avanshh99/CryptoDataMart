import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import useListingContract from '../hooks/useListingContract';
import { FaDownload } from 'react-icons/fa'; 
import Spinner from './Spinner';

interface DownloadFullDatasetSectionProps {
  datasetId: number;
}

const DownloadFullDatasetSection: React.FC<DownloadFullDatasetSectionProps> = ({ datasetId }) => {
  const { fullDatasetLink, error, isLoading, fetchFullDatasetLink } = useListingContract();

  useEffect(() => {
    fetchFullDatasetLink(datasetId);
  }, [datasetId, fetchFullDatasetLink]);

  const handleDownload = () => {
    if (fullDatasetLink) {
      const link = document.createElement('a');
      link.href = fullDatasetLink;
      link.download = `dataset-${datasetId}.zip`;
      link.click();
    } else {
      toast.error('Dataset link not available.');
    }
  };

  return (
    <div className='mt-8'>
      <div className="flex items-center">
        <h4 className="text-2xl font-semibold text-primary_text">Download full dataset</h4>
        <FaDownload className="w-10" />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-2">
          <Spinner />
          <p className="text-gray-500">Loading dataset...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && fullDatasetLink && (
        <div className="mt-6">
          <button
            onClick={handleDownload}
            className="p-3 bg-primary text-white rounded-lg min-w-20 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
          >
            Download Full Dataset
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadFullDatasetSection;
