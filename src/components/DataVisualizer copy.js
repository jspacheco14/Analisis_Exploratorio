import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Line, Bar, Pie } from 'react-chartjs-2';

const DataVisualizer = () => {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [chartType, setChartType] = useState('bar'); // Default to 'bar'
  const [min, setMin] = useState(null);
  const [max, setMax] = useState(null);
  const [mean, setMean] = useState(null);
  const [error, setError] = useState(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          setCsvData(result.data);
          setHeaders(result.meta.fields);
          setSelectedColumn(result.meta.fields[0]);  // Set default column as first header
        },
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
    }
  };

  // Function to calculate min, max, mean for numeric columns
  const calculateStats = (column) => {
    const values = csvData.map(row => row[column]).filter(value => typeof value === 'number');
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return { min, max, mean, values };
  };

  // Function to create a histogram for string columns
  const createHistogram = (column) => {
    const counts = csvData.reduce((acc, row) => {
      const value = row[column];
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(counts).map(key => ({
      label: key,
      count: counts[key],
    }));
  };

  // useEffect to calculate stats whenever the selected column or CSV data changes
  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const { min, max, mean } = calculateStats(selectedColumn);
      setMin(min);
      setMax(max);
      setMean(mean);
    }
  }, [selectedColumn, csvData]);

  // Prepare data for min/max/mean graph
  const renderMinMaxMeanGraph = (column) => {
    const values = csvData.map(row => row[column]).filter(value => typeof value === 'number');

    return (
      <Line
        data={{
          labels: values.map((_, idx) => idx + 1), // X-axis as data index
          datasets: [
            {
              label: column,
              data: values,
              borderColor: 'blue',
              backgroundColor: 'blue',
              fill: false,
              tension: 0.1,
            },
          ],
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    );
  };

  // Prepare data for histogram (Bar/Pie) graph
  const renderCategoryChart = (column) => {
    const histogramData = createHistogram(column);

    const chartData = {
      labels: histogramData.map(item => item.label),
      datasets: [
        {
          label: 'Frequency',
          data: histogramData.map(item => item.count),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
    };

    // Render a Pie chart if selected, otherwise render a Bar chart
    return chartType === 'pie' ? (
      <Pie data={chartData} options={options} />
    ) : (
      <Bar data={chartData} options={options} />
    );
  };

  // Handle column selection
  const handleColumnSelect = (e) => {
    setSelectedColumn(e.target.value);
  };

  // Handle chart type selection
  const handleChartTypeSelect = (e) => {
    setChartType(e.target.value);
  };

  // Render chart dynamically based on column selection and chart type
  const renderChart = () => {
    if (!selectedColumn) return null;

    const isNumeric = csvData.some(row => typeof row[selectedColumn] === 'number');

    return isNumeric
      ? renderMinMaxMeanGraph(selectedColumn)
      : renderCategoryChart(selectedColumn);
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {csvData.length > 0 && (
        <div>
          <h2>Select Column to Visualize</h2>
          <select onChange={handleColumnSelect} value={selectedColumn}>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>

          <h2>Select Chart Type</h2>
          <select onChange={handleChartTypeSelect} value={chartType}>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>

          {min !== null && max !== null && mean !== null && (
            <div style={{ marginTop: '20px' }}>
              <h3>Statistics</h3>
              <p><strong>Min:</strong> {min}</p>
              <p><strong>Max:</strong> {max}</p>
              <p><strong>Mean:</strong> {mean}</p>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            {renderChart()}
          </div>
        </div>
      )}

      {error && <div>Error: {error}</div>}
    </div>
  );
};

export default DataVisualizer;
