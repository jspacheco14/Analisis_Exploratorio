import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const DataVisualizer = () => {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [chartType, setChartType] = useState('bar'); // Default to 'bar'
  const [min, setMin] = useState(null);
  const [max, setMax] = useState(null);
  const [mean, setMean] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [isNumericColumn, setIsNumericColumn] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // useEffect to calculate stats whenever the selected column or CSV data changes
  useEffect(() => {
    if (selectedColumn && csvData.length > 0) {
      const { min, max, mean } = calculateStats(selectedColumn);
      setMin(min);
      setMax(max);
      setMean(mean);
      setIsNumericColumn(csvData.some((row) => typeof row[selectedColumn] === 'number'))
    }
  }, [selectedColumn, csvData]);


  const calculateStats = (column) => {
    const values = csvData.map(row => row[column]).filter(value => typeof value === 'number');
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return { min, max, mean, values };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          setCsvData(result.data);
          setHeaders(result.meta.fields);
          setSelectedColumn(result.meta.fields[0]);
        },
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
    }
  };

  const getDatapointsChartData = (column) => {
    const values = Object.assign({}, csvData.map((row) => row[column]));
    return {
      labels: Object.keys(values),
      counts: Object.values(values),
    };
  };
  
  const calculateFrequencyData = (column) => {
    const values = csvData.map((row) => row[column]);
    const counts = values.reduce((acc, value) => {
      if (value !== null && value !== undefined) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});
    return {
      labels: Object.keys(counts),
      counts: Object.values(counts),
    };
  };

  const calculatePieData = (column) => {
    const { labels, counts } = calculateFrequencyData(column);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const percentages = counts.map((count) => ((count / total) * 100).toFixed(2));
    return {
      labels,
      percentages,
    };
  };

  const renderBarChart = (column) => {
    let labels = [];
    let counts = [];
    if (isNumericColumn) {
      ({ labels, counts } = getDatapointsChartData(column));
    } else {
      ({ labels, counts } = calculateFrequencyData(column));
    }
    return (
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Frequency',
              data: counts,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Frequency',
              },
            },
          },
        }}
      />
    );
  };

  const renderHistogramChart = (column) => {
    const { labels, counts } = calculateFrequencyData(column);
    return (
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Frequency',
              data: counts,
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Value',
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Frequency',
              },
            },
          },
        }}
      />
    );
  };

  const renderPieChart = (column) => {
    const { labels, percentages } = calculatePieData(column);
    return (
      <Pie
        data={{
          labels,
          datasets: [
            {
              label: 'Percentage',
              data: percentages,
              backgroundColor: labels.map(
                (_, idx) =>
                  `rgba(${75 + idx * 30}, ${192 - idx * 20}, ${192 - idx * 15}, 0.2)`
              ),
              borderColor: labels.map(
                (_, idx) =>
                  `rgba(${75 + idx * 30}, ${192 - idx * 20}, ${192 - idx * 15}, 1)`
              ),
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${context.raw}%`,
              },
            },
          },
        }}
      />
    );
  };

  const renderChart = () => {
    if (!selectedColumn) return null;

    if (chartType === 'histogram') {
      return renderHistogramChart(selectedColumn);
    } else if (chartType === 'bar') {
      return renderBarChart(selectedColumn);
    } else if (chartType === 'pie') {
      return renderPieChart(selectedColumn);
    }

    return null;
  };

  const renderMainTable = () => (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {csvData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
            <TableRow key={idx}>
              {headers.map((header) => (
                <TableCell key={header}>{row[header]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={csvData.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
      />
    </TableContainer>
  );

  const renderSummaryTable = () => {
    const summary = headers.map((header) => {
      const nonNullCount = csvData.filter((row) => row[header] !== null && row[header] !== undefined).length;
      const dataType = csvData.some((row) => typeof row[header] === 'number') ? 'Numeric' : 'String';
      return { header, nonNullCount, dataType };
    });

    return (
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Column Name</TableCell>
              <TableCell>Non-Null Count</TableCell>
              <TableCell>Data Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.header}</TableCell>
                <TableCell>{item.nonNullCount}</TableCell>
                <TableCell>{item.dataType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
      <Button variant="contained" component="label">
        Subir Archivo
        <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
      </Button>
      {csvData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="column-select-label">Columna</InputLabel>
            <Select id="column-select" labelId="column-select-label" label="Columna" value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)}>
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="chart-type-select-label">Tipo de grafico</InputLabel>
            <Select id="chart-type-select" labelId="chart-type-select-label" label="Tipo de grafico" value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <MenuItem value="bar">Barra</MenuItem>
              <MenuItem value="histogram">Histograma</MenuItem>
              <MenuItem value="pie">Torta</MenuItem>
            </Select>
          </FormControl>
          {isNumericColumn && min !== null && max !== null && mean !== null && (
            <Paper>
              <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', marginTop: '20px' }}>
                <ListItem>
                  <ListItemText primary="Mínimo" secondary={min} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Máximo" secondary={max} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Media" secondary={mean} />
                </ListItem>
              </List>
            </Paper>
          )}

          <Box sx={{ mt: 4 }}>{renderChart()}</Box>

          <Typography variant="h6" sx={{ mt: 4 }}>
            Datos
          </Typography>
          {renderMainTable()}

          <Typography variant="h6" sx={{ mt: 4 }}>
            Info
          </Typography>
          {renderSummaryTable()}
        </Box>
      )}
      {error && <Typography color="error">Error: {error}</Typography>}
    </Box>
  );
};

export default DataVisualizer;
