import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalLayout } from '../components/TerminalLayout';
import { FileUploader } from '../components/FileUploader';
import { useDataStore } from '../store/useDataStore';
import { Card, CardContent } from '../components/ui/card';

export function LandingPage() {
  const navigate = useNavigate();
  const { processedData, metrics } = useDataStore();

  // Navigate to dashboard if data is already loaded
  useEffect(() => {
    if (processedData.length > 0 && metrics) {
      navigate('/dashboard');
    }
  }, [processedData, metrics, navigate]);

  return (
    <TerminalLayout title="GoReportVisualizer+">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-terminal-text mb-4 animate-typing overflow-hidden whitespace-nowrap">
            Enhance Your Financial Reporting
          </h2>
          <p className="text-terminal-text/60 text-lg font-light">
            Upload your CSV or XLSX sales reports to generate interactive dashboards and performance analysis
          </p>
        </div>

        <FileUploader />

        <Card className="mt-12 bg-[#1a1a1a]">
          <CardContent className="p-6">
            <h3 className="text-terminal-text font-semibold mb-4">Supported File Formats:</h3>
            <ul className="space-y-2 text-terminal-text/70 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-terminal-text">✓</span>
                CSV files (.csv)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-terminal-text">✓</span>
                Excel files (.xlsx, .xls)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-terminal-text">✓</span>
                Multiple file uploads (automatically consolidated)
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </TerminalLayout>
  );
}

