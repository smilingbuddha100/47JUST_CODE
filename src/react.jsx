import { useState } from 'react';
import { Search } from 'lucide-react';

export default function CommuteTimeCalculator() {
  const [csvData, setCsvData] = useState([]);
  const [homeLocation, setHomeLocation] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [commuteTime, setCommuteTime] = useState(null);
  const [availableHomeLocations, setAvailableHomeLocations] = useState([]);
  const [availableOfficeLocations, setAvailableOfficeLocations] = useState([]);
  const [availableTransportModes, setAvailableTransportModes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    setIsLoading(true);
    setError('');
    
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        processCSV(text);
      };
      reader.onerror = () => {
        setError('Error reading file');
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      setIsLoading(false);
    }
  };

  const processCSV = (csvText) => {
    try {
      // Split by lines and detect delimiter
      const lines = csvText.split('\n');
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty');
      }
      
      // Detect delimiter (comma, semicolon, or tab)
      const firstLine = lines[0].trim();
      let delimiter = ',';
      if (firstLine.includes(';')) delimiter = ';';
      else if (firstLine.includes('\t')) delimiter = '\t';
      
      // Extract headers
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Find required column indices
      const homeLocationIndex = headers.findIndex(h => 
        h.toLowerCase().includes('home') && h.toLowerCase().includes('location')
      );
      const officeLocationIndex = headers.findIndex(h => 
        h.toLowerCase().includes('office') && h.toLowerCase().includes('location')
      );
      const timeIndex = headers.findIndex(h => 
        (h.toLowerCase().includes('time') && h.toLowerCase().includes('taken')) ||
        h.toLowerCase().includes('duration') || 
        h.toLowerCase().includes('minutes')
      );
      const transportModeIndex = headers.findIndex(h => 
        h.toLowerCase().includes('transport') || 
        h.toLowerCase().includes('mode') || 
        h.toLowerCase().includes('vehicle') ||
        h.toLowerCase().includes('travel')
      );
      
      if (homeLocationIndex === -1 || officeLocationIndex === -1 || timeIndex === -1) {
        setError(`Could not find required columns in CSV. 
                 Looking for columns containing: 
                 - home location
                 - office location
                 - time taken/duration/minutes
                 - transport/mode/vehicle (optional)`);
        setIsLoading(false);
        return;
      }
      
      // Process data rows
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        // Parse CSV row handling quoted values
        const values = parseCSVLine(line, delimiter);
        
        if (values.length > Math.max(homeLocationIndex, officeLocationIndex, timeIndex)) {
          data.push({
            home_location_name: values[homeLocationIndex],
            office_location_name: values[officeLocationIndex],
            time_taken_minutes: values[timeIndex],
            transport_mode: transportModeIndex !== -1 ? values[transportModeIndex] : 'Not specified'
          });
        }
      }
      
      setCsvData(data);
      
      // Extract unique location names and transport modes
      const homeLocations = [...new Set(data.map(row => row.home_location_name))].filter(Boolean);
      const officeLocations = [...new Set(data.map(row => row.office_location_name))].filter(Boolean);
      const transportModes = [...new Set(data.map(row => row.transport_mode))].filter(Boolean);
      
      setAvailableHomeLocations(homeLocations);
      setAvailableOfficeLocations(officeLocations);
      setAvailableTransportModes(transportModes);
      setIsLoading(false);
    } catch (err) {
      setError('Error processing CSV: ' + err.message);
      setIsLoading(false);
    }
  };

  // Helper function to parse CSV line handling quotes properly
  const parseCSVLine = (line, delimiter) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim().replace(/^"|"$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    if (currentValue.trim() !== '') {
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
    }
    
    // If the parsing failed, fallback to basic split
    if (values.length <= 1) {
      return line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    }
    
    return values;
  };

  const findCommuteTime = () => {
    if (!homeLocation || !officeLocation) {
      setError('Please select both home and office locations');
      return;
    }

    let filteredData = csvData.filter(row => 
      row.home_location_name === homeLocation && 
      row.office_location_name === officeLocation
    );
    
    // If transport mode is selected, filter by that as well
    if (transportMode) {
      filteredData = filteredData.filter(row => row.transport_mode === transportMode);
    }

    if (filteredData.length > 0) {
      // If multiple matches, take the first one
      setCommuteTime({
        time: filteredData[0].time_taken_minutes,
        mode: filteredData[0].transport_mode
      });
      setError('');
    } else {
      setError('No commute data found for the selected criteria');
      setCommuteTime(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Commute Time Calculator</h1>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">
          Upload CSV File:
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
        {isLoading && <p className="text-gray-500 mt-2">Loading data...</p>}
      </div>

      {availableHomeLocations.length > 0 && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Home Location:
              <select
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Home Location</option>
                {availableHomeLocations.map((location, index) => (
                  <option key={home-${index}} value={location}>{location}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Office Location:
              <select
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Office Location</option>
                {availableOfficeLocations.map((location, index) => (
                  <option key={office-${index}} value={location}>{location}</option>
                ))}
              </select>
            </label>
          </div>

          {availableTransportModes.length > 0 && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                Mode of Transportation:
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Transportation Modes</option>
                  {availableTransportModes.map((mode, index) => (
                    <option key={mode-${index}} value={mode}>{mode}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button
            onClick={findCommuteTime}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Search className="mr-2" size={18} />
            Find Commute Time
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {commuteTime && (
        <div className="mt-6 p-4 bg-green-100 rounded-md">
          <h2 className="text-lg font-semibold text-green-800">Commute Time:</h2>
          <p className="text-xl font-bold text-green-900 mt-2">
            {commuteTime.time} minutes
          </p>
          <p className="text-sm text-green-700 mt-1">
            From {homeLocation} to {officeLocation}
          </p>
          <p className="text-sm text-green-700">
            Transportation: {commuteTime.mode}
          </p>
        </div>
      )}
    </div>
  );
}