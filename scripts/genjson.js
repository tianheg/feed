const fs = require('fs')
const csv = require('csv-parser')

// Read the CSV file and convert it to JSON
const jsonData = []

fs.createReadStream('feed-list.csv')
  .pipe(csv())
  .on('data', (row) => {
    const updatedRow = {}
    Object.keys(row).forEach((key) => {
      updatedRow[key.trim()] = row[key].trim()
    })
    jsonData.push(updatedRow)
  })
  .on('end', () => {
    fs.writeFile('feed.json', JSON.stringify(jsonData, null, 2), (err) => {
      if (err) throw err
      console.log('CSV to JSON conversion complete')
    })
  })
