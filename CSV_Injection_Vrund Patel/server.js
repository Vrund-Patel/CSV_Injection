const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { exec } = require('child_process');

const app = express();
const csvFilePath = 'public/data.csv';

app.use(express.json());
app.use(express.static('public'));

function readCsv() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

function writeCsv(data) {
  return new Promise((resolve, reject) => {
    const csvStream = fs.createWriteStream(csvFilePath, { flags: 'w' });
    csvStream.write(Object.keys(data[0]).join(',') + '\n');
    data.forEach((row) => {
      csvStream.write(Object.values(row).join(',') + '\n');
    });
    csvStream.end();
    csvStream.on('finish', () => resolve());
    csvStream.on('error', (error) => reject(error));
  });
}

app.post('/add', async (req, res) => {
  const newData = req.body;
  if (!newData) {
    return res.status(400).json({ error: 'No data provided' });
  }

  try {
    const existingData = await readCsv();
    existingData.push(newData);
    await writeCsv(existingData);
    res.json({ message: 'Data added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/deleteRow', async (req, res) => {
  const { rowIndex } = req.body;

  try {
    let rows = await readCsv();
    if (rowIndex >= 0 && rowIndex < rows.length) {
      rows.splice(rowIndex, 1); 
      await writeCsv(rows);
      res.json({ message: 'Row deleted successfully' });
    } else {
      res.status(400).json({ error: 'Invalid row index' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/openExcel', (req, res) => {
  exec('start excel', (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Failed to open Excel' });
    }
    console.log('Excel opened successfully');
    res.json({ message: 'Excel opened successfully' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

